import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { server } from "@/config";

interface PublicSettings {
  dialogfusionToken: string;
  contactWhatsapp: string;
  contactPhone: string;
  contactWhatsappMessage: string;
}

interface GetPublicSettingsResponse {
  success: boolean;
  settings: PublicSettings;
}

// Get public settings (no authentication required)
export const getPublicSettings = createAsyncThunk(
  "settings/getPublicSettings",
  async (_, thunkAPI) => {
    try {
      const { data } = await axios.get<GetPublicSettingsResponse>(
        `${server}/settings/public`
      );

      if (!data.success) {
        return thunkAPI.rejectWithValue("Ayarlar alınamadı");
      }

      return data.settings;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Ayarlar alınamadı"
      );
    }
  }
);

