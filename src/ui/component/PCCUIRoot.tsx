import styled from 'styled-components';
import {
  Dispatch,
  JSX,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePCBuildSceneBuilder } from '@/PCBuildSceneBuilder';
import { PCCModel } from '@/runtime/PCCModel';
import { ToggleTarget } from '@/runtime/ToggleTarget';
import { PCCRuntime } from '@/runtime/PCCRuntime';
import { MountPoint } from '@/runtime/MountPoint';
import { MPNameMap } from '@/Constants';
import { verticalUiSize, horizontalUiSize } from '..';
import { ComponentListPanel } from './ComponentListPanel';
import { LoadingScreen } from './LoadingScreen';

const PCCUIRootDiv = styled.div`
  @media screen and (orientation: portrait) {
    width: 100%;
    height: ${() => verticalUiSize};
  }
  @media screen and (orientation: landscape) {
    width: ${() => horizontalUiSize};
    height: 100%;
  }
  position: relative;
  overflow: hidden;
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
  flex: 0 0 45px;
  flex-direction: column;
  text-align: center;
  vertical-align: middle;
  user-select: none;
`;

const TreeItemInnerDiv = styled.div`
  width: 100%;
  height: 40px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background-color: #919191;
  color: white;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
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

const TreeItemTitleInnerDiv = styled.div`
  flex: 1;
  align-content: center;
  text-align: right;
`;

const TreeItemDisposeButtonDiv = styled.div`
  width: 40px;
  text-align: center;
  align-items: center;
  color: white;
  font-weight: bold;
  font-size: 20px;
  transform: translateY(-2px);
`;

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

interface TreeItemToggleDivProps {
  $enabled: boolean;
}

const TreeItemToggleDiv = styled.div<TreeItemToggleDivProps>`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background-color: #d8d8d8;
  opacity: ${props => (props.$enabled ? 1 : 0.5)};
  transition: opacity 0.2s;
`;

const ToggleNameMp: Record<string, string | undefined> = {
  drive_holder: '机箱侧板（后）',
  front_panel: '机箱前板',
  side_armour: '机箱螺丝',
  side_glass: '机箱侧板（前）',
  power_nail: '电源螺丝',
};

const TreeViewRerenderContext = createContext<() => void>(() => {});

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
      <TreeItemToggleDiv onClick={onToggle} $enabled={toggleTarget.enabled}>
        {ToggleNameMp[toggleTarget.name] || toggleTarget.name}
      </TreeItemToggleDiv>
    </TreeItemToggleOuterDiv>
  );
}

const TreeItemContentOuterDiv = styled.div`
  padding-top: 5px;
  padding-bottom: 5px;
  width: 100%;
  height: auto;
  display: flex;
  flex-direction: row;
`;

const VerticalLineDiv = styled.div`
  width: 5px;
  height: 100%;
  margin-left: 10px;
  padding-top: 5px;
  padding-bottom: 5px;
  box-sizing: border-box;
  background-color: #5a5a5a;
  border-radius: 40px;
`;

const TreeItemContentDiv = styled.div`
  width: 100%;
  height: auto;
  display: flex;
  flex-direction: column;
  padding-left: 10px;
  padding-right: 10px;
  box-sizing: border-box;
`;

const EmptyMountPointDiv = styled.div`
  padding: 5px;
  padding-bottom: 0;
  box-sizing: border-box;
  width: 100%;
  flex: 0 0 45px;
  flex-direction: column;
  text-align: center;
  vertical-align: middle;
`;

const EmptyMountPointInnerDiv = styled.div`
  width: 100%;
  height: 40px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: #769955;
  color: white;
  cursor: pointer;
`;

const MountPointNameDiv = styled.div`
  font-weight: normal;
  font-size: 16px;
  padding-left: 10px;
`;

const MountPointAttachHintDiv = styled.div`
  font-size: 12px;
  font-weight: normal;
  color: #d8d8d8;
  padding-right: 10px;
  cursor: pointer;
`;

interface EmptyMountPointProps {
  mountPoint: MountPoint | 'root';
  onClick: (mountPoint: MountPoint | 'root') => void;
}

function EmptyMountPoint(props: EmptyMountPointProps): JSX.Element {
  const { mountPoint, onClick } = props;

  const innerName =
    typeof mountPoint === 'string' ? mountPoint : mountPoint.name;

  const name = MPNameMap[innerName] || innerName;

  return (
    <EmptyMountPointDiv key={name}>
      <EmptyMountPointInnerDiv onClick={() => onClick(mountPoint)}>
        <MountPointNameDiv>{name}</MountPointNameDiv>
        <MountPointAttachHintDiv>点击加载新部件</MountPointAttachHintDiv>
      </EmptyMountPointInnerDiv>
    </EmptyMountPointDiv>
  );
}

const PCCRuntimeContext = createContext<PCCRuntime | undefined>(undefined);

interface TreePCCViewProps {
  model: PCCModel;
  onClickEmptyMountPoint: (mountPoint: MountPoint | 'root') => void;
}

function TreePCCView(props: TreePCCViewProps): JSX.Element {
  const { model, onClickEmptyMountPoint } = props;

  const rerender = useContext(TreeViewRerenderContext);
  const runtime = useContext(PCCRuntimeContext);

  const [isShowingToggleTargets, setIsShowingToggleTargets] = useState(false);

  const onDispose = useCallback(() => {
    model.onDisposeObservable.addOnce(() => runtime?.disposeUnboundedModels());
    model.dispose();
    rerender();
  }, [model]);

  return (
    <>
      <TreeItemDiv>
        <TreeItemInnerDiv>
          {model.toggleTargets.length > 0 ? (
            <TreeItemDropdownToggleDiv
              onClick={() => setIsShowingToggleTargets(!isShowingToggleTargets)}
            >
              {isShowingToggleTargets ? '▼' : '▶'}
            </TreeItemDropdownToggleDiv>
          ) : null}
          <TreeItemTitleInnerDiv>{model.name}</TreeItemTitleInnerDiv>
          <TreeItemDisposeButtonDiv onClick={onDispose}>
            ✖
          </TreeItemDisposeButtonDiv>
        </TreeItemInnerDiv>
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
      {model.mountPoints.length > 0 ? (
        <TreeItemContentOuterDiv>
          <VerticalLineDiv />
          <TreeItemContentDiv>
            {model.mountPoints.map(mountPoint =>
              mountPoint.attachedModel ? (
                <TreePCCView
                  key={mountPoint.name}
                  model={mountPoint.attachedModel}
                  onClickEmptyMountPoint={onClickEmptyMountPoint}
                />
              ) : (
                <EmptyMountPoint
                  key={mountPoint.name}
                  mountPoint={mountPoint}
                  onClick={onClickEmptyMountPoint}
                />
              ),
            )}
          </TreeItemContentDiv>
        </TreeItemContentOuterDiv>
      ) : null}
    </>
  );
}

export default function PCCUIRoot(props: {
  percent: number;
  setPrecent: Dispatch<SetStateAction<number>>;
}): JSX.Element {
  const { percent, setPrecent } = props;
  const builder = usePCBuildSceneBuilder();

  const [isInitialized, setIsInitialized] = useState(false);
  const [_, setRerenderState] = useState(false);

  const [baseModel, setBaseModel] = useState<PCCModel | undefined>(undefined);

  const onBaseModelChanged = useCallback((model: PCCModel | undefined) => {
    setBaseModel(model);
  }, []);

  const [selectedTarget, setSelectedTarget] = useState<MountPoint | 'root'>();

  const onComponentSelected = useCallback(
    (modelUrl: string | undefined) => {
      if (builder === undefined) {
        return;
      }

      if (selectedTarget === undefined) {
        return;
      }

      setSelectedTarget(undefined);

      if (modelUrl === undefined) {
        return;
      }

      const runtime = builder.runtime;

      // setPrecent(0);
      (async () => {
        try {
          const model = await runtime.addModel(modelUrl);
          if (model === undefined) {
            return;
          }

          if (selectedTarget === 'root') {
            runtime.setBaseModel(model);
            runtime.disposeUnboundedModels();
            setRerenderState(x => !x);
            return;
          }

          if (!selectedTarget.attach(model)) {
            model.dispose(true);
          }
          setRerenderState(x => !x);
        } finally {
          // setPrecent(100);
        }
      })();
    },
    [builder, selectedTarget],
  );

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

    runtime.onBaseModelChangedObservable.add(onBaseModelChanged);

    function increaseTo(end: number) {
      return new Promise<void>(resolve => {
        const id = setInterval(function () {
          setPrecent(prev => {
            if (prev >= end) {
              clearInterval(id);
              resolve();
              return prev;
            }
            return prev + 1;
          });
        }, 100);
      });
    }

    (async () => {
      const [caseModel] = await Promise.all([
        runtime.addModel('res/case_sample.glb'),
        increaseTo(70),
      ]);

      runtime.setBaseModel(caseModel!);

      const [motherBorardModel] = await Promise.all([
        runtime.addModel('res/atx_motherboard_sample.glb'),
        increaseTo(80),
      ]);

      const [coolerModel] = await Promise.all([
        runtime.addModel('res/cooler_sample.glb'),
        increaseTo(85),
      ]);

      const [gpuModel] = await Promise.all([
        runtime.addModel('res/gpu_sample.glb'),
        increaseTo(90),
      ]);

      const [powserSupplyModel] = await Promise.all([
        runtime.addModel('res/atx_power_sample.glb'),
        increaseTo(95),
      ]);

      const [fanModel] = await Promise.all([
        runtime.addModel('res/120mm_fan_sample.glb'),
        increaseTo(97),
      ]);

      const fanModels: PCCModel[] = [fanModel!];
      for (let i = 0; i < 4; ++i) {
        const fanModel = await runtime.addModel('res/120mm_fan_sample.glb')!;
        fanModels.push(fanModel!);
      }

      const [ramModel] = await Promise.all([
        runtime.addModel('res/ddr4_ram_sample.glb'),
        increaseTo(99),
      ]);

      const ramModels: PCCModel[] = [ramModel!];
      for (let i = 0; i < 1; ++i) {
        const ramModel = (await runtime.addModel('res/ddr4_ram_sample.glb'))!;
        ramModels.push(ramModel);
      }

      const [cpuModel, storageModel] = await Promise.all([
        runtime.addModel('res/cpu_sample.glb'),
        runtime.addModel('res/nvme_ssd_sample.glb'),
        increaseTo(100),
      ]);

      await new Promise(resolve => setTimeout(resolve, 100));

      {
        let fanModelIndex = 0;
        const mountPoints = caseModel!.mountPoints;
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
        const mountPoints = caseModel!.mountPoints;
        for (let i = 0; i < mountPoints.length; ++i) {
          const mountPoint = mountPoints[i];
          if (mountPoint.attach(powserSupplyModel!)) {
            break;
          }
        }
      }

      const driveHolder = caseModel!.toggleTargets.find(
        target => target.name === 'drive_holder',
      )!;
      driveHolder;
      // driveHolder.setEnabled(false);

      {
        const mountPoints = caseModel!.mountPoints;
        for (let i = 0; i < mountPoints.length; ++i) {
          const mountPoint = mountPoints[i];
          if (mountPoint.attach(motherBorardModel!)) {
            await new Promise(resolve => setTimeout(resolve, 200));
            break;
          }
        }
      }

      {
        const mountPoints = motherBorardModel!.mountPoints;
        for (let i = 0; i < mountPoints.length; ++i) {
          const mountPoint = mountPoints[i];
          if (mountPoint.attach(cpuModel!)) {
            await new Promise(resolve => setTimeout(resolve, 200));
            break;
          }
        }
      }

      {
        const mountPoints = motherBorardModel!.mountPoints;
        for (let i = 0; i < mountPoints.length; ++i) {
          const mountPoint = mountPoints[i];
          if (mountPoint.attach(coolerModel!)) {
            await new Promise(resolve => setTimeout(resolve, 200));
            break;
          }
        }
      }

      {
        let ramModelIndex = 0;
        const mountPoints = motherBorardModel!.mountPoints;
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
        const mountPoints = motherBorardModel!.mountPoints;
        for (let i = 0; i < mountPoints.length; ++i) {
          const mountPoint = mountPoints[i];
          if (mountPoint.attach(storageModel!)) {
            await new Promise(resolve => setTimeout(resolve, 200));
            break;
          }
        }
      }

      {
        const mountPoints = motherBorardModel!.mountPoints;
        for (let i = 0; i < mountPoints.length; ++i) {
          const mountPoint = mountPoints[i];
          if (mountPoint.attach(gpuModel!)) {
            await new Promise(resolve => setTimeout(resolve, 200));
            break;
          }
        }
      }

      setRerenderState(x => !x);
    })();
  }, [builder, isInitialized]);

  const loadingScreen = useMemo(() => {
    return <LoadingScreen isShowing={Boolean(percent < 100)} />;
  }, [percent]);

  return (
    <PCCUIRootDiv>
      <PcComponentsListDiv>
        <TreeViewRerenderContext.Provider
          value={() => setRerenderState(x => !x)}
        >
          <PCCRuntimeContext.Provider value={builder?.runtime}>
            {baseModel ? (
              <TreePCCView
                model={baseModel}
                onClickEmptyMountPoint={setSelectedTarget}
              />
            ) : (
              <EmptyMountPoint mountPoint="root" onClick={setSelectedTarget} />
            )}
          </PCCRuntimeContext.Provider>
        </TreeViewRerenderContext.Provider>
      </PcComponentsListDiv>
      <ComponentListPanel
        target={selectedTarget}
        onSelected={onComponentSelected}
      />
      {loadingScreen}
    </PCCUIRootDiv>
  );
}
