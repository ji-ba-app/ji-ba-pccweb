import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { ReadonlyTask, SynchoronousTask, Task, TransitionTask } from './Task';

export class TaskExecutor {
  private _tasks: Set<Task>;
  private _pendingTasks: Task[];
  private _runningTasks: Task[];

  public constructor() {
    this._tasks = new Set();
    this._pendingTasks = [];
    this._runningTasks = [];
  }

  public executeSynchronousTask<T>(
    target: T,
    runAfter: ReadonlyTask[],
    callback: () => void,
  ): ReadonlyTask<T> | undefined {
    const task = new SynchoronousTask(target, runAfter, callback);
    const isReady = task.isReady;
    if (isReady) {
      task.update(0);
      return undefined;
    } else {
      this._tasks.add(task);
      this._pendingTasks.push(task);
    }

    return task;
  }

  public executeTransitionTask(
    target: TransformNode,
    runAfter: ReadonlyTask[],
    onStart: () => void,
    onEnd: () => void,
    duration: number,
    initialPoisition: Vector3,
    finalPosition: Vector3,
  ): ReadonlyTask<TransformNode> {
    const task = new TransitionTask(
      target,
      runAfter,
      onStart,
      onEnd,
      duration,
      initialPoisition,
      finalPosition,
    );

    this._tasks.add(task);
    if (task.isReady) {
      this._runningTasks.push(task);
    } else {
      this._pendingTasks.push(task);
    }

    return task;
  }

  public update(deltaTime: number): void {
    let synchoronousTaskExecuted = false;

    const runningTasks = this._runningTasks;
    for (let i = 0; i < runningTasks.length; ++i) {
      const runningTask = runningTasks[i];

      runningTask.update(deltaTime);
      if (runningTask.isSynchoronous) {
        synchoronousTaskExecuted = true;
      }

      if (runningTask.isFinished) {
        runningTasks.splice(i, 1);
        i -= 1;

        this._tasks.delete(runningTask);
      }
    }

    const pendingTasks = this._pendingTasks;
    for (let i = 0; i < pendingTasks.length; ++i) {
      const task = pendingTasks[i];
      if (task.isReady) {
        if (task.isSynchoronous) {
          task.update(0);
          synchoronousTaskExecuted = true;

          this._tasks.delete(task);
        } else {
          runningTasks.push(task);
          task.update(deltaTime);
        }

        pendingTasks.splice(i, 1);
        i -= 1;
      }
    }

    while (synchoronousTaskExecuted) {
      synchoronousTaskExecuted = false;

      for (let i = 0; i < pendingTasks.length; ++i) {
        const pendingTask = pendingTasks[i];
        if (pendingTask.isSynchoronous && pendingTask.isReady) {
          pendingTask.update(0);
          synchoronousTaskExecuted = true;

          if (pendingTask.isFinished) {
            pendingTasks.splice(i, 1);
            i -= 1;

            this._tasks.delete(pendingTask);
          }
        }
      }
    }
  }

  public forceFinish(...tasks: ReadonlyTask[]): void {
    const addedTasks = new Set<Task>();
    const dependencies: Task[] = [];

    const stack = [...new Set(tasks as Task[])];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (addedTasks.has(current)) {
        continue;
      }
      dependencies.push(current);
      addedTasks.add(current);

      const runAfter = current.runAfter as Task[];
      for (let i = 0; i < runAfter.length; ++i) {
        stack.push(runAfter[i]);
      }
      current.runAfter.length = 0;
    }

    for (let i = dependencies.length - 1; i >= 0; --i) {
      dependencies[i].forceFinish();
    }
  }

  public get tasks(): ReadonlySet<Task> {
    return this._tasks;
  }

  public collectTasksWithTarget(target: any): ReadonlyTask[] {
    const collectedTasks: Task[] = [];

    for (const task of this._tasks) {
      if (task.target === target) {
        collectedTasks.push(task);
      }
    }

    return collectedTasks;
  }

  public collectTasksWithTargets(targets: any[]): ReadonlyTask[] {
    const collectedTasks: Task[] = [];

    const targetSet = new Set(targets);
    for (const task of this._tasks) {
      if (targetSet.has(task.target)) {
        collectedTasks.push(task);
      }
    }

    return collectedTasks;
  }
}
