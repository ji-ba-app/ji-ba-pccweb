import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { PCCRuntime } from './runtime/PCCRuntime';

export class PCBuildSceneBuilder {
  public readonly runtime: PCCRuntime;
  private _camera: Camera | undefined;
  private readonly _scene: Scene;

  public constructor(engine: Engine) {
    const [scene, camera, runtime] = this._createScene(engine);
    this.runtime = runtime;
    this._camera = camera;
    this._scene = scene;
  }

  private _createScene(engine: Engine): [Scene, Camera, PCCRuntime] {
    const scene = new Scene(engine);

    scene.clearColor = new Color4(0.9, 0.9, 0.9, 1.0);

    const degToRad = Math.PI / 180;

    const camera = new ArcRotateCamera(
      'camera1',
      115 * degToRad, // alpha
      80 * degToRad, // beta
      1.1, // radius
      new Vector3(0, 0.2, 0), // target
      scene,
    );
    camera.minZ = 0.001;
    camera.maxZ = 10;
    camera.attachControl(undefined, true);
    camera.inertia = 0.8;
    camera.wheelDeltaPercentage = 0.005;
    camera.pinchDeltaPercentage = 0.001;
    camera.lowerRadiusLimit = 0.2;
    camera.upperRadiusLimit = 2;
    camera.panningDistanceLimit = 0.3;
    camera.panningInertia = 0.8;
    camera.panningSensibility = 3000;
    camera.angularSensibilityX = 1000;
    camera.angularSensibilityY = 1000;
    this._camera = camera;

    const hemisphericLight = new HemisphericLight(
      'hemisphericLight', // name
      new Vector3(0, 1, 0), // direction
      scene,
    );
    hemisphericLight.intensity = 0.5;
    hemisphericLight.specular = new Color3(0, 0, 0);
    hemisphericLight.groundColor = new Color3(1, 1, 1);

    const directionalLight = new DirectionalLight(
      'directionalLight', // name
      new Vector3(0.5, -1, 1), // direction
      scene,
    );
    directionalLight.intensity = 0.5;
    directionalLight.autoCalcShadowZBounds = false;
    directionalLight.autoUpdateExtends = false;
    directionalLight.shadowOrthoScale = 0;

    const runtime = new PCCRuntime(scene);
    runtime.register();

    return [scene, camera, runtime];
  }

  public get camera(): Camera | undefined {
    return this._camera;
  }

  public dispose() {
    if (this._scene) {
      this._scene.dispose();
    }

    this._camera = undefined;
  }
}
