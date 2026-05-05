import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -------------------- TYPES --------------------
export interface VoteRequest {
  election_id: string;
  candidate_id: string;
  position_id: string;
}

export interface SingleVotePayload extends VoteRequest {
  secret_code: string;
}

export interface VoteRecord {
  id: string;
  voter_id: string;
  candidate_id: string;
  position_id: string;
  election_id: string;
  transaction_hash?: string; 
  createdAt: string;
}

export interface DisputeParams {
  regNo: string;
  electionId: string;
  positionId: string;
}

// -------------------- API --------------------
export const votesApi = createApi({
  reducerPath: "votesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://laikipiavotingsystem-f3aabefwhrendaae.southafricanorth-01.azurewebsites.net/api",
    timeout: 60000, // Blockchain anchoring is slow, so we keep this high
    prepareHeaders: async (headers, { getState }) => {
      const state = getState() as any;
      let token = state.auth?.token;

      if (!token) {
        token = await AsyncStorage.getItem("token");
      }

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      headers.set("Accept", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Votes", "Results", "MyHistory"],
  endpoints: (builder) => ({
    // 1. Cast a Single Vote (voterAuth)
    castVote: builder.mutation<{message: string, vote: VoteRecord}, SingleVotePayload>({
      query: (body) => ({ 
        url: "/votes/cast", 
        method: "POST", 
        body 
      }),
      extraOptions: { maxRetries: 0 },
      invalidatesTags: ["Results", "MyHistory", "Votes"],
    }),

    // 2. Get My Voting History (voterAuth)
    // UPDATED: Path changed from /my-votes/ to /my-ballot/ to match Express Router
    getMyVotes: builder.query<{ data: { votes: VoteRecord[], totalCast: number } }, string>({
      query: (electionId) => `/votes/my-ballot/${electionId}`,
      providesTags: ["MyHistory"],
      keepUnusedDataFor: 0, 
    }),

    // 3. Get Live Election Results (Hybrid)
    getElectionResults: builder.query<{ data: any[] }, string>({
      query: (electionId) => `/votes/results/${electionId}`,
      providesTags: ["Results"],
    }),

    // 4. Admin: Dispute Verification (adminAuth)
    // NEW: Handles query parameters for dispute resolution
    verifyDispute: builder.query<{ success: boolean; data: any }, DisputeParams>({
      query: ({ regNo, electionId, positionId }) => 
        `/votes/verify-dispute?regNo=${regNo}&electionId=${electionId}&positionId=${positionId}`,
    }),

    // 5. Admin: Candidate Audit (adminAuth)
    getCandidateAudit: builder.query<{ data: VoteRecord[] }, string>({
      query: (candidateId) => `/votes/audit/candidate/${candidateId}`,
      providesTags: ["Votes"],
    }),

    // 6. Admin: Election Audit (adminAndDeanAuth)
    getElectionAudit: builder.query<{ data: VoteRecord[] }, string>({
      query: (electionId) => `/votes/audit/election/${electionId}`,
      providesTags: ["Votes"],
    }),
  }),
});

export const {
  useCastVoteMutation,
  useGetMyVotesQuery,
  useGetElectionResultsQuery,
  useVerifyDisputeQuery, // New hook for the dispute route
  useGetCandidateAuditQuery,
  useGetElectionAuditQuery,
} = votesApi;