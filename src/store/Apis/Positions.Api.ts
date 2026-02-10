import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -------------------- TYPES --------------------
export interface Position {
  id: string;
  election_id: string;
  name: string;
  description?: string;
  school?: string | null;
  tier: "university" | "school" | "department";
  coalition_id?: string | null;
}

export interface PositionsResponse {
  positions: Position[];
}

export interface PositionResponse {
  position: Position;
}

export interface MessageResponse {
  message: string;
  position?: Position;
}

// -------------------- API --------------------
export const positionApi = createApi({
  reducerPath: "positionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://online-voting-system-oq4p.onrender.com/api/positions",
    prepareHeaders: async (headers) => {
      const token = await AsyncStorage.getItem("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Positions"],
  endpoints: (builder) => ({
    // -------------------- GET ALL --------------------
    getAllPositions: builder.query<PositionsResponse, void>({
      query: () => "",
      providesTags: ["Positions"],
    }),

    // -------------------- GET BY ID --------------------
    getPositionById: builder.query<PositionResponse, string>({
      query: (id) => `by-id/${id}`,
      providesTags: ["Positions"],
    }),

    // -------------------- GET BY NAME --------------------
    getPositionsByName: builder.query<PositionsResponse, string>({
      query: (name) => `by-name?name=${encodeURIComponent(name)}`,
      providesTags: ["Positions"],
    }),

    // -------------------- GET BY SCHOOL --------------------
    getPositionsBySchool: builder.query<PositionsResponse, string>({
      query: (school) => `by-school?school=${encodeURIComponent(school)}`,
      providesTags: ["Positions"],
    }),

    // -------------------- GET BY TIER --------------------
    getPositionsByTier: builder.query<PositionsResponse, string>({
      query: (tier) => `by-tier?tier=${tier}`,
      providesTags: ["Positions"],
    }),

    // -------------------- GET BY ELECTION --------------------
    getPositionsByElection: builder.query<PositionsResponse, string>({
      query: (electionId) =>
        `by-election?election_id=${encodeURIComponent(electionId)}`,
      providesTags: ["Positions"],
    }),

    // -------------------- COUNT ALL --------------------
    countPositions: builder.query<{ count: number }, void>({
      query: () => "count",
      providesTags: ["Positions"],
    }),

    // -------------------- COUNT BY SCHOOL --------------------
    countPositionsBySchool: builder.query<{ count: number }, string>({
      query: (school) =>
        `count-by-school?school=${encodeURIComponent(school)}`,
      providesTags: ["Positions"],
    }),

    // -------------------- CREATE --------------------
    createPosition: builder.mutation<MessageResponse, Partial<Position>>({
      query: (body) => ({
        url: "create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Positions"],
    }),

    // -------------------- UPDATE --------------------
    updatePosition: builder.mutation<
      MessageResponse,
      { id: string; body: Partial<Position> }
    >({
      query: ({ id, body }) => ({
        url: `update/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Positions"],
    }),

    // -------------------- DELETE --------------------
    deletePosition: builder.mutation<MessageResponse, string>({
      query: (id) => ({
        url: `delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Positions"],
    }),
  }),
});

// -------------------- HOOKS --------------------
export const {
  useGetAllPositionsQuery,
  useGetPositionByIdQuery,
  useGetPositionsByNameQuery,
  useGetPositionsBySchoolQuery,
  useGetPositionsByTierQuery,
  useGetPositionsByElectionQuery,
  useCountPositionsQuery,
  useCountPositionsBySchoolQuery,
  useCreatePositionMutation,
  useUpdatePositionMutation,
  useDeletePositionMutation,
} = positionApi;
