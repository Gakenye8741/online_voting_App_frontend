import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -------------------- TYPES --------------------
export interface CandidateApplication {
  id: string;
  student_id: string;
  position_id: string;
  position_name?: string;
  election_id: string;
  election_name?: string;
  manifesto: string;
  photo_url: string; // Single string URL
  school: string;
  school_dean_status?: "PENDING" | "APPROVED" | "REJECTED";
  accounts_status?: "PENDING" | "APPROVED" | "REJECTED";
  dean_of_students_status?: "PENDING" | "APPROVED" | "REJECTED";
  overall_status?: "PENDING" | "APPROVED" | "REJECTED";
  school_dean_comment?: string;
  accounts_comment?: string;
  dean_of_students_comment?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApplicationsResponse {
  candidates: CandidateApplication[];
}

export interface ApplicationResponse {
  candidate: CandidateApplication;
}

export interface MessageResponse {
  message: string;
  candidate?: CandidateApplication;
}

// -------------------- API --------------------
export const applicationApi = createApi({
  reducerPath: "applicationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://online-voting-system-oq4p.onrender.com/api/candidate-applications",
    prepareHeaders: async (headers) => {
      let token = await AsyncStorage.getItem("token");

      // fallback to nested token
      if (!token) {
        const userStr = await AsyncStorage.getItem("user");
        if (userStr) {
          const userData = JSON.parse(userStr);
          token = userData.token || userData.accessToken;
        }
      }

      if (token) {
        headers.set("Authorization", `Bearer ${token.replace(/"/g, "")}`);
      }

      return headers;
    },
  }),
  tagTypes: ["Applications"],
  endpoints: (builder) => ({
    // -------------------- PUBLIC / STUDENT --------------------
    getAllApplications: builder.query<ApplicationsResponse, void>({
      query: () => "/",
      providesTags: ["Applications"],
    }),
    getApplicationById: builder.query<ApplicationResponse, string>({
      query: (id) => `/${id}`,
      providesTags: ["Applications"],
    }),
    getApplicationsByStudent: builder.query<ApplicationsResponse, void>({
      query: () => "student/me",
      providesTags: ["Applications"],
    }),

    // -------------------- APPROVER / ADMIN --------------------
    getPendingApplicationsForApprover: builder.query<ApplicationsResponse, string>({
      query: (role) => `pending/approver?role=${encodeURIComponent(role)}`,
      providesTags: ["Applications"],
    }),

    // -------------------- MUTATIONS --------------------
    createApplication: builder.mutation<MessageResponse, Partial<CandidateApplication>>({
      query: (body) => ({
        url: "/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Applications"],
    }),
    updateApplicationStatus: builder.mutation<
      MessageResponse,
      { id: string; body: Partial<CandidateApplication> }
    >({
      query: ({ id, body }) => ({
        url: `/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Applications"],
    }),
    deleteApplication: builder.mutation<MessageResponse, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Applications"],
    }),
  }),
});

// -------------------- HOOKS --------------------
export const {
  useGetAllApplicationsQuery,
  useGetApplicationByIdQuery,
  useGetApplicationsByStudentQuery,
  useGetPendingApplicationsForApproverQuery,
  useCreateApplicationMutation,
  useUpdateApplicationStatusMutation,
  useDeleteApplicationMutation,
} = applicationApi;