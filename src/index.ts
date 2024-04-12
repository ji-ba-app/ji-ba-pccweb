import { Engine } from '@babylonjs/core/Engines/engine';
import { PCBuildSceneBuilder } from './PCBuildSceneBuilder';
import '@babylonjs/core/Materials/PBR/pbrSubSurfaceConfiguration';
import { PCCModel } from './runtime/PCCModel';

await new Promise(resolve => (window.onload = resolve));

const canvas = document.createElement('canvas');
canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.display = 'block';
document.body.appendChild(canvas);

const engine = new Engine(
  canvas,
  false,
  {
    preserveDrawingBuffer: false,
    stencil: false,
    antialias: false,
    alpha: false,
    premultipliedAlpha: false,
    powerPreference: 'high-performance',
    audioEngine: false,
    disableWebGL2Support: false,
  },
  true,
);
engine.setHardwareScalingLevel(1.2);

window.addEventListener('resize', () => engine.resize());

const builder = new PCBuildSceneBuilder(engine);
const runtime = builder.runtime;
runtime.playAnimation();

engine.runRenderLoop(() => engine.scenes[0].render());

const caseModel = (await runtime.addModel('res/case_sample.glb'))!;
runtime.setBaseModel(caseModel);

const fanModels: PCCModel[] = [];
for (let i = 0; i < 5; ++i) {
  const fanModel = await runtime.addModel('res/120mm_fan_sample.glb')!;
  fanModels.push(fanModel!);
}

const powserSupplyModel = (await runtime.addModel('res/atx_power_sample.glb'))!;

const motherBorardModel = (await runtime.addModel(
  'res/atx_motherboard_sample.glb',
))!;

const cpuModel = (await runtime.addModel('res/cpu_sample.glb'))!;

const coolerModel = (await runtime.addModel('res/cooler_sample.glb'))!;

const ramModels: PCCModel[] = [];
for (let i = 0; i < 2; ++i) {
  const ramModel = (await runtime.addModel('res/ddr4_ram_sample.glb'))!;
  ramModels.push(ramModel);
}

const gpuModel = (await runtime.addModel('res/gpu_sample.glb'))!;
const storageModel = (await runtime.addModel('res/nvme_ssd_sample.glb'))!;

await new Promise(resolve => setTimeout(resolve, 100));

{
  let fanModelIndex = 0;
  const mountPoints = caseModel.mountPoints;
  for (let i = 0; i < mountPoints.length; ++i) {
    const mountPoint = mountPoints[i];
    if (mountPoint.attach(fanModels[fanModelIndex])) {
      fanModelIndex += 1;
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (fanModelIndex >= fanModels.length) {
      break;
    }
  }
}

{
  const mountPoints = caseModel.mountPoints;
  for (let i = 0; i < mountPoints.length; ++i) {
    const mountPoint = mountPoints[i];
    if (mountPoint.attach(powserSupplyModel)) {
      break;
    }
  }
}

const driveHolder = caseModel.toggleTargets.find(
  target => target.name === 'drive_holder',
)!;
driveHolder;
// driveHolder.setEnabled(false);

{
  const mountPoints = caseModel.mountPoints;
  for (let i = 0; i < mountPoints.length; ++i) {
    const mountPoint = mountPoints[i];
    if (mountPoint.attach(motherBorardModel)) {
      await new Promise(resolve => setTimeout(resolve, 200));
      break;
    }
  }
}

{
  const mountPoints = motherBorardModel.mountPoints;
  for (let i = 0; i < mountPoints.length; ++i) {
    const mountPoint = mountPoints[i];
    if (mountPoint.attach(cpuModel)) {
      await new Promise(resolve => setTimeout(resolve, 200));
      break;
    }
  }
}

{
  const mountPoints = motherBorardModel.mountPoints;
  for (let i = 0; i < mountPoints.length; ++i) {
    const mountPoint = mountPoints[i];
    if (mountPoint.attach(coolerModel)) {
      await new Promise(resolve => setTimeout(resolve, 200));
      break;
    }
  }
}

{
  let ramModelIndex = 0;
  const mountPoints = motherBorardModel.mountPoints;
  for (let i = 0; i < mountPoints.length; ++i) {
    const mountPoint = mountPoints[i];
    if (mountPoint.attach(ramModels[ramModelIndex])) {
      ramModelIndex += 1;
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (ramModelIndex >= ramModels.length) {
      break;
    }
  }
}

{
  const mountPoints = motherBorardModel.mountPoints;
  for (let i = 0; i < mountPoints.length; ++i) {
    const mountPoint = mountPoints[i];
    if (mountPoint.attach(storageModel)) {
      await new Promise(resolve => setTimeout(resolve, 200));
      break;
    }
  }
}

{
  const mountPoints = motherBorardModel.mountPoints;
  for (let i = 0; i < mountPoints.length; ++i) {
    const mountPoint = mountPoints[i];
    if (mountPoint.attach(gpuModel)) {
      await new Promise(resolve => setTimeout(resolve, 200));
      break;
    }
  }
}
