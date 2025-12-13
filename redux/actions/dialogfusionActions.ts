import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { server } from "@/config";

const DIALOGFUSION_API_URL = "https://app.dialogfusion.com/script/include/api.php";

// Cache for token to avoid multiple API calls
let cachedToken: string | null = null;
let tokenFetchPromise: Promise<string> | null = null;

// Get DialogFusion token from API directly (avoid circular dependency)
const getDialogFusionToken = async (): Promise<string> => {
  // Return cached token if available
  if (cachedToken) {
    return cachedToken;
  }

  // If a fetch is already in progress, wait for it
  if (tokenFetchPromise) {
    return await tokenFetchPromise;
  }

  // Start new fetch
  tokenFetchPromise = (async (): Promise<string> => {
    try {
      const response = await axios.get(`${server}/settings/public`);
      if (response.data.success && response.data.settings.dialogfusionToken) {
        const token = response.data.settings.dialogfusionToken;
        cachedToken = token;
        return token;
      }
    } catch (error) {
      // Fallback to default
    }
    
    // Fallback token
    const fallbackToken = "448033a885bb9c4ab0c734ce7546f3824eeff7d5";
    cachedToken = fallbackToken;
    return fallbackToken;
  })();

  const result = await tokenFetchPromise;
  tokenFetchPromise = null; // Reset promise after completion
  return result;
};

// Interfaces
interface CreateVisitorPayload {
  first_name: string;
  last_name: string;
  email: string;
  source?: string;
}

interface CreateVisitorResponse {
  success: boolean;
  response: number | { id: number } | string; // user_id veya user object
}

interface CreateConversationPayload {
  user_id: string;
  subject: string;
  source?: string;
}

interface CreateConversationResponse {
  success: boolean;
  response: number | string | { id?: number | string; conversation_id?: number | string } | any; // conversation_id farklı formatlarda gelebilir
}

interface SendMessagePayload {
  conversation_id: string;
  user_id: string;
  message: string;
}

interface SendMessageResponse {
  success: boolean;
  response: number | string | { id?: number | string; message_id?: number | string } | any; // message_id farklı formatlarda gelebilir
}

interface GetMessagesPayload {
  conversation_id: string;
}

interface GetNewMessagesPayload {
  conversation_id: string;
  user_id: string; // user_id gerekli
  last_message_id?: string; // Son alınan mesaj ID'si (opsiyonel)
  datetime?: string; // Son mesajın datetime'ı (opsiyonel ama API bazen istiyor)
}

interface Message {
  id: string;
  user_id: string;
  message: string;
  creation_time?: string; // Mesaj oluşturulma zamanı
}

interface GetMessagesResponse {
  success: boolean;
  response: {
    messages?: Message[];
    response?: {
      messages?: Message[];
    };
  } | Message[]; // Response direkt array de olabilir
}

interface GetConversationsPayload {
  user_id: string;
}

interface Conversation {
  id: string;
  subject: string;
  status_code: string;
  creation_time: string;
}

interface GetConversationsResponse {
  success: boolean;
  response: Conversation[] | { conversations?: Conversation[] };
}

// 1. Create Visitor (add-user kullanarak)
export const createVisitor = createAsyncThunk(
  "dialogfusion/createVisitor",
  async (
    { first_name, last_name, email, source = "web" }: CreateVisitorPayload,
    thunkAPI
  ) => {
    try {
      // Önce kullanıcının var olup olmadığını kontrol et
      let userId: string | null = null;
      const token = await getDialogFusionToken();
      
      try {
        const checkUserResponse = await axios.post(
          DIALOGFUSION_API_URL,
          {
            token,
            function: "get-user-by",
            by: "email",
            value: email,
          }
        );

        if (checkUserResponse.data.success && checkUserResponse.data.response && checkUserResponse.data.response.id) {
          // Kullanıcı zaten var
          userId = checkUserResponse.data.response.id.toString();
          
          return {
            user_id: userId,
            first_name: checkUserResponse.data.response.first_name || first_name,
            last_name: checkUserResponse.data.response.last_name || last_name,
            email: checkUserResponse.data.response.email || email,
          };
        }
      } catch (checkError) {
        // Kullanıcı bulunamadı, yeni oluşturulacak
      }

      // Kullanıcı yoksa yeni oluştur (token zaten yukarıda çekildi)
      const { data } = await axios.post<CreateVisitorResponse>(
        DIALOGFUSION_API_URL,
        {
          token,
          function: "add-user",
          first_name,
          last_name,
          email,
          user_type: "visitor",
          source,
        }
      );

      if (!data.success) {
        return thunkAPI.rejectWithValue("Ziyaretçi oluşturulamadı");
      }

      // add-user response'u user_id döndürüyor
      if (typeof data.response === 'object' && data.response !== null && 'id' in data.response) {
        userId = (data.response as { id: number }).id.toString();
      } else if (typeof data.response === 'number') {
        userId = data.response.toString();
      } else if (typeof data.response === 'string') {
        userId = data.response;
      }

      if (!userId) {
        return thunkAPI.rejectWithValue("Kullanıcı ID alınamadı");
      }


      return {
        user_id: userId,
        first_name,
        last_name,
        email,
      };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Ziyaretçi oluşturulamadı"
      );
    }
  }
);

// 2. Create Conversation
export const createConversation = createAsyncThunk(
  "dialogfusion/createConversation",
  async (
    { user_id, subject, source = "web" }: CreateConversationPayload,
    thunkAPI
  ) => {
    try {
      const token = await getDialogFusionToken();
      const { data } = await axios.post<CreateConversationResponse>(
        DIALOGFUSION_API_URL,
        {
          token,
          function: "new-conversation",
          user_id,
          title: subject, // API dokümantasyonuna göre 'title' parametresi kullanılıyor
          source,
        }
      );

      if (!data.success) {
        return thunkAPI.rejectWithValue("Konuşma oluşturulamadı");
      }

      // Response formatını kontrol et ve conversation_id'yi çıkar
      // API dokümantasyonuna göre: response.details.id conversation_id'yi içerir
      let conversationId: string | null = null;
      

      if (typeof data.response === 'number') {
        conversationId = data.response.toString();
      } else if (typeof data.response === 'string') {
        conversationId = data.response;
      } else if (typeof data.response === 'object' && data.response !== null) {
        const responseObj = data.response as any;
        
        // API dokümantasyonuna göre: response.details.id conversation_id
        if (responseObj.details && responseObj.details.id !== undefined) {
          conversationId = responseObj.details.id.toString();
        } else if (responseObj.id !== undefined) {
          conversationId = responseObj.id.toString();
        } else if (responseObj.conversation_id !== undefined) {
          conversationId = responseObj.conversation_id.toString();
        } else if (responseObj.response && responseObj.response.details && responseObj.response.details.id) {
          conversationId = responseObj.response.details.id.toString();
        } else if (responseObj.response && responseObj.response.id) {
          conversationId = responseObj.response.id.toString();
        }
      }

      if (!conversationId) {
        return thunkAPI.rejectWithValue("Konuşma ID alınamadı");
      }


      return {
        conversation_id: conversationId,
        user_id,
        subject,
      };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Konuşma oluşturulamadı"
      );
    }
  }
);

// 3. Send Message
export const sendMessage = createAsyncThunk(
  "dialogfusion/sendMessage",
  async (
    { conversation_id, user_id, message }: SendMessagePayload,
    thunkAPI
  ) => {
    try {
      const token = await getDialogFusionToken();
      const { data } = await axios.post<SendMessageResponse>(
        DIALOGFUSION_API_URL,
        {
          token,
          function: "send-message",
          conversation_id,
          user_id,
          message,
        }
      );

      if (!data.success) {
        return thunkAPI.rejectWithValue("Mesaj gönderilemedi");
      }

      // Response formatını kontrol et ve message_id'yi çıkar
      let messageId: string | null = null;
      

      if (typeof data.response === 'number') {
        messageId = data.response.toString();
      } else if (typeof data.response === 'string') {
        messageId = data.response;
      } else if (typeof data.response === 'object' && data.response !== null) {
        const responseObj = data.response as any;
        if (responseObj.id !== undefined) {
          messageId = responseObj.id.toString();
        } else if (responseObj.message_id !== undefined) {
          messageId = responseObj.message_id.toString();
        } else if (responseObj.response && responseObj.response.id) {
          messageId = responseObj.response.id.toString();
        }
      }

      if (!messageId) {
        return thunkAPI.rejectWithValue("Mesaj ID alınamadı");
      }


      return {
        message_id: messageId,
        conversation_id,
        user_id,
        message,
      };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Mesaj gönderilemedi"
      );
    }
  }
);

// 4. Get Messages (get-new-messages veya get-conversation kullanarak)
export const getMessages = createAsyncThunk(
  "dialogfusion/getMessages",
  async ({ conversation_id }: GetMessagesPayload, thunkAPI) => {
    try {
      // get-conversation fonksiyonu mesajları da döndürüyor
      const token = await getDialogFusionToken();
      const { data } = await axios.post<GetMessagesResponse>(
        DIALOGFUSION_API_URL,
        {
          token,
          function: "get-conversation",
          conversation_id,
        }
      );

      if (!data.success) {
        return thunkAPI.rejectWithValue("Mesajlar alınamadı");
      }

      // Response formatını kontrol et
      // API dokümantasyonuna göre: response.messages array içerir
      let messages: Message[] = [];
      
      if (Array.isArray(data.response)) {
        // Direkt array ise
        messages = data.response;
      } else if (typeof data.response === 'object' && data.response !== null) {
        // Object ise messages property'sini kontrol et
        const responseObj = data.response as any;
        if (Array.isArray(responseObj.messages)) {
          messages = responseObj.messages;
        } else if (responseObj.response && Array.isArray(responseObj.response.messages)) {
          messages = responseObj.response.messages;
        } else if (responseObj.details && Array.isArray(responseObj.details.messages)) {
          messages = responseObj.details.messages;
        }
      }


      return {
        conversation_id,
        messages,
      };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Mesajlar alınamadı"
      );
    }
  }
);

// 4b. Get New Messages (get-new-messages kullanarak - sadece yeni mesajları getirir)
export const getNewMessages = createAsyncThunk(
  "dialogfusion/getNewMessages",
  async ({ conversation_id, user_id, last_message_id, datetime }: GetNewMessagesPayload, thunkAPI) => {
    try {
      const token = await getDialogFusionToken();
      const requestBody: any = {
        token,
        function: "get-new-messages",
        conversation_id,
        user_id, // user_id gerekli
      };

      // Eğer last_message_id varsa ekle (opsiyonel)
      if (last_message_id) {
        requestBody.last_message_id = last_message_id;
      }

      // Eğer datetime varsa ekle (API bazen istiyor)
      if (datetime) {
        requestBody.datetime = datetime;
      } else {
        // Eğer datetime yoksa şu anki zamanı gönder
        const now = new Date();
        requestBody.datetime = now.toISOString().slice(0, 19).replace('T', ' '); // "YYYY-MM-DD HH:mm:ss" formatı
      }

      const { data } = await axios.post<GetMessagesResponse>(
        DIALOGFUSION_API_URL,
        requestBody
      );

      if (!data.success) {
        return thunkAPI.rejectWithValue("Yeni mesajlar alınamadı");
      }

      // Response formatını kontrol et
      let messages: Message[] = [];
      
      if (Array.isArray(data.response)) {
        messages = data.response;
      } else if (typeof data.response === 'object' && data.response !== null) {
        const responseObj = data.response as any;
        if (Array.isArray(responseObj.messages)) {
          messages = responseObj.messages;
        } else if (responseObj.response && Array.isArray(responseObj.response.messages)) {
          messages = responseObj.response.messages;
        }
      }


      return {
        conversation_id,
        messages,
      };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Yeni mesajlar alınamadı"
      );
    }
  }
);

// 5. Get Conversations (get-user-conversations kullanarak)
export const getConversations = createAsyncThunk(
  "dialogfusion/getConversations",
  async ({ user_id }: GetConversationsPayload, thunkAPI) => {
    try {
      const token = await getDialogFusionToken();
      const { data } = await axios.post<GetConversationsResponse>(
        DIALOGFUSION_API_URL,
        {
          token,
          function: "get-user-conversations",
          user_id,
        }
      );

      if (!data.success) {
        return thunkAPI.rejectWithValue("Konuşmalar alınamadı");
      }

      // Response bir array veya object olabilir
      let conversations: Conversation[] = [];
      
      
      if (Array.isArray(data.response)) {
        conversations = data.response;
      } else if (typeof data.response === 'object' && data.response !== null) {
        const responseObj = data.response as any;
        if (Array.isArray(responseObj.conversations)) {
          conversations = responseObj.conversations;
        } else if (Array.isArray(responseObj.response)) {
          conversations = responseObj.response;
        }
      }

      // Conversation ID'lerini normalize et (string'e çevir) ve field'ları normalize et
      conversations = conversations.map((conv: any) => {
        // Title/subject field'ını normalize et - önce title'a bak, sonra subject'e
        const conversationTitle = conv.title || conv.subject || 'Sohbet';
        
        return {
          ...conv,
          id: String(conv.id || conv.conversation_id || conv.ID || ''),
          subject: conversationTitle, // Her zaman title/subject'i subject field'ına ata
          title: conversationTitle, // title field'ını da güncelle
          creation_time: conv.conversation_creation_time || conv.creation_time || '',
        };
      }).filter((conv: any) => conv.id); // ID'si olmayanları filtrele

      if (conversations.length > 0) {
      }

      return {
        user_id,
        conversations,
      };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Konuşmalar alınamadı"
      );
    }
  }
);

// 6. Set Typing (set-typing - kullanıcının yazıyor durumunu ayarlar)
interface SetTypingPayload {
  conversation_id: string;
  user_id: string;
  is_typing: boolean; // true = yazıyor, false = yazmıyor
}

export const setTyping = createAsyncThunk(
  "dialogfusion/setTyping",
  async ({ conversation_id, user_id, is_typing }: SetTypingPayload, thunkAPI) => {
    try {
      const token = await getDialogFusionToken();
      const { data } = await axios.post(
        DIALOGFUSION_API_URL,
        {
          token,
          function: "set-typing",
          conversation_id,
          user_id,
          is_typing: is_typing ? 1 : 0, // API boolean yerine 1/0 bekliyor olabilir
        }
      );

      if (!data.success) {
        // Typing durumu kritik değil, hata olsa bile devam et
      }

      return { conversation_id, user_id, is_typing };
    } catch (error: any) {
      // Typing durumu kritik değil, hata olsa bile devam et
      return { conversation_id, user_id, is_typing };
    }
  }
);

// 7. Check Agent Typing (is-agent-typing - agent'ın yazıyor olup olmadığını kontrol eder)
interface CheckAgentTypingPayload {
  conversation_id: string;
}

interface CheckAgentTypingResponse {
  success: boolean;
  response: boolean | number; // true/false veya 1/0
}

export const checkAgentTyping = createAsyncThunk(
  "dialogfusion/checkAgentTyping",
  async ({ conversation_id }: CheckAgentTypingPayload, thunkAPI) => {
    try {
      const token = await getDialogFusionToken();
      const { data } = await axios.post<CheckAgentTypingResponse>(
        DIALOGFUSION_API_URL,
        {
          token,
          function: "is-agent-typing",
          conversation_id,
        }
      );

      if (!data.success) {
        return thunkAPI.rejectWithValue("Agent typing durumu kontrol edilemedi");
      }

      // Response boolean veya number (1/0) olabilir
      const isTyping = data.response === true || data.response === 1;

      return { conversation_id, is_typing: isTyping };
    } catch (error: any) {
      // Typing durumu kritik değil, hata olsa bile devam et
      return { conversation_id, is_typing: false };
    }
  }
);

