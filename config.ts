import Constants from "expo-constants";

const DEFAULT_API_HOST = "localhost";
const DEFAULT_API_PORT = "5001";
const DEFAULT_API_PATH = "/v1";

const resolveServerBaseURL = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const hostUri =
    Constants?.expoConfig?.hostUri ??
    (Constants?.manifest2?.extra?.expoGo as any)?.debuggerHost ??
    (Constants?.manifest as any)?.debuggerHost;

  if (!hostUri) {
    return `http://${DEFAULT_API_HOST}:${DEFAULT_API_PORT}${DEFAULT_API_PATH}`;
  }

  const host = hostUri.split(":")[0];

  // Expo Go içerisinde geliştirici makine IP'sini kullanmak istiyorsak
  if (host && host !== "127.0.0.1" && host !== "localhost") {
    return `http://${host}:${DEFAULT_API_PORT}${DEFAULT_API_PATH}`;
  }

  return `http://${DEFAULT_API_HOST}:${DEFAULT_API_PORT}${DEFAULT_API_PATH}`;
};

export const server = resolveServerBaseURL();
export const aiServer = "http://16.171.161.33:8080/";
export const aiPassword = "JSD876+J?*#Fd";
