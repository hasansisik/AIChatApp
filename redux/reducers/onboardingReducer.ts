import { createReducer } from "@reduxjs/toolkit";
import { getActiveOnboardings, markOnboardingAsViewed } from "../actions/onboardingActions";

interface Onboarding {
  _id: string;
  onboardingId?: string; // Parent onboarding ID
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
    })
    // Mark Onboarding as Viewed
    .addCase(markOnboardingAsViewed.pending, (state) => {
      // No loading state change needed
    })
    .addCase(markOnboardingAsViewed.fulfilled, (state, action) => {
      // Remove onboardings that belong to the viewed onboarding
      const onboardingId = action.meta.arg;
      if (onboardingId) {
        state.onboardings = state.onboardings.filter(
          item => item.onboardingId !== onboardingId
        );
      }
    })
    .addCase(markOnboardingAsViewed.rejected, (state, action) => {
      // Error is handled in component
    });
});

export default onboardingReducer;

