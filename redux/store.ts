
import { configureStore } from "@reduxjs/toolkit";
import {userReducer} from "./reducers/userReducer";
import {eduReducer} from "./reducers/eduReducer";
import {dialogfusionReducer} from "./reducers/dialogfusionReducer";
import {onboardingReducer} from "./reducers/onboardingReducer";
import couponReducer from "./reducers/couponReducer";

export const store = configureStore({
  reducer: {
    user: userReducer,
    edu: eduReducer,
    dialogfusion: dialogfusionReducer,
    onboarding: onboardingReducer,
    coupon: couponReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;