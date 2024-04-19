declare const SERVER_URL: string;

const staticAssetServerUrlDefault = SERVER_URL;

const staticAssetServerUrlForCN =
  'https://7072-prod-9goxmz5w39f71724-1308749526.tcb.qcloud.la/';

let cache: string | undefined;

export async function getStaticAssetServerUrl() {
  if (cache) {
    return cache;
  }
  try {
    const res = await Promise.race<string>([
      fetch(`${staticAssetServerUrlDefault}res/studio.env`).then(
        () => staticAssetServerUrlDefault,
      ),
      new Promise(function (resolve) {
        setTimeout(function () {
          resolve(staticAssetServerUrlForCN);
        }, 1000);
      }),
    ]);
    cache = res;
    return res;
  } catch {
    return staticAssetServerUrlDefault;
  }
}
