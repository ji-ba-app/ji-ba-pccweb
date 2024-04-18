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
import { PCCRuntime } from '@/runtime/PCCRuntime';
import { MountPoint } from '@/runtime/MountPoint';
import { Compatibility } from '@/loader/Compatibility';
import { verticalUiSize, horizontalUiSize } from '..';

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
        {toggleTarget.name}
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
`;

interface EmptyMountPointProps {
  mountPoint: MountPoint | 'root';
  onClick: (mountPoint: MountPoint | 'root') => void;
}

function EmptyMountPoint(props: EmptyMountPointProps): JSX.Element {
  const { mountPoint, onClick } = props;

  return (
    <EmptyMountPointDiv
      key={typeof mountPoint === 'string' ? mountPoint : mountPoint.name}
    >
      <EmptyMountPointInnerDiv onClick={() => onClick(mountPoint)}>
        <MountPointNameDiv>
          {typeof mountPoint === 'string' ? mountPoint : mountPoint.name}
        </MountPointNameDiv>
        <MountPointAttachHintDiv>
          click here to attach new component
        </MountPointAttachHintDiv>
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
              <ToggleTargetHintDiv>Toggle Targets</ToggleTargetHintDiv>
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

interface ComponentListPanelDivProps {
  $isShowing: boolean;
}

const ComponentListPanelDiv = styled.div<ComponentListPanelDivProps>`
  position: absolute;
  top: 0;
  left: ${props => (props.$isShowing ? '0' : '100%')};

  width: 100%;
  height: 100%;

  background-color: #b9b9b9;
  transition: left 0.2s;

  display: flex;
  flex-direction: column;
`;

const ComponentListPanelTopBarDiv = styled.div`
  width: 100%;
  flex: 0 0 40px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: #919191;
  color: white;
`;

const ComponentListPanelTopBarBackButtonDiv = styled.div`
  width: 40px;
  text-align: center;
  align-items: center;
  background-color: #919191;
  color: white;
  font-weight: bold;
  font-size: 20px;
`;

const ComponentListPanelTopBarTitleDiv = styled.div`
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  padding-right: 40px;
  flex: 1;
`;

const ComponentListPanelListPaddingDiv = styled.div`
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

const ComponentListPanelListDiv = styled.div`
  width: 100%;
  height: auto;
  display: flex;
  flex-direction: column;
  margin-bottom: 5px;
`;

const ComponentListItemDiv = styled.div`
  padding: 5px;
  padding-bottom: 0;
  box-sizing: border-box;
  width: 100%;
  flex: 0 0 45px;
  flex-direction: column;
  text-align: center;
  vertical-align: middle;
`;

const ComponentListItemInnerDiv = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background-color: #d3d3d3;
  color: black;
  font-weight: bold;
  font-size: 16px;
`;

interface ComponentListPanelProps {
  target: MountPoint | 'root' | undefined;
  onSelected: (modelUrl: string | undefined) => void;
}

interface ComponentListItemInfo {
  name: string;
  url: string;
  compat: Compatibility | undefined;
}

const listItems: ComponentListItemInfo[] = [
  {
    name: 'Case',
    url: 'res/case_sample.glb',
    compat: Compatibility.parseFromCompatString('case'),
  },
  {
    name: '120mm Fan',
    url: 'res/120mm_fan_sample.glb',
    compat: Compatibility.parseFromCompatString('fan,120'),
  },
  {
    name: 'atx power sample',
    url: 'res/atx_power_sample.glb',
    compat: Compatibility.parseFromCompatString('powersupply,ATX'),
  },
  {
    name: 'atx motherboard sample',
    url: 'res/atx_motherboard_sample.glb',
    compat: Compatibility.parseFromCompatString('motherboard,ATX'),
  },
  {
    name: 'lga1700 cpu sample',
    url: 'res/cpu_sample.glb',
    compat: Compatibility.parseFromCompatString('cpu,LGA1700'),
  },
  {
    name: 'cooler sample',
    url: 'res/cooler_sample.glb',
    compat: Compatibility.parseFromCompatString('cooler,LGA1700'),
  },
  {
    name: 'ddr4 ram sample',
    url: 'res/ddr4_ram_sample.glb',
    compat: Compatibility.parseFromCompatString('ram,DDR4'),
  },
  {
    name: 'gpu_sample',
    url: 'res/gpu_sample.glb',
    compat: Compatibility.parseFromCompatString('pcie,x16'),
  },
  {
    name: 'NVMe SSD',
    url: 'res/nvme_ssd_sample.glb',
    compat: Compatibility.parseFromCompatString('storage,NVMESSD'),
  },
];

for (let i = 0; i < listItems.length; ++i) {
  const item = listItems[i];
  if (item.compat === undefined) {
    throw new Error(`Failed to parse compat string for ${item.name}`);
  }
}

function ComponentListPanel(props: ComponentListPanelProps): JSX.Element {
  const { target, onSelected } = props;
  onSelected;
  return (
    <ComponentListPanelDiv $isShowing={target !== undefined}>
      <ComponentListPanelTopBarDiv>
        <ComponentListPanelTopBarBackButtonDiv
          onClick={() => onSelected(undefined)}
        >
          ◀
        </ComponentListPanelTopBarBackButtonDiv>
        <ComponentListPanelTopBarTitleDiv>
          attach to '{target === 'root' ? 'root' : target?.name}'
        </ComponentListPanelTopBarTitleDiv>
      </ComponentListPanelTopBarDiv>
      <ComponentListPanelListPaddingDiv>
        <ComponentListPanelListDiv>
          {target !== undefined
            ? (target === 'root'
                ? listItems
                : listItems.filter(item => {
                    const points = target.points;

                    let isCompatible = false;
                    for (let i = 0; i < points.length; ++i) {
                      const point = points[i];
                      if (
                        target.checkPointAvailability(i) &&
                        point.compatability.isCompatibleWith(item.compat!)
                      ) {
                        isCompatible = true;
                        break;
                      }
                    }
                    return isCompatible;
                  })
              ).map(item => (
                <ComponentListItemDiv key={item.name}>
                  <ComponentListItemInnerDiv
                    onClick={() => onSelected(item.url)}
                  >
                    {item.name}
                  </ComponentListItemInnerDiv>
                </ComponentListItemDiv>
              ))
            : null}
        </ComponentListPanelListDiv>
      </ComponentListPanelListPaddingDiv>
    </ComponentListPanelDiv>
  );
}

export default function PCCUIRoot(): JSX.Element {
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

      (async () => {
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

      setRerenderState(x => !x);
    })();
  }, [builder, isInitialized]);

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
    </PCCUIRootDiv>
  );
}
