import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Node } from '@babylonjs/core/node';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Observable } from '@babylonjs/core/Misc/observable';
import { Compatibility, ComponentType } from '../loader/Compatibility';
import { PCCNodeInfo } from '../loader/PCCNodeDecoder';
import { PCCAnimation } from './PCCAnimation';
import { MountPoint } from './MountPoint';
import { ToggleTarget } from './ToggleTarget';
import { TaskExecutor } from './TaskExecutor';
import { ReadonlyTask } from './Task';

interface PCCRootTransformNode extends TransformNode {
  metadata: PCCNodeInfo & { rootCompatibility: Compatibility };
}

const FileNameMap: Record<string, string | undefined> = {
  case_sample: '机箱',
  '120mm_fan_sample': '120mm 风扇',
  atx_motherboard_sample: 'ATX 主板',
  cooler_sample: '风冷散热',
  cpu_sample: 'CPU',
  gpu_sample: 'GPU',
  ddr4_ram_sample: 'DDR4 内存条',
  nvme_ssd_sample: '固态硬盘',
  atx_power_sample: 'ATX 电源',
};

/**
 * Describe a PC componant model
 */
export class PCCModel {
  public readonly taskExecutor: TaskExecutor;

  /**
   * Root transform node
   */
  public readonly root: PCCRootTransformNode;

  /**
   * Source url of the model
   */
  public readonly url: string;

  /**
   * Product name
   */
  public readonly name: string;

  /**
   * Product type (e.g. "case", "motherboard", "cpu", "gpu", "ram", "storage")
   */
  public readonly type: ComponentType;

  /**
   * List of toggle targets
   */
  public readonly toggleTargets: ToggleTarget[];

  /**
   * List of mount points
   */
  public readonly mountPoints: MountPoint[];

  /**
   * List of animations
   */
  public readonly animations: PCCAnimation[];

  /** @internal */
  public mountedPoint: MountPoint | undefined;

  private _originalModel: PCCModel | undefined;
  private _instanceModels: PCCModel[];

  private _pendingDisposal: boolean;

  public onDisposeEarlyObservable: Observable<PCCModel>;
  public onDisposeObservable: Observable<PCCModel>;
  private _isDisposed: boolean;

  public constructor(
    taskExecutor: TaskExecutor,
    root: TransformNode,
    url: string,
    name: string,
    type: ComponentType,
    toggleTargets: ToggleTarget[],
    mountPoints: MountPoint[],
    animations: PCCAnimation[],
    originalModel?: PCCModel,
  ) {
    this.taskExecutor = taskExecutor;
    this.root = root;
    this.url = url;
    this.name = FileNameMap[name] || name;
    this.type = type;
    this.toggleTargets = toggleTargets;
    for (let i = 0; i < toggleTargets.length; ++i) {
      toggleTargets[i].setTaskExecutor(taskExecutor);
    }
    this.mountPoints = mountPoints;
    for (let i = 0; i < mountPoints.length; ++i) {
      mountPoints[i].setTaskExecutor(taskExecutor);
    }
    this.animations = animations;

    this.mountedPoint = undefined;

    this._originalModel = originalModel;
    this._instanceModels = originalModel ? originalModel._instanceModels : [];

    this._pendingDisposal = false;

    this.onDisposeEarlyObservable = new Observable();
    this.onDisposeObservable = new Observable();
    this._isDisposed = false;
  }

  public animate(time: number): void {
    const animations = this.animations;
    for (let i = 0; i < animations.length; ++i) {
      animations[i].animate(time);
    }
  }

  private copyNodeInfo(nodeInfo: PCCNodeInfo): PCCNodeInfo {
    return {
      rootCompatibility: nodeInfo.rootCompatibility?.clone(),
      name: nodeInfo.name,
      toggleTargets: nodeInfo.toggleTargets,
      disableObjectConstraints: nodeInfo.disableObjectConstraints,
      mountPoint: nodeInfo.mountPoint.clone(),
      animation: nodeInfo.animation,
    };
  }

  public createInstance(name: string): PCCModel {
    // todo: perfect clone when animation is playing

    const clonedRoot = this.root.clone(this.root.name, null, true)!;
    clonedRoot.setEnabled(false);

    const rootWorldMatrix = this.root.computeWorldMatrix(true);
    rootWorldMatrix.decompose(clonedRoot.scaling);

    const nodeMap = new Map<Node, Node>();
    const nodeInfoMap = new Map<string, PCCNodeInfo>();

    clonedRoot.metadata = this.copyNodeInfo(this.root.metadata as PCCNodeInfo);
    nodeInfoMap.set(clonedRoot.metadata.name, clonedRoot.metadata);

    const visited = new Set<Node>();

    const stack: {
      original: Node;
      clone: Node;
    }[] = [
      {
        original: this.root,
        clone: clonedRoot,
      },
    ];
    nodeMap.set(this.root, clonedRoot);

    while (stack.length > 0) {
      const { original, clone } = stack.pop()!;

      if (visited.has(original)) {
        console.warn('Circular reference detected');
        continue;
      }
      visited.add(original);

      const descendants = original.getChildren(undefined, true);
      for (let i = 0; i < descendants.length; ++i) {
        const originalDescendant = descendants[i];

        if (
          // skip the attached model
          (originalDescendant.metadata as PCCNodeInfo)?.rootCompatibility !==
          undefined
        ) {
          continue;
        }

        let clonedDescendant: Node;
        if (originalDescendant instanceof Mesh) {
          const instancedMesh = (clonedDescendant =
            originalDescendant.createInstance(originalDescendant.name));
          instancedMesh.parent = clone;
        } else {
          clonedDescendant = originalDescendant.clone(
            originalDescendant.name,
            clone,
            true,
          )!;
        }
        if (clonedDescendant.metadata) {
          let nodeInfo = nodeInfoMap.get(
            (originalDescendant.metadata as PCCNodeInfo).name,
          );
          if (nodeInfo === undefined) {
            nodeInfo = this.copyNodeInfo(
              originalDescendant.metadata as PCCNodeInfo,
            );
            nodeInfoMap.set(nodeInfo.name, nodeInfo);
          }

          clonedDescendant.metadata = nodeInfo;
        }

        nodeMap.set(originalDescendant, clonedDescendant);

        stack.push({
          original: originalDescendant,
          clone: clonedDescendant,
        });
      }
    }

    const toggleTargets: ToggleTarget[] = [];
    const mountPoints: MountPoint[] = [];
    const animations: PCCAnimation[] = [];

    // update metadata references
    for (const nodeInfo of nodeInfoMap.values()) {
      const nodeInfoToggleTargets: TransformNode[] = [];
      for (let i = 0; i < nodeInfo.toggleTargets.length; ++i) {
        nodeInfoToggleTargets.push(
          nodeMap.get(nodeInfo.toggleTargets[i])! as TransformNode,
        );
      }
      nodeInfo.toggleTargets = nodeInfoToggleTargets;

      const disableObjectConstraints: TransformNode[] = [];
      for (let i = 0; i < nodeInfo.disableObjectConstraints.length; ++i) {
        disableObjectConstraints.push(
          nodeMap.get(nodeInfo.disableObjectConstraints[i])! as TransformNode,
        );
      }
      nodeInfo.disableObjectConstraints = disableObjectConstraints;

      const mountPointPoints = nodeInfo.mountPoint.points;
      for (let i = 0; i < mountPointPoints.length; ++i) {
        const point = mountPointPoints[i];
        point.node = nodeMap.get(point.node) as TransformNode;
      }

      nodeInfo.animation = nodeInfo.animation?.clone(
        nodeMap.get(nodeInfo.animation.target) as TransformNode,
      );

      // collect toggle targets, mount points, and animations

      if (nodeInfo.toggleTargets.length > 0) {
        toggleTargets.push(
          new ToggleTarget(nodeInfo.name, nodeInfo.toggleTargets),
        );
      }

      if (nodeInfo.mountPoint.points.length > 0) {
        mountPoints.push(nodeInfo.mountPoint);
      }

      if (nodeInfo.animation !== undefined) {
        animations.push(nodeInfo.animation);
      }
    }

    const instance = new PCCModel(
      this.taskExecutor,
      clonedRoot,
      this.url,
      name,
      this.type,
      toggleTargets,
      mountPoints,
      animations,
      this._originalModel ?? this,
    );

    this._instanceModels.push(instance);
    return instance;
  }

  public dispose(skipAnimation = false): void {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;

    this.onDisposeEarlyObservable.notifyObservers(this);

    const dependencies: ReadonlyTask[] = [];

    if (this.mountedPoint !== undefined) {
      const detachResult = this.mountedPoint.detach(false);
      if (detachResult !== undefined) {
        dependencies.push(detachResult[1]);
      }
    }

    const mountPoints = this.mountPoints;
    for (let i = 0; i < mountPoints.length; ++i) {
      const detachResult = mountPoints[i].detach(true);
      if (detachResult !== undefined) {
        dependencies.push(detachResult[1]);
      }

      mountPoints[i].disable();
    }

    const taskExecutor = this.taskExecutor;
    const task = taskExecutor.executeSynchronousTask(this, dependencies, () =>
      this.disposeInternal(),
    );

    if (skipAnimation && task !== undefined) {
      taskExecutor.forceFinish(task);
    }
  }

  private disposeInternal(): void {
    if (this._originalModel === undefined) {
      if (this._instanceModels.length > 0) {
        this._pendingDisposal = true;
        this.root.setEnabled(false);
      } else {
        this.onDisposeObservable.notifyObservers(this);
        this.root.dispose(false, true);
      }
    } else {
      const index = this._instanceModels.indexOf(this);
      if (index >= 0) {
        this._instanceModels.splice(index, 1);
      }
      this.onDisposeObservable.notifyObservers(this);
      this.root.dispose(false, false);

      if (
        this._originalModel._pendingDisposal &&
        this._instanceModels.length === 0
      ) {
        this._originalModel.onDisposeObservable.notifyObservers(this);
        this._originalModel.root.dispose(false, true);
      }
    }
  }

  public get isDisposed(): boolean {
    return this._isDisposed;
  }
}
