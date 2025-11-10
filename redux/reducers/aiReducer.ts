import { createReducer } from "@reduxjs/toolkit";
import { getToken, startConversation, sendAudio } from "../actions/aiActions";

interface AIState {
  token: {
    access_token: string | null;
    token_type: string | null;
    expires_in: number | null;
  };
  conversation: {
    conversation_id: string | null;
    web_stream_url: string | null;
    avatar_id: number | null;
    status: string | null;
  };
  audioResponse: {
    conversation_id: string | null;
    status: string | null;
    message: string | null;
    has_speech: boolean | null;
  };
  loading: boolean;
  error: string | null;
}

const initialState: AIState = {
  token: {
    access_token: null,
    token_type: null,
    expires_in: null,
  },
  conversation: {
    conversation_id: null,
    web_stream_url: null,
    avatar_id: null,
    status: null,
  },
  audioResponse: {
    conversation_id: null,
    status: null,
    message: null,
    has_speech: null,
  },
  loading: false,
  error: null,
};

export const aiReducer = createReducer(initialState, (builder) => {
  builder
    // Get Token
    .addCase(getToken.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(getToken.fulfilled, (state, action) => {
      state.loading = false;
      state.token = {
        access_token: action.payload.access_token,
        token_type: action.payload.token_type,
        expires_in: action.payload.expires_in,
      };
      state.error = null;
    })
    .addCase(getToken.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string | null;
    })
    // Start Conversation
    .addCase(startConversation.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(startConversation.fulfilled, (state, action) => {
      state.loading = false;
      state.conversation = {
        conversation_id: action.payload.conversation_id,
        web_stream_url: action.payload.web_stream_url,
        avatar_id: action.payload.avatar_id,
        status: action.payload.status,
      };
      state.error = null;
    })
    .addCase(startConversation.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string | null;
    })
    // Send Audio
    .addCase(sendAudio.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(sendAudio.fulfilled, (state, action) => {
      state.loading = false;
      state.audioResponse = {
        conversation_id: action.payload.conversation_id,
        status: action.payload.status,
        message: action.payload.message,
        has_speech: action.payload.has_speech,
      };
      state.error = null;
    })
    .addCase(sendAudio.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string | null;
    })
    // Clear Error
    .addCase("ai/clearError", (state) => {
      state.error = null;
    });
});

