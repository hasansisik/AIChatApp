import { createReducer } from "@reduxjs/toolkit";
import { getPublicSettings } from "../actions/settingsActions";

interface PublicSettings {
  dialogfusionToken: string;
  contactWhatsapp: string;
  contactPhone: string;
  contactWhatsappMessage: string;
}

interface SettingsState {
  publicSettings: PublicSettings | null;
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  publicSettings: null,
  loading: false,
  error: null,
};

export const settingsReducer = createReducer(initialState, (builder) => {
  builder
    // Get Public Settings
    .addCase(getPublicSettings.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(getPublicSettings.fulfilled, (state, action: any) => {
      state.loading = false;
      state.publicSettings = action.payload;
      state.error = null;
    })
    .addCase(getPublicSettings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string | null;
    });
});

