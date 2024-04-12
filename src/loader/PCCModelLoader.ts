import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders/glTF/2.0/glTFLoader';
import { AssetContainer } from '@babylonjs/core/assetContainer';
import { Scene } from '@babylonjs/core/scene';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Node } from '@babylonjs/core/node';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Material } from '@babylonjs/core/Materials/material';
import { MultiMaterial } from '@babylonjs/core/Materials/multiMaterial';
import { BaseTexture } from '@babylonjs/core/Materials/Textures/baseTexture';
import { MountPoint } from '@/runtime/MountPoint';
import { ToggleTarget } from '@/runtime/ToggleTarget';
import { TaskExecutor } from '@/runtime/TaskExecutor';
import { staticAssetServerUrl } from '../Constants';
import { PCCAnimation } from '../runtime/PCCAnimation';
import { PCCModel } from '../runtime/PCCModel';
import { PCCNodeInfo, PCCNodeDecoder } from './PCCNodeDecoder';

export class PCCModelLoader {
  private _scene: Scene;

  private _uniqueModels: Map<string, Promise<PCCModel | undefined>>;

  public constructor(scene: Scene) {
    this._scene = scene;
    this._uniqueModels = new Map();
  }

  private _onDisposeModel = (model: PCCModel): void => {
    this._uniqueModels.delete(model.url);
  };

  public async loadModel(
    modelUrl: string,
    taskExecutor: TaskExecutor,
  ): Promise<PCCModel | undefined> {
    const uniqueModel = await this._uniqueModels.get(modelUrl);
    if (uniqueModel !== undefined) {
      return uniqueModel.createInstance(uniqueModel.name + '_instance');
    }

    let resolvePromise: (value: PCCModel | undefined) => void = null!;
    const promise = new Promise<PCCModel | undefined>(
      resolve => (resolvePromise = resolve),
    );
    this._uniqueModels.set(modelUrl, promise);

    let assetContainer: AssetContainer;
    try {
      assetContainer = await this._loadAssetContainer(modelUrl);
    } catch (e) {
      console.error('Failed to load model ' + modelUrl);
      resolvePromise(undefined);
      return undefined;
    }

    const decoder = new PCCNodeDecoder();

    const transformNodes = assetContainer.transformNodes;
    for (let i = 0; i < transformNodes.length; ++i) {
      const node = transformNodes[i];
      node.metadata = decoder.addNode(node);
    }

    const nodeInfoList = decoder.resolveNodes();

    let root: TransformNode | undefined;
    for (let i = 0; i < transformNodes.length; ++i) {
      const node = transformNodes[i];
      if ((node.metadata as PCCNodeInfo)?.rootCompatibility !== undefined) {
        if (root !== undefined) {
          console.warn('Multiple root nodes found using the first one');
          node.dispose(false);
        }
        root = node;
      }
    }

    if (root === undefined) {
      console.error(modelUrl + ' is not pcc model');
      assetContainer.dispose();
      resolvePromise(undefined);
      return undefined;
    }

    if (root.parent) {
      root.setParent(null, true, true);
      root.position.set(0, 0, 0);
      assetContainer.rootNodes.push(root);
    }

    this._filterAssetContainer(assetContainer);
    this._removeUnboundedAssets(assetContainer, root);

    root.setEnabled(false);
    assetContainer.addAllToScene();

    const rootNodeInfo = root.metadata as PCCNodeInfo;
    const toggleTargets: ToggleTarget[] = [];
    const mountPoints: MountPoint[] = [];
    const animations: PCCAnimation[] = [];
    for (let i = 0; i < nodeInfoList.length; ++i) {
      const nodeInfo = nodeInfoList[i];

      if (nodeInfo.toggleTargets !== undefined) {
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

    const pccModel = new PCCModel(
      taskExecutor, // runtime
      root, // root
      modelUrl, // url
      rootNodeInfo.name, // name
      rootNodeInfo.rootCompatibility!.type, // component type
      toggleTargets, // toggle targets
      mountPoints, // mount points
      animations, // animations
    );
    pccModel.onDisposeObservable.addOnce(this._onDisposeModel);

    resolvePromise(pccModel);
    return pccModel;
  }

  private async _loadAssetContainer(modelUrl: string): Promise<AssetContainer> {
    return SceneLoader.LoadAssetContainerAsync(
      staticAssetServerUrl,
      modelUrl,
      this._scene,
    );
  }

  private _filterAssetContainer(assetContainer: AssetContainer): void {
    const cameras = assetContainer.cameras;
    for (let i = 0; i < cameras.length; ++i) {
      cameras[i].dispose(false);
    }
    assetContainer.cameras.length = 0;

    const rootNodes = assetContainer.rootNodes;
    let root: Node | undefined;
    for (let i = 0; i < rootNodes.length; ++i) {
      if (
        (rootNodes[i].metadata as PCCNodeInfo)?.rootCompatibility === undefined
      ) {
        rootNodes[i].dispose(false);
      } else {
        if (root !== undefined) {
          console.warn('Multiple root nodes found using the first one');
          rootNodes[i].dispose(false);
        }
        root = rootNodes[i];
      }
    }
    assetContainer.rootNodes.length = 0;
    if (root !== undefined) {
      assetContainer.rootNodes.push(root);
    }
  }

  private _removeUnboundedAssets(
    assetContainer: AssetContainer,
    root: TransformNode,
  ): void {
    const unboundedMaterials = new Set<Material>();
    const materials = assetContainer.materials;
    for (let i = 0; i < materials.length; ++i) {
      unboundedMaterials.add(materials[i]);
    }
    const unboundedTextures = new Set<BaseTexture>();
    const textures = assetContainer.textures;
    for (let i = 0; i < textures.length; ++i) {
      unboundedTextures.add(textures[i]);
    }

    const stack = [root];
    while (stack.length > 0) {
      const node = stack.pop()!;
      const children = node.getChildTransformNodes(false);
      for (let i = 0; i < children.length; ++i) {
        stack.push(children[i]);
      }

      if (node instanceof Mesh) {
        const material = node.material;
        if ((material as MultiMaterial)?.subMaterials) {
          const subMaterials = (material as MultiMaterial).subMaterials;
          for (let i = 0; i < subMaterials.length; ++i) {
            const subMaterial = subMaterials[i];
            if (subMaterial) {
              unboundedMaterials.delete(subMaterial);
            }
          }
        }

        if (material !== null) {
          unboundedMaterials.delete(material);

          const materialTextures = material.getActiveTextures();
          for (let i = 0; i < materialTextures.length; ++i) {
            const texture = materialTextures[i];
            unboundedTextures.delete(texture);
          }
        }
      }
    }

    for (const material of unboundedMaterials) {
      material.dispose(false);
    }

    for (const texture of unboundedTextures) {
      texture.dispose();
    }
  }
}
