const staticAssetServerUrlForCN =
  'https://7072-prod-9goxmz5w39f71724-1308749526.tcb.qcloud.la/';

export async function getStaticAssetServerUrl() {
  const domain = window.location.href;
  if (domain.includes('github') || domain.includes('http://')) {
    return domain;
  }
  return staticAssetServerUrlForCN;
}
