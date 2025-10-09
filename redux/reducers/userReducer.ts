import { createReducer } from "@reduxjs/toolkit";
import { register, login, loadUser, logout, verifyEmail, againEmail, forgotPassword, resetPassword, editProfile, verifyPassword } from "../actions/userActions";

interface UserState {
    items: any[];
    item: any;
    loading: boolean;
    error: string | null;
    isAuthenticated?: boolean;
    user?: any;
    message?: string | null;
}

const initialState: UserState = {
    items: [],
    item: {},
    loading: false,
    error: null,
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
        // Load User
        .addCase(loadUser.pending, (state) => {
            state.loading = true;
        })
        .addCase(loadUser.fulfilled, (state, action) => {
            state.loading = false;
            state.isAuthenticated = true;
            state.user = action.payload;
        })
        .addCase(loadUser.rejected, (state, action) => {
            state.loading = false;
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
            state.message = action.payload;
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
    // Error
    builder.addCase("clearError", (state) => {
        state.error = null;
    });
    builder.addCase("clearMessage", (state) => {
        state.message = null;
    });
});