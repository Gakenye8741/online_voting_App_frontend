import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -------------------- TYPES --------------------
export type AppealStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Appeal {
  id: string;
  application_id: string;
  rejected_stage: string;
  reason: string;
  supporting_document_url?: string;
  status: AppealStatus;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAppealRequest {
  application_id: string;
  rejected_stage: string;
  reason: string;
  supporting_document_url?: string;
}

export interface ResolveAppealRequest {
  id: string;
  status: "APPROVED" | "REJECTED";
  comment: string;
}

export interface AppealsListResponse {
  appeals: Appeal[];
}

export interface SingleAppealResponse {
  appeal: Appeal;
}

// -------------------- API --------------------
export const appealsApi = createApi({
  reducerPath: "appealsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://laikipiavotingsystem-f3aabefwhrendaae.southafricanorth-01.azurewebsites.net/api/appeals/",
    prepareHeaders: async (headers, { getState }) => {
      let token = (getState() as any).auth.token;

      // fallback to AsyncStorage after reloads
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
  tagTypes: ["Appeals"],

  endpoints: (builder) => ({
    // 1. Submit a new appeal
    submitAppeal: builder.mutation<SingleAppealResponse, CreateAppealRequest>({
      query: (body) => ({
        url: "",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Appeals"],
    }),

    // 2. Get pending appeals by role (e.g., ACCOUNTS or DEAN_OF_STUDENTS)
    getPendingAppealsByRole: builder.query<AppealsListResponse, { role: string; history?: boolean }>({
      query: ({ role, history = false }) => ({
        url: `pending/role?role=${role}${history ? "&history=true" : ""}`,
        method: "GET",
      }),
      providesTags: ["Appeals"],
    }),

    // 4. Get all appeals (Admin overview)
    getAllAppeals: builder.query<AppealsListResponse, void>({
      query: () => ({
        url: "",
        method: "GET",
      }),
      providesTags: ["Appeals"],
    }),

    // 5. Get specific appeal by ID
    getAppealById: builder.query<SingleAppealResponse, string>({
      query: (id) => ({
        url: `${id}`,
        method: "GET",
      }),
      providesTags: (_r, _e, id) => [{ type: "Appeals", id }],
    }),

    // 6 & 7. Resolve appeal (Approve or Reject)
    resolveAppeal: builder.mutation<SingleAppealResponse, ResolveAppealRequest>({
      query: ({ id, ...body }) => ({
        url: `${id}/resolve`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => ["Appeals", { type: "Appeals", id }],
    }),

    // 8. Delete appeal (Admin only)
    deleteAppeal: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Appeals"],
    }),
  }),
});

// -------------------- HOOKS --------------------
export const {
  useSubmitAppealMutation,
  useGetPendingAppealsByRoleQuery,
  useGetAllAppealsQuery,
  useGetAppealByIdQuery,
  useResolveAppealMutation,
  useDeleteAppealMutation,
} = appealsApi;