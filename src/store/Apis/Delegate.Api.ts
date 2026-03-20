import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -------------------- TYPES --------------------
export interface Delegate {
  delegate_id: string; // The UUID of the delegate slot
  name: string;
  reg_no: string;
  school: string;
  coalition_id: string | null;
}

export interface DelegateVoteRequest {
  delegate_id: string; // This should be the UUID from the roster
  election_id: string;
  coalition_id: string;
  position_id: string;
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

// New Type for checking vote status
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

export interface DelegateRosterResponse {
  delegates: Delegate[];
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
    baseUrl: "https://online-voting-system-oq4p.onrender.com/api/delegates",
    prepareHeaders: async (headers) => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
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
    // New endpoint to verify if the current user has already voted
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
      // Invalidate results and MyVote so the UI updates to show the Tx Hash
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
  useGetMyDelegateVoteQuery, // Exported hook
  useCastDelegateVoteMutation,
  useGetExecutiveResultsQuery,
} = delegatesApi;