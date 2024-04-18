import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { Engine } from '@babylonjs/core/Engines/engine';
// import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { useEffect, useState } from 'react';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import '@babylonjs/core/Materials/Textures/Loaders/envTextureLoader';
import { CubeTexture } from '@babylonjs/core';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';

import { PCCRuntime } from './runtime/PCCRuntime';
import useEngine from './ui/hooks/useEngine';

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

    const environmentTexture = CubeTexture.CreateFromPrefilteredData(
      'res/studio.env',
      scene,
    );
    scene.environmentTexture = environmentTexture;
    scene.environmentIntensity = 0.1;

    const blur = 0.6;

    const hdrSkybox = CreateBox('hdrSkyBox', { size: 1000 }, scene);
    const hdrSkyboxMaterial = new PBRMaterial('skyBox', scene);
    hdrSkyboxMaterial.backFaceCulling = false;
    hdrSkyboxMaterial.reflectionTexture = environmentTexture.clone();
    if (hdrSkyboxMaterial.reflectionTexture) {
      hdrSkyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
    }
    hdrSkyboxMaterial.microSurface = 1.0 - blur;
    hdrSkyboxMaterial.disableLighting = true;
    hdrSkyboxMaterial.twoSidedLighting = true;
    hdrSkybox.material = hdrSkyboxMaterial;
    hdrSkybox.isPickable = false;
    hdrSkybox.infiniteDistance = true;
    hdrSkybox.ignoreCameraMaxZ = true;

    const degToRad = Math.PI / 180;

    const camera = new ArcRotateCamera(
      'camera1',
      115 * degToRad, // alpha
      80 * degToRad, // beta
      0.8, // radius
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
    camera.upperRadiusLimit = 1.5;
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

    // const directionalLight = new DirectionalLight(
    //   'directionalLight', // name
    //   new Vector3(0.5, -1, 1), // direction
    //   scene,
    // );
    // directionalLight.intensity = 0.5;
    // directionalLight.autoCalcShadowZBounds = false;
    // directionalLight.autoUpdateExtends = false;
    // directionalLight.shadowOrthoScale = 0;

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

export function usePCBuildSceneBuilder(): PCBuildSceneBuilder | undefined {
  const engine = useEngine();
  const [builder, setBuilder] = useState<PCBuildSceneBuilder | undefined>(
    undefined,
  );

  useEffect(() => {
    if (engine === undefined) {
      return;
    }
    if (builder === undefined) {
      setBuilder(new PCBuildSceneBuilder(engine));

      // if is running in browser register render loop manually. for react-native, it will be handled automatically
      if (window !== undefined) {
        engine.runRenderLoop(() => engine!.scenes[0].render());
      }
    }
    return () => {
      if (builder !== undefined) {
        builder.dispose();
      }
    };
  }, [engine, builder]);

  return builder;
}
