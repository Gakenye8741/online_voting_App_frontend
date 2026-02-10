import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -------------------- TYPES --------------------
export interface User {
  id: string;
  name: string;
  reg_no: string;
  email?: string;
  school?: string;
  expected_graduation?: string;
  role: "voter" | "admin" | "student";
}

export interface UpdateUserRequest {
  id: string;
  name?: string;
  school?: string;
  expected_graduation?: string;
  email?: string;
}

export interface UsersListResponse {
  users: User[];
}

export interface SingleUserResponse {
  user: User;
}

// -------------------- API --------------------
export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://online-voting-system-oq4p.onrender.com/api/users/",
    prepareHeaders: async (headers, { getState }) => {
      let token = (getState() as any).auth.token;

      // fallback to AsyncStorage after reloads
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
  tagTypes: ["Users"],

  endpoints: (builder) => ({
    getAllUsers: builder.query<UsersListResponse, void>({
      query: () => ({
        url: "",
        method: "GET",
      }),
      providesTags: ["Users"],
    }),

    getUserById: builder.query<SingleUserResponse, string>({
      query: (id) => ({
        url: `by-id/${id}`,
        method: "GET",
      }),
      providesTags: (_r, _e, id) => [{ type: "Users", id }],
    }),

    getUserByRegNo: builder.query<SingleUserResponse, string>({
      query: (reg_no) => ({
        url: `by-reg-no?reg_no=${encodeURIComponent(reg_no)}`,
        method: "GET",
      }),
    }),

    getUserByLastName: builder.query<UsersListResponse, string>({
      query: (lastName) => ({
        url: `by-last-name?lastName=${encodeURIComponent(lastName)}`,
        method: "GET",
      }),
    }),

    getUserByEmail: builder.query<SingleUserResponse, string>({
      query: (email) => ({
        url: `by-email?email=${encodeURIComponent(email)}`,
        method: "GET",
      }),
    }),

    getUsersBySchool: builder.query<UsersListResponse, string>({
      query: (school) => ({
        url: `by-school?school=${encodeURIComponent(school)}`,
        method: "GET",
      }),
    }),

    getUsersCount: builder.query<{ count: number }, void>({
      query: () => ({
        url: `count`,
        method: "GET",
      }),
    }),

    getUsersCountBySchool: builder.query<{ count: number }, string>({
      query: (school) => ({
        url: `count-by-school?school=${encodeURIComponent(school)}`,
        method: "GET",
      }),
    }),

    updateUser: builder.mutation<
      SingleUserResponse,
      UpdateUserRequest
    >({
      query: ({ id, ...data }) => ({
        url: `update/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Users", id }],
    }),

    deleteUser: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),
  }),
});

// -------------------- HOOKS --------------------
export const {
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useGetUserByRegNoQuery,
  useGetUserByLastNameQuery,
  useGetUserByEmailQuery,
  useGetUsersBySchoolQuery,
  useGetUsersCountQuery,
  useGetUsersCountBySchoolQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi;
