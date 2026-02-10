import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -------------------- TYPES --------------------
export interface Notification {
  id: string;
  user_id?: string | null;
  title: string;
  message: string;
  type: "SYSTEM" | "ANNOUNCEMENT" | "ELECTION" | "REMINDER" | "ALERT";
  is_read: boolean;
  election_id?: string | null;
  candidate_id?: string | null;
  position_id?: string | null;
  sender_id?: string | null;
  created_at?: string;
}

export interface CreateNotificationPayload {
  user_id?: string;
  title: string;
  message: string;
  type: "SYSTEM" | "ANNOUNCEMENT" | "ELECTION" | "REMINDER" | "ALERT";
  is_read?: boolean;
  election_id?: string;
  candidate_id?: string;
  position_id?: string;
}

export interface BulkNotificationPayload {
  userIds: string[];
  payload: Omit<CreateNotificationPayload, "user_id">;
}

// -------------------- API --------------------
export const notificationApi = createApi({
  reducerPath: "notificationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5000/api/notifications",
    prepareHeaders: async (headers) => {
      // Load token from AsyncStorage
      const token = await AsyncStorage.getItem("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Notification"],
  endpoints: (builder) => ({
    createNotification: builder.mutation<Notification, CreateNotificationPayload>({
      query: (payload) => ({
        url: "create",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Notification"],
    }),
    sendBulkNotifications: builder.mutation<{ count: number }, BulkNotificationPayload>({
      query: (payload) => ({
        url: "bulk",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Notification"],
    }),
    sendNotificationToAll: builder.mutation<{ count: number }, Omit<CreateNotificationPayload, "user_id">>({
      query: (payload) => ({
        url: "broadcast",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Notification"],
    }),
    getAllNotifications: builder.query<Notification[], void>({
      query: () => ({
        url: "",
        method: "GET",
      }),
      transformResponse: (response: { notifications: Notification[] }) => response.notifications,
      providesTags: ["Notification"],
    }),
    getNotificationsForUser: builder.query<Notification[], void>({
      query: async () => {
        const userId = await AsyncStorage.getItem("userId");
        return {
          url: `user/${userId}`,
          method: "GET",
        };
      },
      transformResponse: (response: { notifications: Notification[] }) => response.notifications,
      providesTags: ["Notification"],
    }),
    markNotificationAsRead: builder.mutation<{ message: string }, { id: string }>({
      query: ({ id }) => ({
        url: `mark-read/${id}`,
        method: "PUT",
      }),
      invalidatesTags: ["Notification"],
    }),
    markAllNotificationsAsRead: builder.mutation<{ message: string }, void>({
      query: async () => {
        const userId = await AsyncStorage.getItem("userId");
        return {
          url: `mark-all-read/${userId}`,
          method: "PUT",
        };
      },
      invalidatesTags: ["Notification"],
    }),
    deleteNotification: builder.mutation<{ message: string }, { id: string }>({
      query: ({ id }) => ({
        url: `delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notification"],
    }),
    deleteAllNotificationsForUser: builder.mutation<{ message: string }, void>({
      query: async () => {
        const userId = await AsyncStorage.getItem("userId");
        return {
          url: `delete-all/${userId}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["Notification"],
    }),
  }),
});

// -------------------- HOOKS --------------------
export const {
  useCreateNotificationMutation,
  useSendBulkNotificationsMutation,
  useSendNotificationToAllMutation,
  useGetAllNotificationsQuery,
  useGetNotificationsForUserQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsForUserMutation,
} = notificationApi;
