import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -------------------- TYPES --------------------

export interface Candidate {
  id: string;
  name: string;
  photo_url?: string;
  bio?: string;
  vote_count?: number;
}

export interface Position {
  id: string;
  name: string;
  tier: string;
  total_votes?: number;
  winner_name?: string; // For archives/results
  candidates?: Candidate[];
}

export interface Election {
  id: string;            
  name: string;          
  start_date: string;    
  end_date: string;      
  status?: "upcoming" | "ongoing" | "completed";
  createdAt: string;     
  updatedAt: string;     
  created_by?: string;   
  delegate_end_date:string;
  delegate_start_date: string;
}

// Fixed: Added positions to the response type
export interface ElectionResponse {
  message?: string;
  election?: Election;
  positions?: Position[]; // Crucial for the Archives screen
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
      // Try to get token from Redux state first
      let token = (getState() as any).auth.token;
      
      // Fallback to AsyncStorage if state is cleared on refresh
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
  tagTypes: ["Elections"],
  endpoints: (builder) => ({
    // Admin only
    createElection: builder.mutation<ElectionResponse, Partial<Election>>({
      query: (data) => ({
        url: "/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Elections"],
    }),
    
    updateElection: builder.mutation<ElectionResponse, { id: string; data: Partial<Election> }>({
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
      providesTags: (result, error, id) => [{ type: "Elections", id }],
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