import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { checkDemoStatus } from "../actions/couponActions";

interface CouponState {
  demoStatus: {
    hasDemo: boolean;
    hasPurchase: boolean;
    expiresAt: string | null;
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
      if (state.demoStatus?.expiresAt) {
        const expiresAt = new Date(state.demoStatus.expiresAt);
        const now = new Date();
        // expiresAt geçmişteyse demo süresi dolmuş demektir (hasDemo false olsa bile)
        // Çünkü hasDemo sadece aktif demo için true, ama expiresAt geçmişteyse demo dolmuş demektir
        state.isDemoExpired = expiresAt <= now;
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
        
        // Demo süresi dolmuş mu kontrol et
        if (action.payload?.expiresAt) {
          const expiresAt = new Date(action.payload.expiresAt);
          const now = new Date();
          // expiresAt geçmişteyse demo süresi dolmuş demektir (hasDemo false olsa bile)
          // Çünkü hasDemo sadece aktif demo için true, ama expiresAt geçmişteyse demo dolmuş demektir
          state.isDemoExpired = expiresAt <= now;
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

