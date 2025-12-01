import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { server } from "@/config";

// Get Active Onboardings (Public - for app, user-specific if authenticated)
export const getActiveOnboardings = createAsyncThunk(
  "onboarding/getActiveOnboardings",
  async (_, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const headers: any = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await axios.get(`${server}/onboardings/active`, {
        headers,
        withCredentials: true,
      });
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

// Mark Onboarding as Viewed (Authenticated users only)
export const markOnboardingAsViewed = createAsyncThunk(
  "onboarding/markOnboardingAsViewed",
  async (onboardingId: string, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      
      if (!token) {
        return thunkAPI.rejectWithValue("Oturum açmanız gerekiyor");
      }

      const response = await axios.post(
        `${server}/onboardings/mark-viewed`,
        { onboardingId },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );
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

