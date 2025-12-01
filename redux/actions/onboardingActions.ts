import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { server } from "@/config";

// Get Active Onboardings (Public - for app)
export const getActiveOnboardings = createAsyncThunk(
  "onboarding/getActiveOnboardings",
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(`${server}/onboardings/active`);
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

