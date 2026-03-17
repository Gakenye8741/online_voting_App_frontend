import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Notification {
  id: string;
  _id?: string; 
  title: string;
  message: string;
  is_read: boolean;
  createdAt: string;
  user_id: string;
  election_id?: string | null;
  type?: "SYSTEM" | "REMINDER" | "ELECTION";
}

interface NotificationsResponse {
  notifications: Notification[];
  success?: boolean;
}

const baseQuery = fetchBaseQuery({
  baseUrl: "https://online-voting-system-oq4p.onrender.com/api/notifications",
  prepareHeaders: async (headers) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    } catch (error) {
      console.error("Error fetching token", error);
    }
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

export const notificationApi = createApi({
  reducerPath: "notificationApi",
  baseQuery,
  tagTypes: ["Notifications"],
  endpoints: (builder) => ({
    
    // ==========================================
    // USER ACTIONS
    // ==========================================

    /**
     * REGISTER PUSH TOKEN
     * PATCH /api/notifications/register-token
     */
    registerPushToken: builder.mutation<{ message: string }, { userId: string; pushToken: string }>({
      query: (body) => ({
        url: "/register-token",
        method: "PATCH",
        body,
      }),
    }),

    // GET /api/notifications/user/:userId
    getUserNotifications: builder.query<Notification[], string>({
      query: (userId) => `/user/${userId}`,
      transformResponse: (response: NotificationsResponse | Notification[]) => 
        Array.isArray(response) ? response : response.notifications || [],
      providesTags: ["Notifications"],
    }),

    // PUT /api/notifications/mark-read/:id
    markAsRead: builder.mutation<any, string>({
      query: (id) => ({
        url: `/mark-read/${id}`,
        method: "PUT",
      }),
      invalidatesTags: ["Notifications"],
    }),

    // PUT /api/notifications/mark-all-read/:userId
    markAllRead: builder.mutation<any, string>({
      query: (userId) => ({
        url: `/mark-all-read/${userId}`,
        method: "PUT",
      }),
      invalidatesTags: ["Notifications"],
    }),

    // ==========================================
    // ADMIN ACTIONS
    // ==========================================

    // GET /api/notifications/ (Admin)
    getAllNotifications: builder.query<Notification[], void>({
      query: () => "/",
      transformResponse: (response: NotificationsResponse | Notification[]) => 
        Array.isArray(response) ? response : response.notifications || [],
      providesTags: ["Notifications"],
    }),

    // POST /api/notifications/create
    createNotification: builder.mutation<any, Partial<Notification>>({
      query: (body) => ({
        url: "/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Notifications"],
    }),

    // POST /api/notifications/bulk
    sendBulkNotifications: builder.mutation<any, { userIds: string[]; payload: any }>({
      query: (body) => ({
        url: "/bulk",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Notifications"],
    }),

    // POST /api/notifications/broadcast
    broadcastNotification: builder.mutation<any, any>({
      query: (body) => ({
        url: "/broadcast",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Notifications"],
    }),

    // DELETE /api/notifications/delete/:id
    deleteNotification: builder.mutation<any, string>({
      query: (id) => ({
        url: `/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),

    // DELETE /api/notifications/delete-all/:userId
    deleteAllUserNotifications: builder.mutation<any, string>({
      query: (userId) => ({
        url: `/delete-all/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useRegisterPushTokenMutation, // Exported for device registration
  useGetAllNotificationsQuery,
  useGetUserNotificationsQuery,
  useCreateNotificationMutation,
  useSendBulkNotificationsMutation,
  useBroadcastNotificationMutation,
  useMarkAsReadMutation,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllUserNotificationsMutation,
} = notificationApi;