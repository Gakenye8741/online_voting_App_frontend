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

// -------------------- API --------------------
export const votesApi = createApi({
  reducerPath: "votesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://laikipiavotingsystem-f3aabefwhrendaae.southafricanorth-01.azurewebsites.net/api",
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
    // 1. Cast a Single Vote (Alphanumeric Secret Code Support)
    castVote: builder.mutation<{message: string, vote: VoteRecord}, SingleVotePayload>({
      query: (body) => ({ url: "/votes/cast", method: "POST", body }),
      invalidatesTags: ["Results", "MyHistory", "Votes"],
    }),



    // 3. Get My Voting History
    getMyVotes: builder.query<{ data: { votes: VoteRecord[], totalCast: number } }, string>({
      query: (electionId) => `/votes/my-votes/${electionId}`,
      providesTags: ["MyHistory"],
    }),

    // 4. Get Live Election Results
    getElectionResults: builder.query<{ data: any[] }, string>({
      query: (electionId) => `/votes/results/${electionId}`,
      providesTags: ["Results"],
    }),

    // 5. Admin: Candidate Audit
    getCandidateAudit: builder.query<{ data: VoteRecord[] }, string>({
      query: (candidateId) => `/votes/audit/candidate/${candidateId}`,
      providesTags: ["Votes"],
    }),

    // 6. Admin: Election Audit
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
  useGetCandidateAuditQuery,
  useGetElectionAuditQuery,
} = votesApi;