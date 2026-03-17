import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -------------------- TYPES --------------------
export interface VoteRequest {
  election_id: string;
  candidate_id: string;
  position_id: string;
}

export interface VoteRecord {
  id: string;
  voter_id: string;
  candidate_id: string;
  position_id: string;
  election_id: string;
  transaction_hash?: string; // Anchored to Sepolia Blockchain
  createdAt: string;
}

export interface VoteResponse {
  message: string;
  vote: VoteRecord;
}

export interface BulkVoteResponse {
  message: string;
  votes: VoteRecord[];
}

export interface ElectionResult {
  candidate_id: string;
  candidate_name: string | null;
  position_id: string;
  votes_count: number | string; // SQL counts often return as strings
}

// -------------------- API --------------------
export const votesApi = createApi({
  reducerPath: "votesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://online-voting-system-oq4p.onrender.com/api/votes",
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
  tagTypes: ["Votes", "Results", "MyHistory"],
  endpoints: (builder) => ({
    
    // 1. Cast a Single Vote
    castVote: builder.mutation<VoteResponse, VoteRequest>({
      query: (voteData) => ({
        url: "/cast",
        method: "POST",
        body: voteData,
      }),
      // Invalidate results and history to trigger UI refresh
      invalidatesTags: ["Results", "MyHistory"],
    }),

    // 2. Cast Bulk Votes (POST /api/votes/cast-bulk)
    castBulkVotes: builder.mutation<BulkVoteResponse, { votesList: VoteRequest[] }>({
      query: (body) => ({
        url: "/cast-bulk",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Results", "MyHistory"],
    }),

    // 3. Get My Voting History (GET /api/votes/my-votes/:election_id)
    // Updated to match your backend response: { data: { votes: [], totalCast: "1" } }
    getMyVotes: builder.query<{ data: { votes: VoteRecord[], totalCast: string } }, string>({
      query: (electionId) => ({
        url: `/my-votes/${electionId}`,
        method: "GET",
      }),
      providesTags: ["MyHistory"],
    }),

    // 4. Get Live Election Results (GET /api/votes/results/:election_id)
    getElectionResults: builder.query<{ data: ElectionResult[] }, string>({
      query: (electionId) => ({
        url: `/results/${electionId}`,
        method: "GET",
      }),
      providesTags: ["Results"],
    }),

    // 5. Admin: Candidate Audit
    getCandidateAudit: builder.query<{ data: VoteRecord[] }, string>({
      query: (candidateId) => ({
        url: `/audit/candidate/${candidateId}`,
        method: "GET",
      }),
      providesTags: ["Votes"],
    }),

    // 6. Admin: Election Audit
    getElectionAudit: builder.query<{ data: VoteRecord[] }, string>({
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
  useCastBulkVotesMutation,
  useGetMyVotesQuery,
  useGetElectionResultsQuery,
  useGetCandidateAuditQuery,
  useGetElectionAuditQuery,
} = votesApi;