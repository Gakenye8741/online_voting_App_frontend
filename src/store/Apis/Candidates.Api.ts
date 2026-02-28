import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -------------------- TYPES --------------------
export interface Candidate {
  id: string;
  user_id: string;
  student_id: string; 
  name: string;
  manifesto: string;
  position_id: string;
  school: string;
  coalition_id?: string | null;
  photo_url?: string;
  bio?: string;
  election_id?: string;
}

export interface CandidatesResponse {
  candidates: Candidate[];
}

export interface CandidateResponse {
  message?: string;
  candidate: Candidate;
}

export interface CountResponse {
  count: number;
}

export interface MessageResponse {
  message: string;
  candidate?: Candidate;
}

// -------------------- API --------------------
export const candidatesApi = createApi({
  reducerPath: "candidatesApi",
  baseQuery: fetchBaseQuery({
    // Standardized: No trailing slash
    baseUrl: "https://online-voting-system-oq4p.onrender.com/api/candidates",
    prepareHeaders: async (headers) => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Candidates"],
  endpoints: (builder) => ({
    // -------------------- 1️⃣ PUBLIC ROUTES --------------------
    
    getAllCandidates: builder.query<CandidatesResponse, void>({
      query: () => "/", 
      providesTags: ["Candidates"],
    }),

    getCandidateById: builder.query<CandidateResponse, string>({
      // REMOVED leading slash to ensure it appends to baseUrl correctly
      query: (id) => `by-id/${id}`,
      providesTags: ["Candidates"],
    }),
    
    getCandidateByUserId: builder.query<CandidateResponse, string>({
      // Match exactly with your Express route: /by-user/:userId
      query: (userId) => `by-user/${userId}`,
      providesTags: ["Candidates"],
    }),

    getCandidatesByName: builder.query<CandidatesResponse, string>({
      query: (name) => `by-name?name=${encodeURIComponent(name)}`,
      providesTags: ["Candidates"],
    }),

    getCandidatesBySchool: builder.query<CandidatesResponse, string>({
      query: (school) => `by-school?school=${encodeURIComponent(school)}`,
      providesTags: ["Candidates"],
    }),

    getCandidatesByPosition: builder.query<CandidatesResponse, string>({
      query: (position_id) => `by-position?position_id=${encodeURIComponent(position_id)}`,
      providesTags: ["Candidates"],
    }),

    getCandidatesByCoalition: builder.query<CandidatesResponse, string>({
      query: (coalition_id) => `by-coalition?coalition_id=${encodeURIComponent(coalition_id)}`,
      providesTags: ["Candidates"],
    }),

    getCandidatesByElection: builder.query<CandidatesResponse, string>({
      query: (electionId) => `by-election/${encodeURIComponent(electionId)}`,
      providesTags: ["Candidates"],
    }),

    // -------------------- 2️⃣ COUNTS (Admin Only) --------------------
    
    getCandidatesCount: builder.query<CountResponse, void>({
      query: () => "count",
      providesTags: ["Candidates"],
    }),

    getCandidatesCountBySchool: builder.query<CountResponse, string>({
      query: (school) => `count-by-school?school=${encodeURIComponent(school)}`,
      providesTags: ["Candidates"],
    }),

    // -------------------- 3️⃣ ADMIN/CRUD MUTATIONS --------------------
    
    createCandidate: builder.mutation<MessageResponse, Partial<Candidate>>({
      query: (body) => ({
        url: "create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Candidates"],
    }),

    updateCandidate: builder.mutation<MessageResponse, { id: string; body: Partial<Candidate> }>({
      query: ({ id, body }) => ({
        url: `update/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Candidates"],
    }),

    deleteCandidate: builder.mutation<MessageResponse, string>({
      query: (id) => ({
        url: `delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Candidates"],
    }),

    disqualifyCandidate: builder.mutation<MessageResponse, string>({
      query: (id) => ({
        url: `disqualify/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Candidates"],
    }),
  }),
});

export const {
  useGetAllCandidatesQuery,
  useGetCandidateByIdQuery,
  useGetCandidateByUserIdQuery,
  useGetCandidatesByNameQuery,
  useGetCandidatesBySchoolQuery,
  useGetCandidatesByPositionQuery,
  useGetCandidatesByCoalitionQuery,
  useGetCandidatesByElectionQuery,
  useGetCandidatesCountQuery,
  useGetCandidatesCountBySchoolQuery,
  useCreateCandidateMutation,
  useUpdateCandidateMutation,
  useDeleteCandidateMutation,
  useDisqualifyCandidateMutation,
} = candidatesApi;