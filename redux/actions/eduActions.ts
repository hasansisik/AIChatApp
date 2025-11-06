import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { server } from "@/config";

interface GetSessionsPayload {
  code: string;
}

export interface Session {
  courseName: string;
  days: string;
  hours: string;
  startDate: string;
}

export interface SessionsResponse {
  message: string;
  code: string;
  seanslar: Session[];
}

export const getSessions = createAsyncThunk(
  "edu/getSessions",
  async ({ code }: GetSessionsPayload, thunkAPI) => {
    try {
      const { data } = await axios.get<SessionsResponse>(
        `https://www.kariyermimari.com.tr/MobileApi/Seanslar/${code}`
      );

      return data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Seanslar yüklenemedi"
      );
    }
  }
);

export const updateCourseCode = createAsyncThunk(
  "edu/updateCourseCode",
  async (courseCode: string, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      
      if (!token) {
        return thunkAPI.rejectWithValue("Oturum açmanız gerekiyor");
      }
      
      const { data } = await axios.post(
        `${server}/auth/edit-profile`,
        { courseCode },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      return { courseCode, user: data.user };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Kod güncellenemedi"
      );
    }
  }
);

