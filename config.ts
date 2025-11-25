import Constants from "expo-constants";

const DEFAULT_API_HOST = "16.171.161.33";
const DEFAULT_API_PORT = "5001";
const DEFAULT_API_PATH = "/v1";

// Production URL - APK build'lerde her zaman bu kullanılır
const PRODUCTION_URL = `http://${DEFAULT_API_HOST}:${DEFAULT_API_PORT}${DEFAULT_API_PATH}`;

const resolveServerBaseURL = () => {
  // Ortam değişkeni varsa onu kullan
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // APK/Production build kontrolü - __DEV__ false ise production
  if (typeof __DEV__ !== "undefined" && !__DEV__) {
    return PRODUCTION_URL;
  }

  // Development modunda Expo Go için geliştirici IP'sini bul
  try {
    const hostUri =
      Constants?.expoConfig?.hostUri ??
      Constants?.manifest2?.extra?.expoGo?.developerServerOrigin ??
      Constants?.manifest?.debuggerHost;

    if (hostUri) {
      const host = hostUri.split(":")[0];
      if (host && host !== "127.0.0.1" && host !== "localhost") {
        return `http://${host}:${DEFAULT_API_PORT}${DEFAULT_API_PATH}`;
      }
    }
  } catch (e) {
    // Constants erişiminde hata olursa production URL'e düş
  }

  return PRODUCTION_URL;
};

export const server = resolveServerBaseURL();
console.log("[Config] Server URL:", server);
export const aiServer = "http://16.171.161.33:8080/";
export const aiPassword = "JSD876+J?*#Fd";
