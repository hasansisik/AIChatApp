import { createReducer } from "@reduxjs/toolkit";
import {
  createVisitor,
  createConversation,
  sendMessage,
  getMessages,
  getNewMessages,
  getConversations,
} from "../actions/dialogfusionActions";

interface Message {
  id: string;
  user_id: string;
  message: string;
  creation_time?: string; // Mesaj oluşturulma zamanı
}

interface Conversation {
  id: string;
  subject: string;
  status_code: string;
  creation_time?: string;
  conversation_creation_time?: string; // API'den farklı field isimleriyle gelebilir
  title?: string;
}

interface DialogFusionState {
  visitor: {
    user_id: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  currentConversation: {
    conversation_id: string | null;
    user_id: string | null;
    subject: string | null;
  };
  messages: Message[];
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
}

const initialState: DialogFusionState = {
  visitor: {
    user_id: null,
    first_name: null,
    last_name: null,
    email: null,
  },
  currentConversation: {
    conversation_id: null,
    user_id: null,
    subject: null,
  },
  messages: [],
  conversations: [],
  loading: false,
  error: null,
};

export const dialogfusionReducer = createReducer(initialState, (builder) => {
  builder
    // Create Visitor
    .addCase(createVisitor.pending, (state) => {
      console.log("⏳ [dialogfusionReducer] createVisitor.pending");
      state.loading = true;
      state.error = null;
    })
    .addCase(createVisitor.fulfilled, (state, action) => {
      console.log("✅ [dialogfusionReducer] createVisitor.fulfilled:", {
        user_id: action.payload.user_id,
        first_name: action.payload.first_name,
      });
      state.loading = false;
      state.visitor = {
        user_id: action.payload.user_id.toString(),
        first_name: action.payload.first_name,
        last_name: action.payload.last_name,
        email: action.payload.email,
      };
      state.error = null;
    })
    .addCase(createVisitor.rejected, (state, action) => {
      console.error("❌ [dialogfusionReducer] createVisitor.rejected:", action.payload);
      state.loading = false;
      state.error = action.payload as string | null;
    })
    // Create Conversation
    .addCase(createConversation.pending, (state) => {
      console.log("⏳ [dialogfusionReducer] createConversation.pending");
      state.loading = true;
      state.error = null;
    })
    .addCase(createConversation.fulfilled, (state, action) => {
      console.log("✅ [dialogfusionReducer] createConversation.fulfilled:", {
        conversation_id: action.payload.conversation_id,
        subject: action.payload.subject,
      });
      state.loading = false;
      state.currentConversation = {
        conversation_id: action.payload.conversation_id,
        user_id: action.payload.user_id,
        subject: action.payload.subject,
      };
      state.error = null;
    })
    .addCase(createConversation.rejected, (state, action) => {
      console.error("❌ [dialogfusionReducer] createConversation.rejected:", action.payload);
      state.loading = false;
      state.error = action.payload as string | null;
    })
    // Send Message
    .addCase(sendMessage.pending, (state) => {
      console.log("⏳ [dialogfusionReducer] sendMessage.pending");
      state.loading = true;
      state.error = null;
    })
    .addCase(sendMessage.fulfilled, (state, action) => {
      console.log("✅ [dialogfusionReducer] sendMessage.fulfilled:", {
        message_id: action.payload.message_id,
        conversation_id: action.payload.conversation_id,
      });
      state.loading = false;
      // Add the sent message to the messages array
      const newMessage: Message = {
        id: action.payload.message_id,
        user_id: action.payload.user_id,
        message: action.payload.message,
      };
      state.messages = [...state.messages, newMessage];
      state.error = null;
    })
    .addCase(sendMessage.rejected, (state, action) => {
      console.error("❌ [dialogfusionReducer] sendMessage.rejected:", action.payload);
      state.loading = false;
      state.error = action.payload as string | null;
    })
    // Get Messages
    .addCase(getMessages.pending, (state) => {
      console.log("⏳ [dialogfusionReducer] getMessages.pending");
      state.loading = true;
      state.error = null;
    })
    .addCase(getMessages.fulfilled, (state, action) => {
      console.log("✅ [dialogfusionReducer] getMessages.fulfilled:", {
        conversation_id: action.payload.conversation_id,
        messageCount: action.payload.messages.length,
      });
      state.loading = false;
      state.messages = action.payload.messages;
      state.error = null;
    })
    .addCase(getMessages.rejected, (state, action) => {
      console.error("❌ [dialogfusionReducer] getMessages.rejected:", action.payload);
      state.loading = false;
      state.error = action.payload as string | null;
    })
    // Get New Messages
    .addCase(getNewMessages.pending, (state) => {
      // Yeni mesajlar kontrol edilirken loading göstermeyelim (arka planda çalışıyor)
      state.error = null;
    })
    .addCase(getNewMessages.fulfilled, (state, action) => {
      console.log("✅ [dialogfusionReducer] getNewMessages.fulfilled:", {
        conversation_id: action.payload.conversation_id,
        messageCount: action.payload.messages.length,
      });
      
      // Yeni mesajları mevcut mesajlara ekle (duplicate kontrolü ile)
      if (action.payload.messages.length > 0) {
        const existingIds = new Set(state.messages.map(m => m.id));
        const newMessages = action.payload.messages.filter(m => !existingIds.has(m.id));
        
        if (newMessages.length > 0) {
          state.messages = [...state.messages, ...newMessages];
          console.log("🆕 [dialogfusionReducer] Yeni mesajlar eklendi:", newMessages.length);
        }
      }
      state.error = null;
    })
    .addCase(getNewMessages.rejected, (state, action) => {
      // Yeni mesajlar alınamazsa sessizce devam et (arka planda çalışıyor)
      console.error("❌ [dialogfusionReducer] getNewMessages.rejected:", action.payload);
    })
    // Get Conversations
    .addCase(getConversations.pending, (state) => {
      console.log("⏳ [dialogfusionReducer] getConversations.pending");
      state.loading = true;
      state.error = null;
    })
    .addCase(getConversations.fulfilled, (state, action) => {
      console.log("✅ [dialogfusionReducer] getConversations.fulfilled:", {
        user_id: action.payload.user_id,
        conversationCount: action.payload.conversations.length,
      });
      state.loading = false;
      state.conversations = action.payload.conversations;
      // Otomatik seçim yapma, kullanıcı seçim yapacak
      state.error = null;
    })
    .addCase(getConversations.rejected, (state, action) => {
      console.error("❌ [dialogfusionReducer] getConversations.rejected:", action.payload);
      state.loading = false;
      state.error = action.payload as string | null;
    })
    // Select Conversation
    .addCase("dialogfusion/selectConversation", (state, action: any) => {
      console.log("✅ [dialogfusionReducer] selectConversation:", action.payload);
      const conversationId = action.payload.conversation_id;
      
      if (!conversationId) {
        console.error("❌ [dialogfusionReducer] selectConversation: conversation_id eksik");
        return;
      }

      // Conversation'ı conversations array'inden bul veya direkt conversationId'yi kullan
      const conversation = state.conversations.find((c) => c.id === conversationId || c.id === String(conversationId));
      
      state.currentConversation = {
        conversation_id: String(conversationId),
        user_id: action.payload.user_id || state.visitor.user_id,
        subject: conversation?.subject || 'Sohbet',
      };
      
      // Mesajları temizle, yeni konuşma için yüklenecek
      state.messages = [];
    })
    // Clear Error
    .addCase("dialogfusion/clearError", (state) => {
      console.log("🧹 [dialogfusionReducer] clearError");
      state.error = null;
    })
    // Clear Messages
    .addCase("dialogfusion/clearMessages", (state) => {
      console.log("🧹 [dialogfusionReducer] clearMessages");
      state.messages = [];
    })
    // Reset State
    .addCase("dialogfusion/reset", (state) => {
      console.log("🔄 [dialogfusionReducer] reset");
      return initialState;
    });
});

