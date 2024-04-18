import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Compatibility } from '@/loader/Compatibility';
import { PCCModel } from './PCCModel';
import { TaskExecutor } from './TaskExecutor';
import { ReadonlyTask } from './Task';

/**
 * Transform node for a mount point and its compatability
 */
interface Point {
  /**
   * Transform node for the mount point
   */
  node: TransformNode;

  /**
   * Compatability of the mount point
   */
  compatability: Compatibility;
}

/**
 * A mount point for a PC componant
 */
export class MountPoint {
  /**
   * Name of the mount point
   */
  public readonly name: string;

  /**
   * List of points
   */
  public readonly points: Point[];

  private _attachedModel: PCCModel | undefined;
  private _taskExecutor: TaskExecutor | undefined;
  private _disabled: boolean;

  /**
   * Create a new mount point
   * @param name Name of the mount point
   * @param points List of points
   */
  public constructor(name: string, points: Point[]) {
    this.name = name;
    this.points = points;

    this._attachedModel = undefined;
    this._taskExecutor = undefined;
    this._disabled = false;
  }

  public disable(): void {
    this._disabled = true;
  }

  public clone(): MountPoint {
    const points: Point[] = [];
    for (let i = 0; i < this.points.length; ++i) {
      const point = this.points[i];
      points.push({
        node: point.node,
        compatability: point.compatability.clone(),
      });
    }
    return new MountPoint(this.name, points);
  }

  public setTaskExecutor(taskExecutor: TaskExecutor): void {
    this._taskExecutor = taskExecutor;
  }

  public attach(
    model: PCCModel,
    skipAnimation = false,
  ): ReadonlyTask | undefined {
    if (this._disabled) {
      return undefined;
    }

    if (model.isDisposed) {
      return undefined;
    }
    const point = this.findCompatiblePoint(model);
    if (point === undefined) {
      return undefined;
    }

    if (this._attachedModel !== undefined) {
      this.detach(true);
    }

    if (model.mountedPoint !== undefined) {
      model.mountedPoint.detach(true);
    }
    model.mountedPoint = this;

    this._attachedModel = model;

    const taskExecutor = this._taskExecutor!;

    const dependencies = taskExecutor.collectTasksWithTarget(model.root);

    const parentWorldScale =
      (model.root.parent as TransformNode)?.absoluteScaling?.x ?? 1;

    const task = taskExecutor.executeTransitionTask(
      model.root,
      dependencies,
      () => this.attachAtPoint(point, model),
      () => void 0,
      0.5,
      model.root.position
        .clone()
        .addInPlaceFromFloats(0, 0.03 / parentWorldScale, 0),
      model.root.position,
    );
    if (skipAnimation) taskExecutor.forceFinish(task);

    return task;
  }

  private attachAtPoint(point: Point, model: PCCModel): void {
    model.root.setEnabled(true);
    model.root.setParent(point.node, false, false);
    model.root.rotationQuaternion = null;
    model.root.rotation.set(0, 0, 0);

    if (!point.node.isEnabled(true)) {
      this.detach(true);
    }
  }

  private findCompatiblePoint(model: PCCModel): Point | undefined {
    const points = this.points;
    for (let i = 0; i < points.length; ++i) {
      const point = points[i];

      if (
        point.compatability.isCompatibleWith(
          model.root.metadata.rootCompatibility,
        )
      ) {
        return point;
      }
    }
    return undefined;
  }

  public detach(
    recursive: boolean,
    skipAnimation = false,
  ): [PCCModel, ReadonlyTask] | undefined {
    const taskExecutor = this._taskExecutor!;

    const attachedModel = this._attachedModel;
    if (!attachedModel) return undefined;
    this._attachedModel = undefined;

    attachedModel.mountedPoint = undefined;

    const dependencies = taskExecutor.collectTasksWithTarget(
      attachedModel.root,
    );

    if (recursive) {
      const mountPoints = attachedModel.mountPoints;
      for (let i = 0; i < mountPoints.length; ++i) {
        const detachResult = mountPoints[i].detach(true);
        if (detachResult !== undefined) {
          dependencies.push(detachResult[1]);
        }
      }
    }

    const parentWorldScale =
      (attachedModel.root.parent as TransformNode)?.absoluteScaling?.x ?? 1;

    const task = taskExecutor.executeTransitionTask(
      attachedModel.root,
      dependencies,
      () => void 0,
      () => this.detachInternal(attachedModel),
      0.5,
      attachedModel!.root.position,
      attachedModel!.root.position
        .clone()
        .addInPlaceFromFloats(0, 0.03 / parentWorldScale, 0),
    );

    if (skipAnimation) {
      taskExecutor.forceFinish(task);
    }

    return [attachedModel, task];
  }

  private detachInternal(attachedModel: PCCModel): void {
    attachedModel.root.setParent(null, false, false);
    attachedModel.root.position.set(0, 0, 0);
    attachedModel.root.rotationQuaternion = null;
    attachedModel.root.rotation.set(0, 0, 0);
    attachedModel.root.setEnabled(false);
  }

  public checkPointAvailability(index: number): boolean {
    let node = this.points[index]?.node;
    if (!node) return false;

    if (!node.isEnabled(true)) return false;

    return true;
  }

  public get attachedModel(): PCCModel | undefined {
    return this._attachedModel;
  }
}
