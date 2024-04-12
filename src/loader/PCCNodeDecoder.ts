import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { MountPoint } from '@/runtime/MountPoint';
import { PCCAnimation, PCCRotateAnimation } from '../runtime/PCCAnimation';
import { Compatibility } from './Compatibility';

export interface PCCNodeInfo {
  rootCompatibility: Compatibility | undefined;
  name: string;

  toggleTargets: TransformNode[];
  disableObjectConstraints: TransformNode[];

  mountPoint: MountPoint;

  animation: PCCAnimation | undefined;
}

interface InternalNodeInfo
  extends Omit<PCCNodeInfo, 'disableObjectConstraints'> {
  disableObjectConstraints: string[];
}

interface NodeParseResult {
  rootCompatibility: Compatibility | undefined;
  name: string;

  isToggle: boolean;
  disableObjectConstraints: string[];

  isMountPoint: boolean;
  mountPointCompatability: Compatibility | undefined;

  animation: string | undefined;
}

export class PCCNodeDecoder {
  private _nodeInfoMap: Map<string, InternalNodeInfo & PCCNodeInfo>;

  public constructor() {
    this._nodeInfoMap = new Map();
  }

  public addNode(transformNode: TransformNode): PCCNodeInfo | undefined {
    const info = this._parseNode(transformNode.name);

    if (info === undefined) {
      return undefined;
    }

    let nodeInfo = this._nodeInfoMap.get(info.name);
    if (nodeInfo === undefined) {
      nodeInfo = {
        rootCompatibility: undefined,
        name: info.name,
        toggleTargets: [],
        disableObjectConstraints: [],
        mountPoint: new MountPoint(info.name, []),
        animation: undefined,
      };
      this._nodeInfoMap.set(info.name, nodeInfo);
    }

    if (info.rootCompatibility) {
      nodeInfo.rootCompatibility = info.rootCompatibility;
    }

    if (info.isToggle) {
      nodeInfo.toggleTargets.push(transformNode);
    }

    if (info.disableObjectConstraints.length > 0) {
      nodeInfo.disableObjectConstraints.push(...info.disableObjectConstraints);
    }

    if (info.isMountPoint && info.mountPointCompatability !== undefined) {
      nodeInfo.mountPoint.points.push({
        node: transformNode,
        compatability: info.mountPointCompatability,
      });
    }

    if (info.animation !== undefined) {
      // fot now, only rotate animation
      if (info.animation === 'rotate') {
        nodeInfo.animation = new PCCRotateAnimation(
          transformNode,
          transformNode.name + '_rotate',
          4.0,
        );
      }
    }

    return nodeInfo;
  }

  private _parseNode(nodeInfo: string): NodeParseResult | undefined {
    if (nodeInfo.indexOf(':') === -1) {
      return undefined;
    }

    const [flags, name] = nodeInfo.split(':');
    const flagArray = this._splitByToplevelCommas(flags);
    const uniqueName = name.split('.')[0];

    const parsedNode = this._parseFlags(flagArray);
    parsedNode.name = uniqueName;

    return parsedNode;
  }

  private _splitByToplevelCommas(str: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < str.length; ++i) {
      if (str[i] === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else if (str[i] === '"') {
        inQuotes = !inQuotes;
        current += str[i];
      } else {
        current += str[i];
      }
    }
    result.push(current);
    return result;
  }

  private _parseFlags(flags: string[]): NodeParseResult {
    const result: NodeParseResult = {
      rootCompatibility: undefined,
      name: '',
      isToggle: false,
      disableObjectConstraints: [],
      isMountPoint: false,
      mountPointCompatability: undefined,
      animation: undefined,
    };

    for (let i = 0; i < flags.length; ++i) {
      const [flagType, flagValue] = flags[i].split('"');

      switch (flagType) {
        case 'rc': // root node with compatibility info
          result.rootCompatibility =
            Compatibility.parseFromCompatString(flagValue);
          break;
        case 'c': // compatibility info
          result.mountPointCompatability =
            Compatibility.parseFromCompatString(flagValue);
          break;
        case 'd': // disable object constraints
          result.disableObjectConstraints =
            this._splitByToplevelCommas(flagValue);
          break;
        case 'toggle': // toggleable node
          result.isToggle = true;
          break;
        case 'mount_point': // mount point
          result.isMountPoint = true;
          break;
        case 'anim': // animation
          result.animation = flagValue;
          break;
      }
    }

    return result;
  }

  public resolveNodes(): PCCNodeInfo[] {
    // resolve disableObjectConstraints
    const nodeInfoMap = this._nodeInfoMap;
    for (const nodeInfo of nodeInfoMap.values()) {
      if (typeof nodeInfo.disableObjectConstraints[0] !== 'string') {
        continue;
      }

      const disableObjectConstraints = [
        ...new Set(nodeInfo.disableObjectConstraints as string[]),
      ];

      nodeInfo.disableObjectConstraints = [];
      for (let i = 0; i < disableObjectConstraints.length; ++i) {
        const target = nodeInfoMap.get(disableObjectConstraints[i]);
        if (target !== undefined) {
          nodeInfo.disableObjectConstraints.push(...target.toggleTargets);
        }
      }
    }

    return Array.from(nodeInfoMap.values());
  }
}
