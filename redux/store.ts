
import { configureStore } from "@reduxjs/toolkit";
import {userReducer} from "./reducers/userReducer";
import {eduReducer} from "./reducers/eduReducer";
import {aiReducer} from "./reducers/aiReducer";
import {dialogfusionReducer} from "./reducers/dialogfusionReducer";

export const store = configureStore({
  reducer: {
    user: userReducer,
    edu: eduReducer,
    ai: aiReducer,
    dialogfusion: dialogfusionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;