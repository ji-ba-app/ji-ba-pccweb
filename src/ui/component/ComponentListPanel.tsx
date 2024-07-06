import styled from 'styled-components';
import { JSX } from 'react';
import { Compatibility } from '@/loader/Compatibility';
import { MountPoint } from '@/runtime/MountPoint';
import { MPNameMap } from '@/Constants';

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
  cursor: pointer;
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
    name: '机箱',
    url: 'res/case_sample.glb',
    compat: Compatibility.parseFromCompatString('case'),
  },
  {
    name: '120mm 风扇',
    url: 'res/120mm_fan_sample.glb',
    compat: Compatibility.parseFromCompatString('fan,120'),
  },
  {
    name: 'ATX 电源',
    url: 'res/atx_power_sample.glb',
    compat: Compatibility.parseFromCompatString('powersupply,ATX'),
  },
  {
    name: 'ATX 主板',
    url: 'res/atx_motherboard_sample.glb',
    compat: Compatibility.parseFromCompatString('motherboard,ATX'),
  },
  {
    name: 'Intel CPU',
    url: 'res/cpu_sample.glb',
    compat: Compatibility.parseFromCompatString('cpu,LGA1700'),
  },
  {
    name: '风冷散热',
    url: 'res/cooler_sample.glb',
    compat: Compatibility.parseFromCompatString('cooler,LGA1700'),
  },
  {
    name: 'DDR4 内存条',
    url: 'res/ddr4_ram_sample.glb',
    compat: Compatibility.parseFromCompatString('ram,DDR4'),
  },
  {
    name: 'NVIDIA GPU',
    url: 'res/gpu_sample.glb',
    compat: Compatibility.parseFromCompatString('pcie,x16'),
  },
  {
    name: '固态硬盘',
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

export function ComponentListPanel(
  props: ComponentListPanelProps,
): JSX.Element {
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
          添加到{' '}
          {target === 'root'
            ? 'ROOT'
            : MPNameMap[target?.name || ''] || target?.name}{' '}
          位置
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
