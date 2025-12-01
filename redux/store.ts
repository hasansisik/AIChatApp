
import { configureStore } from "@reduxjs/toolkit";
import {userReducer} from "./reducers/userReducer";
import {eduReducer} from "./reducers/eduReducer";
import {dialogfusionReducer} from "./reducers/dialogfusionReducer";
import {onboardingReducer} from "./reducers/onboardingReducer";

export const store = configureStore({
  reducer: {
    user: userReducer,
    edu: eduReducer,
    dialogfusion: dialogfusionReducer,
    onboarding: onboardingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;