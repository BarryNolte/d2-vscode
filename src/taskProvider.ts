import {
  CustomExecution,
  ShellExecution,
  Task,
  TaskDefinition,
  TaskProvider,
  TaskScope,
} from "vscode";

export class TaskEx extends Task {
  name: string;
  constructor(
    name: string,
    def: TaskDefinition,
    ce: CustomExecution,
    pm?: string | string[] | undefined
  ) {
    super(def, TaskScope.Workspace, "D2", "D2 Extension", ce, pm);
    this.name = name;
  }
}

export class CustomBuildTaskProvider implements TaskProvider {
  private tasks: Task[] | undefined;

  public provideTasks(): Task[] {
    console.log("Providing Tasks");

    return this.getTasks();
  }

  public resolveTask(_task: Task): Task | undefined {
    console.log("Resolving Task: " + _task);

    return this.getTask("");
  }

  private getTasks(): Task[] {
    if (this.tasks !== undefined) {
      return this.tasks;
    }

    this.tasks = [];
    this.tasks?.push(this.getTask("Show Preview"));
    this.tasks?.push(this.getTask("Compile to SVG"));

    return this.tasks;
  }

  private getTask(name: string): Task {
    const definition = { type: "D2" };

    return new TaskEx(name, definition, new ShellExecution("ls"), [
      "$D2Matcher",
    ]);
  }
}
