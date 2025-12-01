import Constants from "expo-constants";

const DEFAULT_API_HOST = "localhost";
const DEFAULT_API_PORT = "5001";
const DEFAULT_API_PATH = "/v1";

const resolveServerBaseURL = () => {
  // Önce environment variable kontrol et
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Expo Go'dan host IP'sini al
  const hostUri =
    Constants?.expoConfig?.hostUri ??
    (Constants?.manifest2?.extra?.expoGo as any)?.debuggerHost ??
    (Constants?.manifest as any)?.debuggerHost;

  if (!hostUri) {
    // Fallback: localhost kullan (sadece simulator/emulator için çalışır)
    return `http://${DEFAULT_API_HOST}:${DEFAULT_API_PORT}${DEFAULT_API_PATH}`;
  }

  // hostUri formatı: "192.168.1.104:8081" - port kısmını ayır
  const host = hostUri.split(":")[0];

  // Geçerli bir IP adresi varsa kullan
  if (host && host !== "127.0.0.1" && host !== "localhost") {
    return `http://${host}:${DEFAULT_API_PORT}${DEFAULT_API_PATH}`;
  }

  return `http://${DEFAULT_API_HOST}:${DEFAULT_API_PORT}${DEFAULT_API_PATH}`;
};

export const server = resolveServerBaseURL();
export const aiServer = "http://localhost:5001/";
export const aiPassword = "JSD876+J?*#Fd";

// Contact information for purchase
export const CONTACT_INFO = {
  whatsapp: "+905551234567", // Replace with actual WhatsApp number
  phone: "+90 555 123 45 67", // Replace with actual phone number
  whatsappMessage: "Merhaba, EnglishCard satın almak istiyorum."
};

// Debug için server URL'ini logla
console.log("🔌 API Server URL:", server);
