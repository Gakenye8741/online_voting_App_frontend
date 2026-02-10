// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./themeSlice";
import authReducer from "./authSlice";
import { authApi } from "./Apis/Auth.Api";
import { electionsApi } from "./Apis/Election.Api";
import { candidatesApi } from "./Apis/Candidates.Api";
import { applicationApi } from "./Apis/Applications.Api";
import { positionApi } from "./Apis/Positions.Api";
import { usersApi } from "./Apis/User.Api";
import { notificationApi } from "./Apis/Notification.Api";

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [electionsApi.reducerPath]: electionsApi.reducer,
    [candidatesApi.reducerPath]: candidatesApi.reducer,
    [applicationApi.reducerPath]: applicationApi.reducer,
    [positionApi.reducerPath]: positionApi.reducer,
    [usersApi.reducerPath] : usersApi.reducer,
    [notificationApi.reducerPath] : notificationApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware,candidatesApi.middleware,electionsApi.middleware,applicationApi.middleware,positionApi.middleware, usersApi.middleware, notificationApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
