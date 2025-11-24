import { createReducer } from "@reduxjs/toolkit";
import { register, login, loadUser, logout, verifyEmail, againEmail, forgotPassword, resetPassword, editProfile, verifyPassword, checkInitialAuth, updateOnboardingData, addFavoriteAI, removeFavoriteAI, getFavoriteAIs } from "../actions/userActions";

interface UserState {
    items: any[];
    item: any;
    loading: boolean;
    error: string | null;
    isAuthenticated?: boolean;
    user?: any;
    message?: string | null;
    isOnboardingCompleted?: boolean;
}

const initialState: UserState = {
    items: [],
    item: {},
    loading: false,
    error: null,
    isAuthenticated: false,
    user: null,
    message: null,
    isOnboardingCompleted: false,
};

export const userReducer = createReducer(initialState, (builder) => {
    builder
        // Register
        .addCase(register.pending, (state) => {
            state.loading = true;
        })
        .addCase(register.fulfilled, (state, action) => {
            state.loading = false;
            state.isAuthenticated = false;
            state.user = action.payload;
        })
        .addCase(register.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string | null;
        })
        // Login
        .addCase(login.pending, (state) => {
            state.loading = true;
        })
        .addCase(login.fulfilled, (state, action) => {
            state.loading = false;
            state.isAuthenticated = true;
            state.user = action.payload;
        })
        .addCase(login.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string | null;
        })
        // Check Initial Auth
        .addCase(checkInitialAuth.pending, (state) => {
            state.loading = true;
        })
        .addCase(checkInitialAuth.fulfilled, (state, action) => {
            state.loading = false;
            state.isAuthenticated = action.payload.isAuthenticated;
        })
        .addCase(checkInitialAuth.rejected, (state) => {
            state.loading = false;
            state.isAuthenticated = false;
        })
        // Load User
        .addCase(loadUser.pending, (state) => {
            state.loading = true;
        })
        .addCase(loadUser.fulfilled, (state, action) => {
            state.loading = false;
            state.isAuthenticated = true;
            state.user = action.payload;
            state.isOnboardingCompleted = action.payload.isOnboardingCompleted || false;
        })
        .addCase(loadUser.rejected, (state, action) => {
            state.loading = false;
            state.isAuthenticated = false;
            state.error = action.payload as string | null;
        })
        // Logout
        .addCase(logout.pending, (state) => {
            state.loading = true;
        })
        .addCase(logout.fulfilled, (state, action) => {
            state.loading = false;
            state.isAuthenticated = false;
            state.user = null;
            state.message = action.payload;
        })
        .addCase(logout.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string | null;
        })
        //Verify
        .addCase(verifyEmail.pending, (state) => {
            state.loading = true;
        })
        .addCase(verifyEmail.fulfilled, (state, action) => {
            state.loading = false;
            state.message = action.payload.message;
            if (action.payload.isAuthenticated && action.payload.user) {
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.isOnboardingCompleted = action.payload.user.isOnboardingCompleted || false;
            }
        })
        .addCase(verifyEmail.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string | null;
        })
        // Again Email
        .addCase(againEmail.pending, (state) => {
            state.loading = true;
        })
        .addCase(againEmail.fulfilled, (state) => {
            state.loading = false;
            state.message = 'Email successfully sent again.';
        })
        .addCase(againEmail.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string | null;
        })
        // Forgot Password
        .addCase(forgotPassword.pending, (state) => {
            state.loading = true;
        })
        .addCase(forgotPassword.fulfilled, (state) => {
            state.loading = false;
            state.message = 'Password reset email sent.';
        })
        .addCase(forgotPassword.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string | null;
        })
        // Reset Password
        .addCase(resetPassword.pending, (state) => {
            state.loading = true;
        })
        .addCase(resetPassword.fulfilled, (state) => {
            state.loading = false;
            state.message = 'Password reset successful.';
        })
        .addCase(resetPassword.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string | null;
        })
        // Edit Profile
        .addCase(editProfile.pending, (state) => {
            state.loading = true;
        })
        .addCase(editProfile.fulfilled, (state) => {
            state.loading = false;
            state.message = 'Profil başarıyla düzenlendi.';
        })
        .addCase(editProfile.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string | null;
        })
        // Verify Password
        .addCase(verifyPassword.pending, (state) => {
            state.loading = true;
        })
        .addCase(verifyPassword.fulfilled, (state) => {
            state.loading = false;
            state.message = 'Şifre Doğrulaması Başarılı.';
        })
        .addCase(verifyPassword.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string | null;
        })
        // Update Onboarding Data
        .addCase(updateOnboardingData.pending, (state) => {
            state.loading = true;
        })
        .addCase(updateOnboardingData.fulfilled, (state, action) => {
            state.loading = false;
            state.message = 'Onboarding verileri başarıyla kaydedildi.';
            state.isOnboardingCompleted = true;
            // Update user onboarding data if user exists
            if (state.user) {
                state.user.onboardingData = action.payload.onboardingData;
                state.user.isOnboardingCompleted = true;
            }
        })
        .addCase(updateOnboardingData.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string | null;
        })
        // Add Favorite AI
        .addCase(addFavoriteAI.pending, (state) => {
            state.loading = true;
        })
        .addCase(addFavoriteAI.fulfilled, (state, action) => {
            state.loading = false;
            if (state.user) {
                state.user.favoriteAIs = action.payload;
            }
        })
        .addCase(addFavoriteAI.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string | null;
        })
        // Remove Favorite AI
        .addCase(removeFavoriteAI.pending, (state) => {
            state.loading = true;
        })
        .addCase(removeFavoriteAI.fulfilled, (state, action) => {
            state.loading = false;
            if (state.user) {
                state.user.favoriteAIs = action.payload;
            }
        })
        .addCase(removeFavoriteAI.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string | null;
        })
        // Get Favorite AIs
        .addCase(getFavoriteAIs.pending, (state) => {
            state.loading = true;
        })
        .addCase(getFavoriteAIs.fulfilled, (state, action) => {
            state.loading = false;
            if (state.user) {
                state.user.favoriteAIs = action.payload;
            }
        })
        .addCase(getFavoriteAIs.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string | null;
        })
    // Error
    builder.addCase("clearError", (state) => {
        state.error = null;
    });
    builder.addCase("clearMessage", (state) => {
        state.message = null;
    });
});