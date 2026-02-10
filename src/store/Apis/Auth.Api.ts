import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -------------------- TYPES --------------------
export interface RegisterRequest {
  reg_no: string;
  password?: string;
  role?: "voter" | "admin";
}

export interface LoginRequest {
  reg_no: string;
  password: string;
  secret_code?: string;
}

export interface UpdatePasswordRequest {
  password: string;
}

export interface CompleteProfileRequest {
  name: string;
  school:
    | "Science"
    | "Education"
    | "Business"
    | "Humanities and Developmental_Studies"
    | "TVET";
  expected_graduation: string;
  email: string;
}

export interface SetSecretCodeRequest {
  secret_code: string;
}

export interface AuthResponse {
  message?: string;
  token?: string;
  user: any;
  requireSecretCode?: boolean;
  requireProfileCompletion?: boolean;
}

export interface UserResponse {
  user: any;
}

// -------------------- API --------------------
export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://online-voting-system-oq4p.onrender.com/api/auth/",
    prepareHeaders: async (headers, { getState }) => {
      // First try Redux state
      let token = (getState() as any).auth.token;

      // If no token in state, try AsyncStorage (useful for app reloads)
      if (!token) {
        token = await AsyncStorage.getItem("token");
      }

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Auth"],
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (payload) => ({
        url: "register",
        method: "POST",
        body: payload,
      }),
    }),
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (payload) => ({
        url: "login",
        method: "POST",
        body: payload,
      }),
    }),
    updatePassword: builder.mutation<AuthResponse, { reg_no: string; password: string }>({
      query: ({ reg_no, password }) => ({
        url: `update-password?reg_no=${encodeURIComponent(reg_no)}`,
        method: "PUT",
        body: { password },
      }),
    }),
    completeProfile: builder.mutation<AuthResponse, { reg_no: string } & CompleteProfileRequest>({
      query: ({ reg_no, ...data }) => ({
        url: `complete-profile?reg_no=${encodeURIComponent(reg_no)}`,
        method: "PUT",
        body: data,
      }),
    }),
    setSecretCode: builder.mutation<AuthResponse, SetSecretCodeRequest>({
      query: (payload) => ({
        url: "set-secret-code",
        method: "PUT",
        body: payload,
      }),
    }),
    getUserByRegNo: builder.query<UserResponse, { reg_no: string }>({
      query: ({ reg_no }) => ({
        url: `user/by-reg-no?reg_no=${encodeURIComponent(reg_no)}`,
        method: "GET",
      }),
    }),
  }),
});

// -------------------- HOOKS --------------------
export const {
  useRegisterMutation,
  useLoginMutation,
  useUpdatePasswordMutation,
  useCompleteProfileMutation,
  useSetSecretCodeMutation,
  useGetUserByRegNoQuery,
} = authApi;
