
import { configureStore } from "@reduxjs/toolkit";
import {userReducer} from "./reducers/userReducer";
import {eduReducer} from "./reducers/eduReducer";
import {aiReducer} from "./reducers/aiReducer";

export const store = configureStore({
  reducer: {
    user: userReducer,
    edu: eduReducer,
    ai: aiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;