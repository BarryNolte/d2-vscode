import path = require("path");

import {
  CustomExecution,
  Event,
  EventEmitter,
  Pseudoterminal,
  TaskPanelKind,
  TaskRevealKind,
  tasks,
} from "vscode";
import { outputChannel } from "./extension";
import { d2Tasks } from "./tasks";
import { TaskEx } from "./taskProvider";

// eslint-disable-next-line no-unused-vars
export type TaskRunnerCallback = (data: string) => void;
// eslint-disable-next-line no-unused-vars
export type TaskOutput = (text: string, flag?: boolean) => void;
// eslint-disable-next-line no-unused-vars
export type TaskFunction = (text: string,filePath: string, log?: TaskOutput, terminal?: TaskOutput) => string;
/**
 * TaskRunner - This creates CustomTask and Pseudotermial to run it in.
 * This will return immediately, the tasks callback should be called
 * when the task is finished.
 */
export class TaskRunner {
  public retVal = "";
  public genTask(
    filename: string,
    text: string,
    callback: TaskRunnerCallback
  ): void {
    const pty = new CustomTaskTerminal(filename, text, callback, (t, f) => {
      console.log(t);
      console.log(f);

      return "foobar";
    });

    const ce = new CustomExecution(
      (): Promise<CustomTaskTerminal> =>
        new Promise((resolve) => {
          resolve(pty);
        })
    );

    const task = new TaskEx("My Named Task", { type: "D2" }, ce, [
      "$D2Matcher",
    ]);

    task.presentationOptions = {
      echo: true,
      reveal: TaskRevealKind.Silent,
      focus: false,
      clear: false,
      panel: TaskPanelKind.Dedicated,
      showReuseMessage: false,
    };

    tasks.executeTask(task);
  }
}

/**
 * CustomTaskTerminal - Implimentation of a Pseudoterminal that
 * allows for output to the Pseudoterminal that can be scraped
 * with a problemMatcher to put links to jump to the errors in
 * the document.
 */
class CustomTaskTerminal implements Pseudoterminal {
  private writeEmitter = new EventEmitter<string>();
  private closeEmitter = new EventEmitter<number>();

  onDidWrite: Event<string> = this.writeEmitter.event;
  onDidClose?: Event<number> = this.closeEmitter.event;

  private fileName: string;
  private fileDirectory: string;
  private docText: string;
  private callback: TaskRunnerCallback;
  private taskCallback?: TaskFunction;

  constructor(
    filename: string,
    text: string,
    callback: TaskRunnerCallback,
    taskCallback?: TaskFunction
  ) {
    this.fileName = path.parse(filename).base;
    this.fileDirectory = path.parse(filename).dir;
    this.docText = text;
    this.callback = callback;
    this.taskCallback = taskCallback;
  }

  private logging = (msg: string): void => {
    outputChannel.appendInfo(msg);
  };

  private terminal = (err: string, flag?: boolean): void => {
    if (flag === true) {
      this.writeLine(
        `[${path.join(this.fileDirectory, this.fileName)}] ${err}`
      );
    } else {
      this.writeLine(err);
    }
  };

  open(): void {
    const s = this.taskCallback?.(this.docText, this.fileDirectory);
    console.log(s);

    const data: string = d2Tasks.compile(
      this.docText,
      this.fileDirectory,
      this.logging,
      this.terminal
    );

    this.callback(data);

    // This is the magic bullet to complete the task.
    this.closeEmitter.fire(0);
  }

  close(): void {
    this.closeEmitter.fire(0);
  }

  private write(msg: string): void {
    this.writeEmitter.fire(msg);
  }

  private writeLine(msg: string): void {
    this.write(msg + "\r\n");
  }
}
