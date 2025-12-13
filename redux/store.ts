
import { configureStore } from "@reduxjs/toolkit";
import {userReducer} from "./reducers/userReducer";
import {eduReducer} from "./reducers/eduReducer";
import {dialogfusionReducer} from "./reducers/dialogfusionReducer";
import {onboardingReducer} from "./reducers/onboardingReducer";
import couponReducer from "./reducers/couponReducer";
import {settingsReducer} from "./reducers/settingsReducer";

export const store = configureStore({
  reducer: {
    user: userReducer,
    edu: eduReducer,
    dialogfusion: dialogfusionReducer,
    onboarding: onboardingReducer,
    coupon: couponReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;