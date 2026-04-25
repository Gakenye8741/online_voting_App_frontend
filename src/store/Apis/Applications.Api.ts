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
  photo_url: string; 
  documents_url?: string | null;
  school: string;
  school_dean_id?: string;
  accounts_officer_id?: string;
  dean_of_students_id?: string;
  school_dean_status?: "PENDING" | "APPROVED" | "REJECTED";
  accounts_status?: "PENDING" | "APPROVED" | "REJECTED";
  dean_of_students_status?: "PENDING" | "APPROVED" | "REJECTED";
  overall_status?: "PENDING" | "APPROVED" | "REJECTED";
  school_dean_comment?: string | null;
  accounts_comment?: string | null;
  dean_of_students_comment?: string | null;
  created_at?: string;
  updated_at?: string;
  coalition_id?: string;
  coalition_name?: string;
}

export interface MessageResponse {
  message: string;
  candidate?: CandidateApplication;
}

// -------------------- API --------------------
export const applicationApi = createApi({
  reducerPath: "applicationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://laikipiavotingsystem-f3aabefwhrendaae.southafricanorth-01.azurewebsites.net/api/candidate-applications/",
    prepareHeaders: async (headers) => {
      let token = await AsyncStorage.getItem("token");
      if (!token) {
        const userStr = await AsyncStorage.getItem("user");
        if (userStr) {
          const userData = JSON.parse(userStr);
          token = userData.token || userData.accessToken;
        }
      }
      if (token) {
        const cleanToken = token.replace(/[\\"]/g, "");
        headers.set("Authorization", `Bearer ${cleanToken}`);
      }
      headers.set("Accept", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Applications"],
  endpoints: (builder) => ({
    // -------------------- PUBLIC / STUDENT --------------------
    getAllApplications: builder.query<CandidateApplication[], void>({
      query: () => "", 
      providesTags: ["Applications"],
    }),
    
    getApplicationById: builder.query<CandidateApplication, string>({
      query: (id) => `${id}`,
      providesTags: ["Applications"],
    }),

    /**
     * UPDATED: getApplicationsByStudent
     * Handles object, array, or wrapped responses to ensure UI gets one object.
     */
    getApplicationsByStudent: builder.query<CandidateApplication, void>({
      query: () => "student/me",
      transformResponse: (response: any) => {
        // If response is an array, take first item
        if (Array.isArray(response)) return response[0];
        // If response is wrapped in { candidate: ... }
        if (response && response.candidate) return response.candidate;
        // Otherwise return as direct object
        return response;
      },
      providesTags: ["Applications"],
    }),

    // -------------------- APPROVER / ADMIN --------------------
    getPendingApplicationsForApprover: builder.query<CandidateApplication[], string>({
      query: (role) => `pending/approver?role=${encodeURIComponent(role)}`,
      providesTags: ["Applications"],
    }),

    // -------------------- MUTATIONS --------------------
    createApplication: builder.mutation<MessageResponse, Partial<CandidateApplication>>({
      query: (body) => ({
        url: "",
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
        url: `${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Applications"],
    }),

    deleteApplication: builder.mutation<MessageResponse, string>({
      query: (id) => ({
        url: `${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Applications"],
    }),
  }),
});

export const {
  useGetAllApplicationsQuery,
  useGetApplicationByIdQuery,
  useGetApplicationsByStudentQuery,
  useGetPendingApplicationsForApproverQuery,
  useCreateApplicationMutation,
  useUpdateApplicationStatusMutation,
  useDeleteApplicationMutation,
} = applicationApi;