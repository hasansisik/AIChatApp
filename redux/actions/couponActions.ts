import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { server } from "@/config";

// Validate Coupon (Authenticated users)
export const validateCoupon = createAsyncThunk(
  "coupon/validateCoupon",
  async (code: string, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      
      if (!token) {
        return thunkAPI.rejectWithValue("Oturum açmanız gerekiyor");
      }

      const response = await axios.post(
        `${server}/coupons/validate`,
        { code },
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

// Check Demo Status (Optional authentication)
export const checkDemoStatus = createAsyncThunk(
  "coupon/checkDemoStatus",
  async (_, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const headers: any = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.get(`${server}/coupons/demo-status`, {
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

