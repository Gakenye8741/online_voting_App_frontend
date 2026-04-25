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
  school: "Science" | "Education" | "Business" | "Humanities and Developmental_Studies" | "TVET";
  expected_graduation: string;
  email: string;
}

export interface RequestOtpRequest {
  reg_no: string;
  reason: "password_reset" | "reset_code"; 
}

export interface VerifyOtpPasswordRequest {
  reg_no: string;
  otp: string;
  new_password: string;
}

export interface VerifyOtpSecretCodeRequest {
  reg_no: string;
  otp: string;
  new_secret_code: string;
}

export interface SetSecretCodeRequest {
  secret_code: string;
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

// -------------------- API SLICE --------------------
export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://laikipiavotingsystem-f3aabefwhrendaae.southafricanorth-01.azurewebsites.net/api/auth/",
    prepareHeaders: async (headers, { getState }) => {
      // 1. Try Redux State first
      let token = (getState() as any).auth?.token;

      // 2. Fallback to AsyncStorage 
      // CRITICAL: In Production builds, the Redux state is sometimes cleared on reload,
      // so we MUST check AsyncStorage reliably.
      if (!token) {
        try {
          token = await AsyncStorage.getItem("token");
        } catch (e) {
          console.error("AsyncStorage Error", e);
        }
      }

      if (token) {
        // Ensure the token string doesn't have extra quotes from JSON.stringify
        const cleanToken = token.replace(/"/g, "");
        headers.set("Authorization", `Bearer ${cleanToken}`);
      }
      
      headers.set("Accept", "application/json");
      headers.set("Content-Type", "application/json");
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

    requestOtp: builder.mutation<AuthResponse, RequestOtpRequest>({
      query: (payload) => ({
        url: "request-otp",
        method: "POST",
        body: payload,
      }),
    }),

    verifyResetPassword: builder.mutation<AuthResponse, VerifyOtpPasswordRequest>({
      query: (payload) => ({
        url: "verify-reset-password",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["User"],
    }),

    verifyResetSecretCode: builder.mutation<AuthResponse, VerifyOtpSecretCodeRequest>({
      query: (payload) => ({
        url: "verify-reset-secret-code",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["User"],
    }),

    // --- PROTECTED ACTIONS ---
    completeProfile: builder.mutation<AuthResponse, CompleteProfileRequest>({
      query: (profileData) => ({
        url: "complete-profile",
        method: "PUT", // Ensure your backend Azure API allows PUT in production CORS
        body: profileData,
      }),
      invalidatesTags: ["User"],
    }),

    setSecretCode: builder.mutation<AuthResponse, SetSecretCodeRequest>({
      query: (payload) => ({
        url: "set-secret-code",
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["User"],
    }),

    updatePassword: builder.mutation<AuthResponse, { reg_no: string; password: string }>({
      query: ({ reg_no, password }) => ({
        url: `update-password?reg_no=${encodeURIComponent(reg_no)}`,
        method: "PUT",
        body: { password },
      }),
      invalidatesTags: ["User"],
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
  useRequestOtpMutation,
  useVerifyResetPasswordMutation,
  useVerifyResetSecretCodeMutation,
  useCompleteProfileMutation,
  useSetSecretCodeMutation,
  useUpdatePasswordMutation,
  useGetUserByRegNoQuery,
} = authApi;