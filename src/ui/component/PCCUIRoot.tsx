import styled from 'styled-components';
import { JSX, useEffect } from 'react';
import { usePCBuildSceneBuilder } from '@/PCBuildSceneBuilder';
import { PCCModel } from '@/runtime/PCCModel';

const PCCUIRootDiv = styled.div`
  width: 100%;
  height: 300px;
  display: flex;
  flex-direction: column;
`;

const PcComponentsListDiv = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-bottom: 5px;
`;

const ListItemDiv = styled.div`
  padding: 5px;
  padding-bottom: 0;
  box-sizing: border-box;
  width: 100%;
  flex: 0 0 50px;
  flex-direction: column;
  text-align: center;
  vertical-align: middle;
`;

const ListItemInnerDiv = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;

  &:hover {
    background-color: #e0e0e0;
  }
`;

interface ListItemProps {
  name: string;
}

function ListItem(props: ListItemProps): JSX.Element {
  return (
    <ListItemDiv>
      <ListItemInnerDiv>{props.name}</ListItemInnerDiv>
    </ListItemDiv>
  );
}

export default function PCCUIRoot(): JSX.Element {
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

  return (
    <PCCUIRootDiv>
      <PcComponentsListDiv>
        <ListItem name="middle tower case" />
        <ListItem name="120mm stock fan" />
        <ListItem name="standard ATX power supply" />
        <ListItem name="standard ATX motherboard" />
        <ListItem name="LGA1700 CPU" />
        <ListItem name="120mm CPU cooler" />
        <ListItem name="DDR4 RAM 2400MHz" />
        <ListItem name="NVMe m.2 SSD" />
        <ListItem name="DDR4 RAM 2400MHz" />
        <ListItem name="NVMe m.2 SSD" />
        <ListItem name="DDR4 RAM 2400MHz" />
        <ListItem name="NVMe m.2 SSD" />
        <ListItem name="DDR4 RAM 2400MHz" />
        <ListItem name="NVMe m.2 SSD" />
        <ListItem name="DDR4 RAM 2400MHz" />
        <ListItem name="NVMe m.2 SSD" />
      </PcComponentsListDiv>
    </PCCUIRootDiv>
  );
}
