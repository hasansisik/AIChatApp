import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { server } from "@/config";

interface RegisterPayload {
  name: string;
  surname: string;
  email: string;
  password: string;
  picture?: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface ResetPasswordPayload {
  email: string;
  passwordToken: string;
  newPassword: string;
}

interface VerifyEmailPayload {
  email: string;
  verificationCode: string;
}

interface AgainEmailPayload {
  email: string;
}

interface VerifyPasswordPayload {
  password: string;
}

interface EditProfilePayload {
  name?: string;
  surname?: string;
  email?: string;
  password?: string;
  picture?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  phoneNumber?: string;
}

interface OnboardingDataPayload {
  interest: string;
  mainGoal: string;
  reason: string;
  favorites: string[];
}

export const register = createAsyncThunk(
  "user/register",
  async ({ name, surname, email, password, picture }: RegisterPayload, thunkAPI) => {
    try {
      const { data } = await axios.post(`${server}/auth/register`, {
        name,
        surname,
        email,
        password,
        picture
      });

      await AsyncStorage.setItem("accessToken", data.user.token);

      return data.user;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

export const login = createAsyncThunk(
  "user/login",
  async ({ email, password }: LoginPayload, thunkAPI) => {
    try {
      const { data } = await axios.post(`${server}/auth/login`, {
        email,
        password,
      });

      await AsyncStorage.setItem("accessToken", data.user.token);
      return data.user;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

export const checkInitialAuth = createAsyncThunk(
  "user/checkInitialAuth",
  async (_, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        return { isAuthenticated: false };
      }
      return { isAuthenticated: true };
    } catch (error: any) {
      return { isAuthenticated: false };
    }
  }
);

export const loadUser = createAsyncThunk(
  "user/loadUser",
  async (_, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");

      if (!token) {
        return thunkAPI.rejectWithValue("Oturum açmanız gerekiyor");
      }

      const { data } = await axios.get(`${server}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      return data.user;
    } catch (error: any) {
      await AsyncStorage.removeItem("accessToken");
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

export const logout = createAsyncThunk("user/logout", async (_, thunkAPI) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");

    if (!token) {
      await AsyncStorage.removeItem("accessToken");
      return "Oturum kapatıldı";
    }

    const { data } = await axios.get(`${server}/auth/logout`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });

    await AsyncStorage.removeItem("accessToken");

    return data.message;
  } catch (error: any) {
    await AsyncStorage.removeItem("accessToken");
    return thunkAPI.rejectWithValue(error.response.data.message);
  }
});

export const verifyEmail = createAsyncThunk(
  "user/verifyEmail",
  async ({ email, verificationCode }: VerifyEmailPayload, thunkAPI) => {
    try {
      const { data } = await axios.post(`${server}/auth/verify-email`, {
        email,
        verificationCode,
      });

      // Save token if user data is returned
      if (data.user && data.user.token) {
        await AsyncStorage.setItem("accessToken", data.user.token);
        return { 
          message: data.message, 
          user: data.user,
          isAuthenticated: true 
        };
      }

      return { 
        message: data.message, 
        user: null,
        isAuthenticated: false 
      };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

export const againEmail = createAsyncThunk(
  "user/againEmail",
  async ({ email }: AgainEmailPayload, thunkAPI) => {
    try {
      const { data } = await axios.post(`${server}/auth/again-email`, { email });

      return data.message;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "user/forgotPassword",
  async (email: string, thunkAPI) => {
    try {
      const { data } = await axios.post(`${server}/auth/forgot-password`, { email });

      return data.message;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

export const resetPassword = createAsyncThunk(
  "user/resetPassword",
  async (
    { email, passwordToken, newPassword }: ResetPasswordPayload,
    thunkAPI
  ) => {
    try {
      const { data } = await axios.post(`${server}/auth/reset-password`, {
        email,
        passwordToken,
        newPassword,
      });

      return data.message;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

export const editProfile = createAsyncThunk(
  "user/editProfile",
  async (userData: EditProfilePayload, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      
      if (!token) {
        return thunkAPI.rejectWithValue("Oturum açmanız gerekiyor");
      }
      
      const { data } = await axios.post(
        `${server}/auth/edit-profile`, 
        userData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      return data.message;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

export const verifyPassword = createAsyncThunk(
  "user/verifyPassword",
  async ({ password }: VerifyPasswordPayload, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      
      if (!token) {
        return thunkAPI.rejectWithValue("Oturum açmanız gerekiyor");
      }
      
      const { data } = await axios.post(
        `${server}/auth/verify-password`, 
        { password },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      return data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

export const updateOnboardingData = createAsyncThunk(
  "user/updateOnboardingData",
  async (onboardingData: OnboardingDataPayload, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      
      if (!token) {
        return thunkAPI.rejectWithValue("Oturum açmanız gerekiyor");
      }
      
      const { data } = await axios.post(
        `${server}/auth/update-onboarding`, 
        onboardingData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      return data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);
