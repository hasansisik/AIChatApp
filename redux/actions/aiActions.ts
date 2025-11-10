import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { aiServer, aiPassword } from "@/config";

interface GetTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface StartConversationPayload {
  avatar_id: number;
}

interface StartConversationResponse {
  conversation_id: string;
  web_stream_url: string;
  avatar_id: number;
  status: string;
}

interface SendAudioPayload {
  conversation_id: string;
  audio: any; // File or URI
}

interface SendAudioResponse {
  conversation_id: string;
  status: string;
  message: string;
  has_speech: boolean;
}

// 1. Get Token
export const getToken = createAsyncThunk(
  "ai/getToken",
  async (_, thunkAPI) => {
    try {
      const formData = new FormData();
      formData.append("password", aiPassword);

      const { data } = await axios.post<GetTokenResponse>(
        `${aiServer}auth/token`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Store token in AsyncStorage as aiToken
      await AsyncStorage.setItem("aiToken", data.access_token);

      return data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Failed to get token"
      );
    }
  }
);

// 2. Start Conversation
export const startConversation = createAsyncThunk(
  "ai/startConversation",
  async ({ avatar_id }: StartConversationPayload, thunkAPI) => {
    try {
      // Get token from AsyncStorage or fetch new one
      let token = await AsyncStorage.getItem("aiToken");
      
      if (!token) {
        // If no token, get a new one first
        const tokenResult = await thunkAPI.dispatch(getToken());
        if (getToken.fulfilled.match(tokenResult)) {
          token = tokenResult.payload.access_token;
        } else {
          return thunkAPI.rejectWithValue("Failed to get authentication token");
        }
      }

      const { data } = await axios.post<StartConversationResponse>(
        `${aiServer}conversation/start`,
        { avatar_id },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return data;
    } catch (error: any) {
      // If token is invalid, try to get a new one and retry
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem("aiToken");
        const tokenResult = await thunkAPI.dispatch(getToken());
        if (getToken.fulfilled.match(tokenResult)) {
          const newToken = tokenResult.payload.access_token;
          try {
            const { data } = await axios.post<StartConversationResponse>(
              `${aiServer}conversation/start`,
              { avatar_id },
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${newToken}`,
                },
              }
            );
            return data;
          } catch (retryError: any) {
            return thunkAPI.rejectWithValue(
              retryError.response?.data?.message || retryError.message || "Failed to start conversation"
            );
          }
        }
      }
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Failed to start conversation"
      );
    }
  }
);

// 3. Send Audio
export const sendAudio = createAsyncThunk(
  "ai/sendAudio",
  async ({ conversation_id, audio }: SendAudioPayload, thunkAPI) => {
    try {
      // Get token from AsyncStorage or fetch new one
      let token = await AsyncStorage.getItem("aiToken");
      
      if (!token) {
        // If no token, get a new one first
        const tokenResult = await thunkAPI.dispatch(getToken());
        if (getToken.fulfilled.match(tokenResult)) {
          token = tokenResult.payload.access_token;
        } else {
          return thunkAPI.rejectWithValue("Failed to get authentication token");
        }
      }

      const formData = new FormData();
      formData.append("conversation_id", conversation_id);
      
      // Handle audio file - could be a URI or file object
      if (typeof audio === "string") {
        // If it's a URI, we need to create a file object
        // In React Native, we typically use the URI directly
        formData.append("audio", {
          uri: audio,
          type: "audio/mpeg", // Adjust type as needed
          name: "audio.mp3",
        } as any);
      } else {
        formData.append("audio", audio);
      }

      const { data } = await axios.post<SendAudioResponse>(
        `${aiServer}conversation/audio`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return data;
    } catch (error: any) {
      // If token is invalid, try to get a new one and retry
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem("aiToken");
        const tokenResult = await thunkAPI.dispatch(getToken());
        if (getToken.fulfilled.match(tokenResult)) {
          const newToken = tokenResult.payload.access_token;
          try {
            const formData = new FormData();
            formData.append("conversation_id", conversation_id);
            
            if (typeof audio === "string") {
              formData.append("audio", {
                uri: audio,
                type: "audio/mpeg",
                name: "audio.mp3",
              } as any);
            } else {
              formData.append("audio", audio);
            }

            const { data } = await axios.post<SendAudioResponse>(
              `${aiServer}conversation/audio`,
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                  Authorization: `Bearer ${newToken}`,
                },
              }
            );
            return data;
          } catch (retryError: any) {
            return thunkAPI.rejectWithValue(
              retryError.response?.data?.message || retryError.message || "Failed to send audio"
            );
          }
        }
      }
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Failed to send audio"
      );
    }
  }
);

