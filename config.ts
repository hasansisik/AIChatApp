const DEFAULT_API_PATH = "/v1";
const HEROKU_BASE_URL = "https://ai-chat-server-birimajans-cf2523744522.herokuapp.com";

const resolveServerBaseURL = () => {
  // Önce environment variable kontrol et
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Heroku URL'sini kullan
  return `${HEROKU_BASE_URL}${DEFAULT_API_PATH}`;
};

export const server = resolveServerBaseURL();
export const aiServer = `${HEROKU_BASE_URL}/`;

// Contact information is now fetched dynamically via Redux settingsActions

