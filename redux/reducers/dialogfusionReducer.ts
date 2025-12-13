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
      state.loading = true;
      state.error = null;
    })
    .addCase(createVisitor.fulfilled, (state, action: any) => {
      state.loading = false;
      state.visitor = {
        user_id: action.payload.user_id?.toString() || null,
        first_name: action.payload.first_name || null,
        last_name: action.payload.last_name || null,
        email: action.payload.email || null,
      };
      state.error = null;
    })
    .addCase(createVisitor.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string | null;
    })
    // Create Conversation
    .addCase(createConversation.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(createConversation.fulfilled, (state, action: any) => {
      state.loading = false;
      state.currentConversation = {
        conversation_id: action.payload.conversation_id || null,
        user_id: action.payload.user_id || null,
        subject: action.payload.subject || null,
      };
      state.error = null;
    })
    .addCase(createConversation.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string | null;
    })
    // Send Message
    .addCase(sendMessage.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(sendMessage.fulfilled, (state, action: any) => {
      state.loading = false;
      // Add the sent message to the messages array
      const newMessage: Message = {
        id: action.payload.message_id || '',
        user_id: action.payload.user_id || '',
        message: action.payload.message || '',
      };
      state.messages = [...state.messages, newMessage];
      state.error = null;
    })
    .addCase(sendMessage.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string | null;
    })
    // Get Messages
    .addCase(getMessages.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(getMessages.fulfilled, (state, action: any) => {
      state.loading = false;
      state.messages = action.payload.messages || [];
      state.error = null;
    })
    .addCase(getMessages.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string | null;
    })
    // Get New Messages
    .addCase(getNewMessages.pending, (state) => {
      // Yeni mesajlar kontrol edilirken loading göstermeyelim (arka planda çalışıyor)
      state.error = null;
    })
    .addCase(getNewMessages.fulfilled, (state, action: any) => {
      // Yeni mesajları mevcut mesajlara ekle (duplicate kontrolü ile)
      if (action.payload.messages && action.payload.messages.length > 0) {
        const existingIds = new Set(state.messages.map((m: Message) => m.id));
        const newMessages = action.payload.messages.filter((m: Message) => !existingIds.has(m.id));
        
        if (newMessages.length > 0) {
          state.messages = [...state.messages, ...newMessages];
        }
      }
      state.error = null;
    })
    .addCase(getNewMessages.rejected, (state, action) => {
      // Yeni mesajlar alınamazsa sessizce devam et (arka planda çalışıyor)
    })
    // Get Conversations
    .addCase(getConversations.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(getConversations.fulfilled, (state, action: any) => {
      state.loading = false;
      state.conversations = action.payload.conversations || [];
      // Otomatik seçim yapma, kullanıcı seçim yapacak
      state.error = null;
    })
    .addCase(getConversations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string | null;
    })
    // Select Conversation
    .addCase("dialogfusion/selectConversation", (state, action: any) => {
      const conversationId = action.payload.conversation_id;
      
      if (!conversationId) {
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
      state.error = null;
    })
    // Clear Messages
    .addCase("dialogfusion/clearMessages", (state) => {
      state.messages = [];
    })
    // Reset State
    .addCase("dialogfusion/reset", (state) => {
      return initialState;
    });
});

