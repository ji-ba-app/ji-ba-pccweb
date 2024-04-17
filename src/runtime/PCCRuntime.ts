import { Scene } from '@babylonjs/core/scene';
import { PCCModelLoader } from '../loader/PCCModelLoader';
import { PCCModel } from './PCCModel';
import { TaskExecutor } from './TaskExecutor';

export class PCCRuntime {
  private _loader: PCCModelLoader;
  private _taskExecutor: TaskExecutor;

  private _scene: Scene;
  private _models: PCCModel[] = [];
  private _isRegistered: boolean;
  private _updateBinded: () => void;

  private _animationTime;
  private _isPlayingAnimation;

  private _baseModel: PCCModel | undefined;

  public constructor(scene: Scene) {
    this._loader = new PCCModelLoader(scene);
    this._taskExecutor = new TaskExecutor();

    this._scene = scene;
    this._models = [];
    this._isRegistered = false;
    this._updateBinded = (): void =>
      this._update(scene.getEngine().getDeltaTime() / 1000);

    this._animationTime = 0;
    this._isPlayingAnimation = false;

    this._baseModel = undefined;
  }

  public register(): void {
    if (this._isRegistered) {
      return;
    }
    this._isRegistered = true;

    this._scene.onBeforeRenderObservable.add(this._updateBinded);
  }

  public unregister(): void {
    if (!this._isRegistered) {
      return;
    }
    this._isRegistered = false;

    this._scene.onBeforeRenderObservable.removeCallback(this._updateBinded);
  }

  public playAnimation(): void {
    this._isPlayingAnimation = true;
  }

  public stopAnimation(): void {
    this._isPlayingAnimation = false;
  }

  private _update(deltaTime: number): void {
    if (this._isPlayingAnimation) {
      this._animationTime += deltaTime;
      const animationTime = this._animationTime;

      const models = this._models;
      for (let i = 0; i < models.length; ++i) {
        models[i].animate(animationTime);
      }
    }

    this._taskExecutor.update(deltaTime);
  }

  public async addModel(modelUrl: string): Promise<PCCModel | undefined> {
    const model = await this._loader.loadModel(modelUrl, this._taskExecutor);
    if (model === undefined) {
      return undefined;
    }

    this._models.push(model);
    return model;
  }

  public setBaseModel(model: PCCModel): void {
    if (this._baseModel !== undefined) {
      this._baseModel.root.setEnabled(false);
    }

    this._baseModel = model;
    this._baseModel.root.setEnabled(true);
  }

  public get baseModel(): PCCModel | undefined {
    return this._baseModel;
  }
}
