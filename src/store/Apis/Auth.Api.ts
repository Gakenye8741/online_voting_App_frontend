import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -------------------- TYPES --------------------
export interface RegisterRequest {
  reg_no: string;
  password?: string;
  role?: string; 
}

export interface LoginRequest {
  reg_no: string;
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

// Added token to the mutation requests as an optional override
export interface AuthenticatedMutation {
  reg_no: string;
  token?: string; // Optional manual token override
}

export interface AuthResponse {
  message?: string;
  token?: string;
  user?: any;
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
      // 1. Try Redux State first
      let token = (getState() as any).auth?.token;

      // 2. Fallback to AsyncStorage (Critical for app reloads)
      if (!token) {
        token = await AsyncStorage.getItem("token");
      }

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      
      // Ensure we always request JSON
      headers.set("Accept", "application/json");
      return headers;
    },
  }),
  tagTypes: ["User"],
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
      invalidatesTags: ["User"],
    }),

    // Added token override logic to secret code
    setSecretCode: builder.mutation<AuthResponse, SetSecretCodeRequest & { token?: string }>({
      query: ({ secret_code, token }) => ({
        url: "set-secret-code",
        method: "PUT",
        body: { secret_code },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    }),

    // Logic: Pass reg_no as query param. Added token override to fix 401 errors.
    completeProfile: builder.mutation<AuthResponse, AuthenticatedMutation & CompleteProfileRequest>({
      query: ({ reg_no, token, ...profileData }) => ({
        url: `complete-profile?reg_no=${encodeURIComponent(reg_no)}`,
        method: "PUT",
        body: profileData,
        // If token is passed manually, it overrides the prepareHeaders version
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
      invalidatesTags: ["User"],
    }),

    updatePassword: builder.mutation<AuthResponse, { reg_no: string; password: string; token?: string }>({
      query: ({ reg_no, password, token }) => ({
        url: `update-password?reg_no=${encodeURIComponent(reg_no)}`,
        method: "PUT",
        body: { password },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    }),

    getUserByRegNo: builder.query<UserResponse, string>({
      query: (reg_no) => ({
        url: `user/by-reg-no?reg_no=${encodeURIComponent(reg_no)}`,
        method: "GET",
      }),
      providesTags: ["User"],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useSetSecretCodeMutation,
  useCompleteProfileMutation,
  useUpdatePasswordMutation,
  useGetUserByRegNoQuery,
} = authApi;