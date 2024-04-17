import styled from 'styled-components';
import {
  JSX,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { usePCBuildSceneBuilder } from '@/PCBuildSceneBuilder';
import { PCCModel } from '@/runtime/PCCModel';
import { ToggleTarget } from '@/runtime/ToggleTarget';

const TreeViewRerenderContext = createContext<() => void>(() => {});

const PCCUIRootDiv = styled.div`
  width: 100%;
  height: 400px;
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

const TreeItemDiv = styled.div`
  padding: 5px;
  padding-bottom: 0;
  box-sizing: border-box;
  width: 100%;
  flex: 0 0 50px;
  flex-direction: column;
  text-align: center;
  vertical-align: middle;
`;

const TreeItemTitleDiv = styled.div`
  width: 100%;
  height: 40px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background-color: #919191;
  color: white;
  font-weight: bold;
  font-size: 20px;
`;

const TreeItemDropdownToggleDiv = styled.div`
  width: 40px;
  text-align: center;
  align-items: center;
  background-color: #919191;
  color: white;
  font-weight: bold;
  font-size: 20px;
  position: relative;
`;

const ToggleTargetHintDiv = styled.div`
  width: 100px;
  font-size: 12px;
  font-weight: normal;
  color: #d8d8d8;
  position: absolute;
  top: calc(50% - 6px);
  left: 25px;
`;

const TreeItemTitleInnerDiv = styled.div`
  flex: 1;
  margin-right: 40px;
  align-content: center;
  text-align: center;
`;

interface TreeItemToggleDivProps {
  enabled: boolean;
}

const TreeItemToggleOuterDiv = styled.div`
  width: 100%;
  height: 40px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 5px;
  box-sizing: border-box;
`;

const TreeItemTogglesContainerDiv = styled.div`
  border-style: solid;
  border-width: 2px;
  border-color: #919191;
  border-top-width: 0;
`;

const TreeItemToggleDiv = styled.div<TreeItemToggleDivProps>`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background-color: #d8d8d8;
  opacity: ${props => (props.enabled ? 1 : 0.5)};
  transition: opacity 0.2s;
`;

interface TreeItemToggleProps {
  toggleTarget: ToggleTarget;
}

function TreeItemToggle(props: TreeItemToggleProps): JSX.Element {
  const { toggleTarget } = props;

  const rerender = useContext(TreeViewRerenderContext);

  const onToggle = useCallback(() => {
    toggleTarget.setEnabled(!toggleTarget.enabled);
    rerender();
  }, [toggleTarget, rerender]);

  return (
    <TreeItemToggleOuterDiv>
      <TreeItemToggleDiv onClick={onToggle} enabled={toggleTarget.enabled}>
        {toggleTarget.name}
      </TreeItemToggleDiv>
    </TreeItemToggleOuterDiv>
  );
}

const TreeItemContentOuterDiv = styled.div`
  width: 100%;
  height: auto;
  display: flex;
  flex-direction: row;
`;

const VerticalLineDiv = styled.div`
  width: 10px;
  height: 100%;
  margin-left: 10px;
  background-color: #979797;
  border-radius: 40px;
`;

const TreeItemContentDiv = styled.div`
  width: 100%;
  height: auto;
  display: flex;
  flex-direction: column;
  padding-left: 20px;
  padding-top: 5px;
  box-sizing: border-box;
`;

interface TreePCCItemProps {
  model: PCCModel;
  children?: JSX.Element | JSX.Element[];
}

function TreePCCItem(props: TreePCCItemProps): JSX.Element {
  const { model } = props;

  const [isShowingToggleTargets, setIsShowingToggleTargets] = useState(false);

  return (
    <>
      <TreeItemDiv>
        <TreeItemTitleDiv>
          <TreeItemDropdownToggleDiv
            onClick={() => setIsShowingToggleTargets(!isShowingToggleTargets)}
          >
            {isShowingToggleTargets ? '▼' : '▶'}
            <ToggleTargetHintDiv>Toggle Targets</ToggleTargetHintDiv>
          </TreeItemDropdownToggleDiv>
          <TreeItemTitleInnerDiv>{model.name}</TreeItemTitleInnerDiv>
        </TreeItemTitleDiv>
        {isShowingToggleTargets ? (
          <TreeItemTogglesContainerDiv>
            {model.toggleTargets.map(toggleTarget => (
              <TreeItemToggle
                key={toggleTarget.name}
                toggleTarget={toggleTarget}
              />
            ))}
          </TreeItemTogglesContainerDiv>
        ) : null}
      </TreeItemDiv>
      <TreeItemContentOuterDiv>
        <VerticalLineDiv />
        <TreeItemContentDiv>{props.children}</TreeItemContentDiv>
      </TreeItemContentOuterDiv>
    </>
  );
}

// interface TreeViewProps {
//   currentModel: PCCModel | null;
// }

// function TreeView(props: TreeViewProps): JSX.Element {
//   const { currentModel } = props;

//   if (currentModel === null) {
//     return <></>;
//   }

//   const mountPoints = currentModel.mountPoints;
//   const toggleTargets = currentModel.toggleTargets;

//   return (
//     <TreePCCItem key={currentModel.name} name={currentModel.name}>
//       {mountPoints.map(mountPoint => (
//         <TreePCCItem key={mountPoint.name} name={mountPoint.name}>
//           <TreeView currentModel={mountPoint.attachedModel ?? null} />
//         </TreePCCItem>
//       ))}
//       {toggleTargets.map(toggleTarget => (
//         <TreePCCItem key={toggleTarget.name} name={toggleTarget.name}>
//           <TreeView currentModel={null} />
//         </TreePCCItem>
//       ))}
//     </TreePCCItem>
//   );
// }

export default function PCCUIRoot(): JSX.Element {
  const builder = usePCBuildSceneBuilder();

  const [isInitialized, setIsInitialized] = useState(false);
  const [rerenderState, setRerenderState] = useState(false);

  const [testRoot, setTestRoot] = useState<PCCModel | null>(null);

  useEffect(() => {
    if (builder === undefined) {
      return;
    }

    if (isInitialized) {
      return;
    }

    setIsInitialized(true);

    const runtime = builder.runtime;
    runtime.playAnimation();

    (async () => {
      const caseModel = (await runtime.addModel('res/case_sample.glb'))!;
      runtime.setBaseModel(caseModel);

      setTestRoot(caseModel);

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

      setRerenderState(!rerenderState);
    })();
  }, [builder, isInitialized]);

  return (
    <PCCUIRootDiv>
      <PcComponentsListDiv>
        <TreeViewRerenderContext.Provider
          value={() => setRerenderState(!rerenderState)}
        >
          {testRoot === null ? null : <TreePCCItem model={testRoot} />}
          {/* <TreeView currentModel={builder?.runtime.baseModel ?? null} /> */}
          {/* <TreeItem name="middle tower case">
          <TreeItem name="120mm stock fan"></TreeItem>
          <TreeItem name="standard ATX power supply"></TreeItem>
          <TreeItem name="standard ATX motherboard">
            <TreeItem name="LGA1700 CPU"></TreeItem>
            <TreeItem name="120mm CPU cooler"></TreeItem>
            <TreeItem name="DDR4 RAM 2400MHz"></TreeItem>
            <TreeItem name="NVMe m.2 SSD"></TreeItem>
          </TreeItem>
        </TreeItem> */}
        </TreeViewRerenderContext.Provider>
      </PcComponentsListDiv>
    </PCCUIRootDiv>
  );
}
