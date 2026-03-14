import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -------------------- TYPES --------------------
export interface VoteRequest {
  election_id: string;
  candidate_id: string;
  position_id: string;
}

export interface VoteResponse {
  message: string;
  vote: {
    id: string;
    voter_id: string;
    candidate_id: string;
    position_id: string;
    election_id: string;
    transaction_hash?: string; // Anchored to Sepolia Blockchain
    createdAt: string;
  };
}

export interface ElectionResult {
  candidate_id: string;
  candidate_name: string;
  position_id: string;
  vote_count: number;
}

// -------------------- API --------------------
export const votesApi = createApi({
  reducerPath: "votesApi",
  baseQuery: fetchBaseQuery({
    // Base URL points to the votes endpoint group
    baseUrl: "https://online-voting-system-oq4p.onrender.com/api/votes",
    prepareHeaders: async (headers, { getState }) => {
      // 1. Try to get token from Redux state
      let token = (getState() as any).auth.token;

      // 2. Fallback to AsyncStorage if Redux state is not yet hydrated
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
  tagTypes: ["Votes", "Results"],
  endpoints: (builder) => ({
    
    // 1. Cast a Vote (POST /api/votes/cast)
    // Handles Validation -> Blockchain Anchor -> Database
    castVote: builder.mutation<VoteResponse, VoteRequest>({
      query: (voteData) => ({
        url: "/cast",
        method: "POST",
        body: voteData,
      }),
      // Invalidate results so leaderboards refresh after a vote
      invalidatesTags: ["Results"],
    }),

    // 2. Get Live Election Results (GET /api/votes/results/:election_id)
    getElectionResults: builder.query<{ data: ElectionResult[] }, string>({
      query: (electionId) => ({
        url: `/results/${electionId}`,
        method: "GET",
      }),
      providesTags: ["Results"],
    }),

    // 3. Admin: Candidate Audit (GET /api/votes/audit/candidate/:candidate_id)
    getCandidateAudit: builder.query<{ data: any[] }, string>({
      query: (candidateId) => ({
        url: `/audit/candidate/${candidateId}`,
        method: "GET",
      }),
      providesTags: ["Votes"],
    }),

    // 4. Admin: Election Audit (GET /api/votes/audit/election/:election_id)
    getElectionAudit: builder.query<{ data: any[] }, string>({
      query: (electionId) => ({
        url: `/audit/election/${electionId}`,
        method: "GET",
      }),
      providesTags: ["Votes"],
    }),
  }),
});

// -------------------- HOOKS --------------------
export const {
  useCastVoteMutation,
  useGetElectionResultsQuery,
  useGetCandidateAuditQuery,
  useGetElectionAuditQuery,
} = votesApi;