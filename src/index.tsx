import '@babylonjs/core/Materials/PBR/pbrSubSurfaceConfiguration';
import ReactDOM from 'react-dom/client';
import { JSX, StrictMode, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
// import { usePCBuildSceneBuilder } from './PCBuildSceneBuilder';
// import { PCCModel } from './runtime/PCCModel';
import { CanvasContextProvider } from './CanvasContext';
import { usePCBuildSceneBuilder } from './PCBuildSceneBuilder';
import { PCCModel } from './runtime/PCCModel';

await new Promise(resolve => (window.onload = resolve));

const AppRootDiv = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const RenderCanvas = styled.canvas`
  width: 100%;
  height: 100%;
  display: block;
`;

function AppRoot(): JSX.Element {
  const builder = usePCBuildSceneBuilder();

  useEffect(() => {
    if (builder === undefined) {
      return;
    }

    const runtime = builder.runtime;
    runtime.playAnimation();

    (async () => {
      const caseModel = (await runtime.addModel('res/case_sample.glb'))!;
      runtime.setBaseModel(caseModel);

      const fanModels: PCCModel[] = [];
      for (let i = 0; i < 5; ++i) {
        const fanModel = await runtime.addModel('res/120mm_fan_sample.glb')!;
        fanModels.push(fanModel!);
      }

      const powserSupplyModel = (await runtime.addModel(
        'res/atx_power_sample.glb',
      ))!;

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
    })();

    return () => {
      builder.dispose();
    };
  });

  return <></>;
}

function Root(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current === null) {
      return;
    }

    setCanvas(canvasRef.current);
  }, [canvasRef.current]);

  return (
    <AppRootDiv>
      <RenderCanvas ref={canvasRef} />
      <CanvasContextProvider canvas={canvas}>
        <AppRoot />
      </CanvasContextProvider>
    </AppRootDiv>
  );
}

const rootDiv = document.createElement('div');
rootDiv.style.width = '100vw';
rootDiv.style.height = '100vh';
rootDiv.style.margin = '0';
rootDiv.style.padding = '0';
document.body.appendChild(rootDiv);

const reactRoot = ReactDOM.createRoot(rootDiv);
reactRoot.render(
  <StrictMode>
    <Root />,
  </StrictMode>,
);
