// src/store/Apis/elections.api.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -------------------- TYPES --------------------
export interface Election {
  id: string;            // Unique ID of election
  name: string;          // Election name
  start_date: string;    // Start date in ISO format
  end_date: string;      // End date in ISO format
  status?: "upcoming" | "ongoing" | "completed";
  createdAt: string;     // Timestamp when created
  updatedAt: string;     // Timestamp when updated
  created_by?: string;   // Optional: ID of the creator
}

export interface ElectionResponse {
  message?: string;
  election?: Election;
}

export interface ElectionsResponse {
  elections: Election[];
}

// -------------------- API --------------------
export const electionsApi = createApi({
  reducerPath: "electionsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://online-voting-system-oq4p.onrender.com/api/elections/",
    prepareHeaders: async (headers, { getState }) => {
      let token = (getState() as any).auth.token;
      if (!token) {
        token = await AsyncStorage.getItem("token");
      }
      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Elections"],
  endpoints: (builder) => ({
    // Admin only
    createElection: builder.mutation<ElectionResponse, Election>({
      query: (data) => ({
        url: "/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Elections"],
    }),
    updateElection: builder.mutation<ElectionResponse, { id: string; data: Election }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Elections"],
    }),
    deleteElection: builder.mutation<ElectionResponse, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Elections"],
    }),
    changeElectionStatus: builder.mutation<ElectionResponse, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Elections"],
    }),

    // Any authenticated user
    getAllElections: builder.query<ElectionsResponse, void>({
      query: () => ({
        url: "/",
        method: "GET",
      }),
      providesTags: ["Elections"],
    }),
    getElectionById: builder.query<ElectionResponse, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "GET",
      }),
      providesTags: ["Elections"],
    }),
    getElectionsByStatus: builder.query<ElectionsResponse, { status: string }>({
      query: ({ status }) => ({
        url: `/status/filter?status=${encodeURIComponent(status)}`,
        method: "GET",
      }),
      providesTags: ["Elections"],
    }),
  }),
});

// -------------------- HOOKS --------------------
export const {
  useCreateElectionMutation,
  useUpdateElectionMutation,
  useDeleteElectionMutation,
  useChangeElectionStatusMutation,
  useGetAllElectionsQuery,
  useGetElectionByIdQuery,
  useGetElectionsByStatusQuery,
} = electionsApi;
