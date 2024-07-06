const staticAssetServerUrlForCN =
  'https://7072-prod-9goxmz5w39f71724-1308749526.tcb.qcloud.la/';

export async function getStaticAssetServerUrl() {
  const domain = window.location.href;
  if (domain.includes('github') || domain.includes('http://')) {
    return domain;
  }
  return staticAssetServerUrlForCN;
}

export const MPNameMap: Record<string, string | undefined> = {
  root: 'ROOT',
  motherboard_mp: '主板',
  power_mp: '电源',
  fan1_mp: '风扇1',
  fan2_mp: '风扇2',
  fan3_mp: '风扇3',
  fan4_mp: '风扇4',
  fan5_mp: '风扇5',
  nvmessd_mp1: '固态硬盘1',
  nvmessd_mp2: '固态硬盘2',
  cooler_mp: '散热',
  cpu_mp: 'CPU',
  pcie_mp: 'GPU',
  ddr4_ram_mp1: '内存条1',
  ddr4_ram_mp2: '内存条2',
};
