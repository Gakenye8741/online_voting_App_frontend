import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -------------------- TYPES --------------------
export interface Coalition {
  id: string;
  election_id: string;
  name: string;
  acronym?: string;
  slogan?: string;
  logo_url?: string;
  color_code?: string;
  description?: string;
  created_at?: string;
}

export interface Candidate {
  id: string;
  name: string;
  position: {
    id: string;
    name: string;
  };
  photo_url?: string;
}

export interface CoalitionSlateResponse {
  coalition: Coalition & {
    candidates: Candidate[];
  };
}

export interface CoalitionsResponse {
  coalitions: Coalition[];
}

export interface CreateCoalitionRequest {
  creatorCandidateId: string;
  coalition: Partial<Coalition>;
}

export interface JoinCoalitionRequest {
  candidate_id: string;
  coalition_id: string;
}

export interface MessageResponse {
  message: string;
  coalition?: Coalition;
}

// -------------------- API --------------------
export const coalitionApi = createApi({
  reducerPath: "coalitionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://online-voting-system-oq4p.onrender.com/api/coalitions",
    prepareHeaders: async (headers) => {
      const token = await AsyncStorage.getItem("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Coalitions", "Slate"],
  endpoints: (builder) => ({
    
    // 1. CREATE COALITION (President Only)
    createCoalition: builder.mutation<MessageResponse, CreateCoalitionRequest>({
      query: (body) => ({
        url: "",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Coalitions"],
    }),

    // 2. JOIN COALITION
    joinCoalition: builder.mutation<MessageResponse, JoinCoalitionRequest>({
      query: (body) => ({
        url: "join",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Slate"],
    }),

    // 3. GET BY ELECTION
    getCoalitionsByElection: builder.query<CoalitionsResponse, string>({
      query: (electionId) => `election/${electionId}`,
      providesTags: ["Coalitions"],
    }),

    // 4. GET FULL SLATE (Members & Branding)
    getCoalitionFullSlate: builder.query<CoalitionSlateResponse, string>({
      query: (coalitionId) => `${coalitionId}/slate`,
      providesTags: ["Slate"],
    }),

    // 5. UPDATE BRANDING
    updateCoalition: builder.mutation<
      MessageResponse,
      { id: string; body: Partial<Coalition> }
    >({
      query: ({ id, body }) => ({
        url: `${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Coalitions", "Slate"],
    }),

    // 6. CANDIDATE LEAVES COALITION
    leaveCoalition: builder.mutation<MessageResponse, string>({
      query: (candidateId) => ({
        url: `leave/${candidateId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Slate"],
    }),

    // 7. DELETE COALITION (Admin Only)
    deleteCoalition: builder.mutation<MessageResponse, string>({
      query: (id) => ({
        url: `${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Coalitions"],
    }),
  }),
});

// -------------------- HOOKS --------------------
export const {
  useCreateCoalitionMutation,
  useJoinCoalitionMutation,
  useGetCoalitionsByElectionQuery,
  useGetCoalitionFullSlateQuery,
  useUpdateCoalitionMutation,
  useLeaveCoalitionMutation,
  useDeleteCoalitionMutation,
} = coalitionApi;