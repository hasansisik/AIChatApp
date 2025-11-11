import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";

const DIALOGFUSION_API_URL = "https://app.dialogfusion.com/script/include/api.php";
const DIALOGFUSION_TOKEN = "448033a885bb9c4ab0c734ce7546f3824eeff7d5";

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
      console.log("👤 [dialogfusionActions] createVisitor: Ziyaretçi kontrol ediliyor/oluşturuluyor...", {
        first_name,
        last_name,
        email,
      });

      // Önce kullanıcının var olup olmadığını kontrol et
      let userId: string | null = null;
      
      try {
        const checkUserResponse = await axios.post(
          DIALOGFUSION_API_URL,
          {
            token: DIALOGFUSION_TOKEN,
            function: "get-user-by",
            by: "email",
            value: email,
          }
        );

        if (checkUserResponse.data.success && checkUserResponse.data.response && checkUserResponse.data.response.id) {
          // Kullanıcı zaten var
          userId = checkUserResponse.data.response.id.toString();
          console.log("✅ [dialogfusionActions] createVisitor: Mevcut kullanıcı bulundu, user_id:", userId);
          
          return {
            user_id: userId,
            first_name: checkUserResponse.data.response.first_name || first_name,
            last_name: checkUserResponse.data.response.last_name || last_name,
            email: checkUserResponse.data.response.email || email,
          };
        }
      } catch (checkError) {
        // Kullanıcı bulunamadı, yeni oluşturulacak
        console.log("ℹ️ [dialogfusionActions] createVisitor: Kullanıcı bulunamadı, yeni oluşturuluyor...");
      }

      // Kullanıcı yoksa yeni oluştur
      const { data } = await axios.post<CreateVisitorResponse>(
        DIALOGFUSION_API_URL,
        {
          token: DIALOGFUSION_TOKEN,
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

      console.log("✅ [dialogfusionActions] createVisitor: Ziyaretçi oluşturuldu, user_id:", userId);

      return {
        user_id: userId,
        first_name,
        last_name,
        email,
      };
    } catch (error: any) {
      console.error("❌ [dialogfusionActions] createVisitor: Hata:", error.response?.data || error.message);
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
      console.log("💬 [dialogfusionActions] createConversation: Konuşma oluşturuluyor...", {
        user_id,
        subject,
      });

      const { data } = await axios.post<CreateConversationResponse>(
        DIALOGFUSION_API_URL,
        {
          token: DIALOGFUSION_TOKEN,
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
      
      console.log("🔍 [dialogfusionActions] createConversation: Response format:", JSON.stringify(data.response));

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
        console.error("❌ [dialogfusionActions] createConversation: Conversation ID bulunamadı, response:", data.response);
        return thunkAPI.rejectWithValue("Konuşma ID alınamadı");
      }

      console.log("✅ [dialogfusionActions] createConversation: Konuşma oluşturuldu, conversation_id:", conversationId);

      return {
        conversation_id: conversationId,
        user_id,
        subject,
      };
    } catch (error: any) {
      console.error("❌ [dialogfusionActions] createConversation: Hata:", error.response?.data || error.message);
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
      console.log("📤 [dialogfusionActions] sendMessage: Mesaj gönderiliyor...", {
        conversation_id,
        user_id,
        message: message.substring(0, 50) + "...",
      });

      const { data } = await axios.post<SendMessageResponse>(
        DIALOGFUSION_API_URL,
        {
          token: DIALOGFUSION_TOKEN,
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
      
      console.log("🔍 [dialogfusionActions] sendMessage: Response format:", JSON.stringify(data.response));

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
        console.error("❌ [dialogfusionActions] sendMessage: Message ID bulunamadı, response:", data.response);
        return thunkAPI.rejectWithValue("Mesaj ID alınamadı");
      }

      console.log("✅ [dialogfusionActions] sendMessage: Mesaj gönderildi, message_id:", messageId);

      return {
        message_id: messageId,
        conversation_id,
        user_id,
        message,
      };
    } catch (error: any) {
      console.error("❌ [dialogfusionActions] sendMessage: Hata:", error.response?.data || error.message);
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
      console.log("📥 [dialogfusionActions] getMessages: Mesajlar alınıyor...", {
        conversation_id,
      });

      // get-conversation fonksiyonu mesajları da döndürüyor
      const { data } = await axios.post<GetMessagesResponse>(
        DIALOGFUSION_API_URL,
        {
          token: DIALOGFUSION_TOKEN,
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

      console.log("✅ [dialogfusionActions] getMessages: Mesajlar alındı, toplam:", messages.length);

      return {
        conversation_id,
        messages,
      };
    } catch (error: any) {
      console.error("❌ [dialogfusionActions] getMessages: Hata:", error.response?.data || error.message);
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
      console.log("🆕 [dialogfusionActions] getNewMessages: Yeni mesajlar kontrol ediliyor...", {
        conversation_id,
        user_id,
        last_message_id,
        datetime,
      });

      const requestBody: any = {
        token: DIALOGFUSION_TOKEN,
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

      console.log("✅ [dialogfusionActions] getNewMessages: Yeni mesajlar alındı, toplam:", messages.length);

      return {
        conversation_id,
        messages,
      };
    } catch (error: any) {
      console.error("❌ [dialogfusionActions] getNewMessages: Hata:", error.response?.data || error.message);
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
      console.log("📋 [dialogfusionActions] getConversations: Konuşmalar alınıyor...", {
        user_id,
      });

      const { data } = await axios.post<GetConversationsResponse>(
        DIALOGFUSION_API_URL,
        {
          token: DIALOGFUSION_TOKEN,
          function: "get-user-conversations",
          user_id,
        }
      );

      if (!data.success) {
        return thunkAPI.rejectWithValue("Konuşmalar alınamadı");
      }

      // Response bir array veya object olabilir
      let conversations: Conversation[] = [];
      
      console.log("🔍 [dialogfusionActions] getConversations: Response format:", JSON.stringify(data.response).substring(0, 500));
      
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

      console.log("✅ [dialogfusionActions] getConversations: Konuşmalar alındı, toplam:", conversations.length);
      if (conversations.length > 0) {
        console.log("🔍 [dialogfusionActions] İlk conversation örneği:", JSON.stringify(conversations[0]));
      }

      return {
        user_id,
        conversations,
      };
    } catch (error: any) {
      console.error("❌ [dialogfusionActions] getConversations: Hata:", error.response?.data || error.message);
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
      console.log("⌨️ [dialogfusionActions] setTyping: Typing durumu ayarlanıyor...", {
        conversation_id,
        user_id,
        is_typing,
      });

      const { data } = await axios.post(
        DIALOGFUSION_API_URL,
        {
          token: DIALOGFUSION_TOKEN,
          function: "set-typing",
          conversation_id,
          user_id,
          is_typing: is_typing ? 1 : 0, // API boolean yerine 1/0 bekliyor olabilir
        }
      );

      if (!data.success) {
        console.warn("⚠️ [dialogfusionActions] setTyping: Başarısız, devam ediliyor...");
        // Typing durumu kritik değil, hata olsa bile devam et
      }

      return { conversation_id, user_id, is_typing };
    } catch (error: any) {
      console.warn("⚠️ [dialogfusionActions] setTyping: Hata (devam ediliyor):", error.response?.data || error.message);
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
      const { data } = await axios.post<CheckAgentTypingResponse>(
        DIALOGFUSION_API_URL,
        {
          token: DIALOGFUSION_TOKEN,
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
      console.warn("⚠️ [dialogfusionActions] checkAgentTyping: Hata (devam ediliyor):", error.response?.data || error.message);
      // Typing durumu kritik değil, hata olsa bile devam et
      return { conversation_id, is_typing: false };
    }
  }
);

