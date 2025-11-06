import { createReducer } from "@reduxjs/toolkit";
import { getSessions, updateCourseCode } from "../actions/eduActions";

interface EduState {
  sessions: any[];
  code: string | null;
  loading: boolean;
  error: string | null;
  message: string | null;
}

const initialState: EduState = {
  sessions: [],
  code: null,
  loading: false,
  error: null,
  message: null,
};

export const eduReducer = createReducer(initialState, (builder) => {
  builder
    // Get Sessions
    .addCase(getSessions.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(getSessions.fulfilled, (state, action) => {
      state.loading = false;
      state.sessions = action.payload.seanslar || [];
      state.code = action.payload.code || null;
      state.error = null;
    })
    .addCase(getSessions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string | null;
      state.sessions = [];
    })
    // Update Course Code
    .addCase(updateCourseCode.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(updateCourseCode.fulfilled, (state, action) => {
      state.loading = false;
      state.code = action.payload.courseCode;
      state.message = "Kod başarıyla güncellendi";
      state.error = null;
    })
    .addCase(updateCourseCode.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string | null;
    })
    // Clear Error
    builder.addCase("edu/clearError", (state) => {
      state.error = null;
    })
    // Clear Message
    builder.addCase("edu/clearMessage", (state) => {
      state.message = null;
    });
});

