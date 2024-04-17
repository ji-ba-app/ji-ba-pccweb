import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { DeepImmutable } from '@babylonjs/core/types';
import { PCCNodeInfo } from '@/loader/PCCNodeDecoder';
import { TaskExecutor } from './TaskExecutor';
import { ReadonlyTask } from './Task';

class ToggleActiveCounter {
  private readonly _target: TransformNode;
  private readonly _taskExecutor: TaskExecutor;
  private readonly _disabledToggles: Set<object>;
  private readonly _targetInitialPosition: DeepImmutable<Vector3>;

  public constructor(target: TransformNode, taskExecutor: TaskExecutor) {
    this._target = target;
    this._taskExecutor = taskExecutor;
    this._disabledToggles = new Set<object>();
    this._targetInitialPosition = target.position.clone();
  }

  public get enabled(): boolean {
    if (this._disabledToggles.size > 0) {
      return false;
    }
    return true;
  }

  public disable(
    self: object,
    dependencies: ReadonlyTask[],
  ): ReadonlyTask | undefined {
    if (this._disabledToggles.size === 0) {
      const toggleDisableTask = this.toggleDisable(dependencies);
      this._disabledToggles.add(self);
      return toggleDisableTask;
    } else {
      this._disabledToggles.add(self);
      return undefined;
    }
  }

  public enable(
    self: object,
    dependencies: ReadonlyTask[],
  ): ReadonlyTask | undefined {
    this._disabledToggles.delete(self);
    if (this._disabledToggles.size === 0) {
      return this.toggleEnable(dependencies);
    }
    return undefined;
  }

  private static _rotationQuaternion: Quaternion = Quaternion.Identity();
  private static _tempVector: Vector3 = Vector3.Zero();

  private toggleEnable(dependencies: ReadonlyTask[]): ReadonlyTask {
    const taskExecutor = this._taskExecutor;

    const finalDeps = [
      ...dependencies,
      ...taskExecutor.collectTasksWithTarget(this._target),
    ];

    const parentWorldScale =
      (this._target.parent as TransformNode)?.absoluteScaling?.x ?? 1;

    const rotation = this._target.rotationQuaternion
      ? this._target.rotationQuaternion
      : Quaternion.FromEulerAnglesToRef(
          this._target.rotation.x,
          this._target.rotation.y,
          this._target.rotation.z,
          ToggleActiveCounter._rotationQuaternion,
        );

    const task = taskExecutor.executeTransitionTask(
      this._target,
      finalDeps,
      () => this._target.setEnabled(true),
      () => void 0,
      0.5,
      this._targetInitialPosition
        .clone()
        .addInPlace(
          ToggleActiveCounter._tempVector
            .set(0, 0.03 / parentWorldScale, 0)
            .applyRotationQuaternionInPlace(rotation),
        ),
      this._targetInitialPosition,
    );

    return task;
  }

  private toggleDisable(dependencies: ReadonlyTask[]): ReadonlyTask {
    const taskExecutor = this._taskExecutor;

    const finalDeps = [
      ...dependencies,
      ...taskExecutor.collectTasksWithTarget(this._target),
    ];

    const parentWorldScale =
      (this._target.parent as TransformNode)?.absoluteScaling?.x ?? 1;

    const rotation = this._target.rotationQuaternion
      ? this._target.rotationQuaternion
      : Quaternion.FromEulerAnglesToRef(
          this._target.rotation.x,
          this._target.rotation.y,
          this._target.rotation.z,
          ToggleActiveCounter._rotationQuaternion,
        );

    const task = taskExecutor.executeTransitionTask(
      this._target,
      finalDeps,
      () => void 0,
      () => this._target.setEnabled(false),
      0.5,
      this._targetInitialPosition,
      this._targetInitialPosition
        .clone()
        .addInPlace(
          ToggleActiveCounter._tempVector
            .set(0, 0.03 / parentWorldScale, 0)
            .applyRotationQuaternionInPlace(rotation),
        ),
    );

    return task;
  }
}

export class ToggleTarget {
  private static _activeCounters: WeakMap<TransformNode, ToggleActiveCounter> =
    new WeakMap();

  private getActiveCounter(target: TransformNode): ToggleActiveCounter {
    let activeCounter = ToggleTarget._activeCounters.get(target);
    if (activeCounter === undefined) {
      activeCounter = new ToggleActiveCounter(target, this._taskExecutor!);
      ToggleTarget._activeCounters.set(target, activeCounter);
    }
    return activeCounter;
  }

  public readonly name: string;
  public readonly targets: TransformNode[];

  private _enabled: boolean;
  private _taskExecutor: TaskExecutor | undefined;

  public constructor(name: string, targets: TransformNode[]) {
    this.name = name;
    this.targets = targets;

    this._enabled = true;
  }

  public setTaskExecutor(taskExecutor: TaskExecutor): void {
    this._taskExecutor = taskExecutor;
  }

  public get enabled(): boolean {
    return this._enabled;
  }

  public setEnabled(enabled: boolean): ReadonlyTask[] {
    if (this._enabled === enabled) {
      return [];
    }

    this._enabled = enabled;

    const targets = this.targets;

    if (!enabled) {
      const detachTasks = this.detachAllDecendantComponents();
      const activeDisableConstraintTasks =
        this.activeDisableConstraints(detachTasks);

      const disableTasks: ReadonlyTask[] = [];
      for (let i = 0; i < targets.length; ++i) {
        const target = targets[i];
        const activeCounter = this.getActiveCounter(target);
        const task = activeCounter.disable(this, activeDisableConstraintTasks);
        if (task !== undefined) {
          disableTasks.push(task);
        }
      }

      const inactiveDisableConstraintTasks =
        this.inactiveDisableConstraints(disableTasks);

      return inactiveDisableConstraintTasks;
    } else {
      const activeDisableConstraintTasks = this.activeDisableConstraints([]);

      const enableTasks: ReadonlyTask[] = [];
      for (let i = 0; i < targets.length; ++i) {
        const target = targets[i];
        const activeCounter = this.getActiveCounter(target);
        const task = activeCounter.enable(this, activeDisableConstraintTasks);
        if (task !== undefined) {
          enableTasks.push(task);
        }
      }

      const inactiveDisableConstraintTasks =
        this.inactiveDisableConstraints(enableTasks);

      return inactiveDisableConstraintTasks;
    }
  }

  private detachAllDecendantComponents(): ReadonlyTask[] {
    const detachTasks: ReadonlyTask[] = [];

    const visited = new Set<TransformNode>();

    const stack = [...this.targets];
    while (stack.length > 0) {
      const node = stack.pop()!;
      if (visited.has(node)) {
        continue;
      }
      visited.add(node);

      const metadata = node.metadata as Partial<PCCNodeInfo>;

      if (metadata.rootCompatibility !== undefined) continue;

      if (metadata.mountPoint !== undefined) {
        const detachResult = metadata.mountPoint.detach(true);
        if (detachResult !== undefined) {
          detachTasks.push(detachResult[1]);
        }
        continue;
      }

      const children = node.getChildTransformNodes(true);

      for (let i = 0; i < children.length; ++i) {
        stack.push(children[i]);
      }
    }

    return detachTasks;
  }

  private activeDisableConstraints(
    dependencies: ReadonlyTask[],
  ): ReadonlyTask[] {
    const disableTasks: ReadonlyTask[] = [];

    for (let i = 0; i < this.targets.length; ++i) {
      const target = this.targets[i];
      const disableConstraints = (target.metadata as Partial<PCCNodeInfo>)
        .disableObjectConstraints;

      if (disableConstraints !== undefined) {
        for (let j = 0; j < disableConstraints.length; ++j) {
          const disableConstraint = disableConstraints[j];
          const activeCounter = this.getActiveCounter(disableConstraint);
          const task = activeCounter.disable(target, dependencies);

          if (task !== undefined) {
            disableTasks.push(task);
          }
        }
      }
    }

    return disableTasks;
  }

  private inactiveDisableConstraints(
    dependencies: ReadonlyTask[],
  ): ReadonlyTask[] {
    const enableTasks: ReadonlyTask[] = [];

    for (let i = 0; i < this.targets.length; ++i) {
      const target = this.targets[i];
      const disableConstraints = (target.metadata as Partial<PCCNodeInfo>)
        .disableObjectConstraints;

      if (disableConstraints !== undefined) {
        for (let j = 0; j < disableConstraints.length; ++j) {
          const disableConstraint = disableConstraints[j];
          const activeCounter = this.getActiveCounter(disableConstraint);
          const task = activeCounter.enable(target, dependencies);

          if (task !== undefined) {
            enableTasks.push(task);
          }
        }
      }
    }

    return enableTasks;
  }
}
