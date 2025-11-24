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
  websocket_stream_url: string;
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
      console.log("🔑 [aiActions] getToken: Token alınıyor...");
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

      console.log("✅ [aiActions] getToken: Token alındı:", data.access_token.substring(0, 20) + "...");

      // Store token in AsyncStorage as aiToken
      await AsyncStorage.setItem("aiToken", data.access_token);

      return data;
    } catch (error: any) {
      console.error("❌ [aiActions] getToken: Hata:", error.response?.data?.message || error.message);
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
      console.log("💬 [aiActions] startConversation: Konuşma başlatılıyor, avatar_id:", avatar_id);
      // Get token from AsyncStorage or fetch new one
      let token = await AsyncStorage.getItem("aiToken");
      
      if (!token) {
        console.log("⚠️ [aiActions] startConversation: Token bulunamadı, yeni token alınıyor...");
        // If no token, get a new one first
        const tokenResult = await thunkAPI.dispatch(getToken());
        if (getToken.fulfilled.match(tokenResult)) {
          token = tokenResult.payload.access_token;
        } else {
          console.error("❌ [aiActions] startConversation: Token alınamadı");
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

      console.log("✅ [aiActions] startConversation: Konuşma başlatıldı:", {
        conversation_id: data.conversation_id,
        websocket_stream_url: data.websocket_stream_url,
        avatar_id: data.avatar_id,
        status: data.status,
      });

      return data;
    } catch (error: any) {
      console.error("❌ [aiActions] startConversation: Hata:", error.response?.data?.message || error.message);
      // If token is invalid, try to get a new one and retry
      if (error.response?.status === 401) {
        console.log("🔄 [aiActions] startConversation: Token geçersiz, yeniden deneniyor...");
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
            console.log("✅ [aiActions] startConversation: Retry başarılı:", {
              conversation_id: data.conversation_id,
              websocket_stream_url: data.websocket_stream_url,
            });
            return data;
          } catch (retryError: any) {
            console.error("❌ [aiActions] startConversation: Retry hatası:", retryError.response?.data?.message || retryError.message);
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

// 3. End Conversation
export const endConversation = createAsyncThunk(
  "ai/endConversation",
  async (conversation_id: string, thunkAPI) => {
    try {
      let token = await AsyncStorage.getItem("aiToken");
      
      if (!token) {
        const tokenResult = await thunkAPI.dispatch(getToken());
        if (getToken.fulfilled.match(tokenResult)) {
          token = tokenResult.payload.access_token;
        } else {
          return thunkAPI.rejectWithValue("Failed to get authentication token");
        }
      }

      await axios.delete(
        `${aiServer}conversation/${conversation_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ [aiActions] endConversation: Konuşma kapatıldı:", conversation_id);
      return { conversation_id };
    } catch (error: any) {
      console.error("❌ [aiActions] endConversation: Hata:", error.response?.data?.message || error.message);
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Failed to end conversation"
      );
    }
  }
);

// 4. Send Audio
export const sendAudio = createAsyncThunk(
  "ai/sendAudio",
  async ({ conversation_id, audio }: SendAudioPayload, thunkAPI) => {
    const startTime = Date.now();
    try {
      let token = await AsyncStorage.getItem("aiToken");
      
      if (!token) {
        const tokenResult = await thunkAPI.dispatch(getToken());
        if (getToken.fulfilled.match(tokenResult)) {
          token = tokenResult.payload.access_token;
        } else {
          return thunkAPI.rejectWithValue("Failed to get authentication token");
        }
      }

      const formData = new FormData();
      formData.append("conversation_id", conversation_id);
      
      if (typeof audio === "string") {
        // Determine file extension from URI
        const uriLower = audio.toLowerCase();
        const extension = uriLower.includes('.m4a') ? '.m4a' : 
                         uriLower.includes('.wav') ? '.wav' : '.mp3';
        const mimeType = extension === '.m4a' ? 'audio/m4a' : 
                        extension === '.wav' ? 'audio/wav' : 'audio/mpeg';
        
        formData.append("audio", {
          uri: audio,
          type: mimeType,
          name: `audio${extension}`,
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

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`⏱️ sendAudio API: ${duration}s`);

      return data;
    } catch (error: any) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      // 409 Conflict: Audio is already being processed - this is normal, silently ignore
      if (error.response?.status === 409) {
        console.log(`ℹ️ sendAudio API: Audio zaten işleniyor (${duration}s) - normal durum`);
        // Return a success response since this is expected behavior
        return {
          conversation_id,
          status: "playing",
          message: "Audio is already being processed",
          has_speech: true,
        } as SendAudioResponse;
      }
      
      console.error(`❌ sendAudio API hatası (${duration}s):`, error.response?.data?.message || error.message);
      
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem("aiToken");
        const tokenResult = await thunkAPI.dispatch(getToken());
        if (getToken.fulfilled.match(tokenResult)) {
          const newToken = tokenResult.payload.access_token;
          try {
            const formData = new FormData();
            formData.append("conversation_id", conversation_id);
            
            if (typeof audio === "string") {
              // Determine file extension from URI
              const uriLower = audio.toLowerCase();
              const extension = uriLower.includes('.m4a') ? '.m4a' : 
                               uriLower.includes('.wav') ? '.wav' : '.mp3';
              const mimeType = extension === '.m4a' ? 'audio/m4a' : 
                              extension === '.wav' ? 'audio/wav' : 'audio/mpeg';
              
              formData.append("audio", {
                uri: audio,
                type: mimeType,
                name: `audio${extension}`,
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

