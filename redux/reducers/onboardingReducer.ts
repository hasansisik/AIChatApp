import { createReducer } from "@reduxjs/toolkit";
import { getActiveOnboardings } from "../actions/onboardingActions";

interface Onboarding {
  _id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  order: number;
}

interface OnboardingState {
  onboardings: Onboarding[];
  loading: boolean;
  error: string | null;
}

const initialState: OnboardingState = {
  onboardings: [],
  loading: false,
  error: null,
};

export const onboardingReducer = createReducer(initialState, (builder) => {
  builder
    // Get Active Onboardings
    .addCase(getActiveOnboardings.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(getActiveOnboardings.fulfilled, (state, action) => {
      state.loading = false;
      state.onboardings = action.payload.onboardings || [];
      state.error = null;
    })
    .addCase(getActiveOnboardings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
});

export default onboardingReducer;

