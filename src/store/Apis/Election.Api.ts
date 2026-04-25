import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -------------------- TYPES --------------------

export interface Candidate {
  id: string;
  name: string;
  photo_url?: string;
  bio?: string;
  vote_count?: number;
  user?: any; // To hold student profile info
  votes?: any[]; // Array of vote records
}

export interface Position {
  id: string;
  name: string;
  tier: string;
  total_votes?: number;
  winner_name?: string; 
  candidates?: Candidate[];
}

export interface Coalition {
  id: string;
  name: string;
  candidates?: Candidate[];
}

export interface Election {
  id: string;            
  name: string;          
  start_date: string;    
  end_date: string;      
  status?: "upcoming" | "ongoing" | "finished";
  createdAt: string;     
  updatedAt: string;     
  created_by?: string;   
  delegate_end_date: string;
  delegate_start_date: string;
}

// New: Interface for the comprehensive results view
export interface ElectionResultsResponse {
  results: {
    id: string;
    name: string;
    positions: Position[];
    coalitions: Coalition[];
    delegates: any[];
    delegateVotes: any[];
    settings?: any;
  }
}

export interface ElectionResponse {
  message?: string;
  election?: Election;
  positions?: Position[]; 
}

export interface ElectionsResponse {
  elections: Election[];
}

// -------------------- API --------------------
export const electionsApi = createApi({
  reducerPath: "electionsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://laikipiavotingsystem-f3aabefwhrendaae.southafricanorth-01.azurewebsites.net/api/elections/",
    prepareHeaders: async (headers, { getState }) => {
      let token = (getState() as any).auth.token;
      
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

    // New: Fetch full results (Candidates, Votes, Delegates, Coalitions)
    getElectionResults: builder.query<ElectionResultsResponse, string>({
      query: (id) => ({
        url: `/${id}/results`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Elections", id }],
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
  useGetElectionResultsQuery, // Exported the new hook
} = electionsApi;