import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { checkDemoStatus } from "../actions/couponActions";

interface CouponState {
  demoStatus: {
    hasDemo: boolean;
    hasPurchase: boolean;
    minutesRemaining: number | null;
  } | null;
  isDemoExpired: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: CouponState = {
  demoStatus: null,
  isDemoExpired: false,
  loading: false,
  error: null,
};

const couponSlice = createSlice({
  name: "coupon",
  initialState,
  reducers: {
    checkDemoExpiration: (state) => {
      if (state.demoStatus?.minutesRemaining !== null && state.demoStatus?.minutesRemaining !== undefined) {
        // minutesRemaining <= 0 ise demo süresi dolmuş demektir
        state.isDemoExpired = state.demoStatus.minutesRemaining <= 0;
      } else {
        state.isDemoExpired = false;
      }
    },
    clearDemoStatus: (state) => {
      state.demoStatus = null;
      state.isDemoExpired = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkDemoStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkDemoStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.demoStatus = action.payload;
        
        // Demo süresi dolmuş mu kontrol et - minutesRemaining kullan
        if (action.payload?.minutesRemaining !== null && action.payload?.minutesRemaining !== undefined) {
          // minutesRemaining <= 0 ise demo süresi dolmuş demektir
          state.isDemoExpired = action.payload.minutesRemaining <= 0;
        } else {
          state.isDemoExpired = false;
        }
      })
      .addCase(checkDemoStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isDemoExpired = false;
      });
  },
});

export const { checkDemoExpiration, clearDemoStatus } = couponSlice.actions;
export default couponSlice.reducer;

