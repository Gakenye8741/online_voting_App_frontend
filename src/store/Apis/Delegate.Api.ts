import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -------------------- TYPES --------------------
export interface Delegate {
  delegate_id: string; 
  name: string;
  reg_no: string;
  school: string;
  coalition_id: string | null;
}

// Fixed to match your JSON: { "count": 4, "data": [...] }
export interface DelegateRosterResponse {
  count: number;
  data: Delegate[];
}

/**
 * Updated to include secret_code for Phase 2 Blockchain signing
 */
export interface DelegateVoteRequest {
  delegate_id: string;
  election_id: string;
  coalition_id: string;
  position_id: string;
  secret_code: string; 
}

export interface DelegateVoteResponse {
  message: string;
  vote: {
    id: string;
    delegate_id: string; 
    election_id: string;
    coalition_id: string;
    position_id: string;
    transaction_hash: string; // Sepolia TX Hash
    created_at: string;
  };
}

export interface MyDelegateVoteResponse {
  voted: boolean;
  message?: string;
  vote?: {
    id: string;
    delegate_id: string;
    election_id: string;
    coalition_id: string;
    position_id: string;
    transaction_hash: string;
    created_at: string;
  };
}

export interface ExecutiveTally {
  coalitionId: string;
  voteCount: number;
}

export interface ExecutiveResultsResponse {
  results: ExecutiveTally[];
}

// -------------------- API --------------------
export const delegatesApi = createApi({
  reducerPath: "delegatesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://laikipiavotingsystem-f3aabefwhrendaae.southafricanorth-01.azurewebsites.net/api/delegates",
    prepareHeaders: async (headers) => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      headers.set("Accept", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Delegates", "Results", "MyVote"],
  endpoints: (builder) => ({
    // -------------------- 1. PROMOTE WINNERS (Admin) --------------------
    promoteWinners: builder.mutation<
      { message: string; count: number },
      { electionId: string; adminId: string }
    >({
      query: ({ electionId, adminId }) => ({
        url: `promote/${electionId}`,
        method: "POST",
        body: { election_id: electionId, user_id: adminId },
      }),
      invalidatesTags: ["Delegates"],
    }),

    // -------------------- 2. GET DELEGATE ROSTER --------------------
    getDelegateRoster: builder.query<DelegateRosterResponse, string>({
      query: (electionId) => `list/${electionId}`,
      providesTags: ["Delegates"],
    }),

    // -------------------- 3. CHECK MY VOTE STATUS --------------------
    getMyDelegateVote: builder.query<MyDelegateVoteResponse, string>({
      query: (electionId) => `my-vote/${electionId}`,
      providesTags: ["MyVote"],
    }),

    // -------------------- 4. CAST DELEGATE VOTE (Phase 2) --------------------
    castDelegateVote: builder.mutation<DelegateVoteResponse, DelegateVoteRequest>({
      query: (body) => ({
        url: "vote", 
        method: "POST",
        body,
      }),
      invalidatesTags: ["Results", "MyVote"],
    }),

    // -------------------- 5. GET EXECUTIVE RESULTS (Tally) --------------------
    getExecutiveResults: builder.query<ExecutiveResultsResponse, string>({
      query: (electionId) => `results/${electionId}`,
      providesTags: ["Results"],
    }),
  }),
});

// -------------------- HOOKS --------------------
export const {
  usePromoteWinnersMutation,
  useGetDelegateRosterQuery,
  useGetMyDelegateVoteQuery,
  useCastDelegateVoteMutation,
  useGetExecutiveResultsQuery,
} = delegatesApi;