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
}

interface NotificationsResponse {
  notifications: Notification[];
  success?: boolean;
}

const baseQuery = fetchBaseQuery({
  baseUrl: "https://online-voting-system-oq4p.onrender.com/api/notifications", // Pointing directly to the notification segment
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
    // GET /api/notifications (Admin)
    getAllNotifications: builder.query<Notification[], void>({
      query: () => "/",
      transformResponse: (response: NotificationsResponse | Notification[]) => 
        Array.isArray(response) ? response : response.notifications || [],
      providesTags: ["Notifications"],
    }),
    
    // GET /api/notifications/user/:userId (User)
    getUserNotifications: builder.query<Notification[], string>({
      query: (userId) => `/user/${userId}`,
      transformResponse: (response: NotificationsResponse | Notification[]) => 
        Array.isArray(response) ? response : response.notifications || [],
      providesTags: ["Notifications"],
    }),

    // POST /api/notifications/create (Admin)
    createNotification: builder.mutation<any, Partial<Notification>>({
      query: (body) => ({
        url: "/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Notifications"],
    }),

    // POST /api/notifications/bulk (Admin)
    sendBulkNotifications: builder.mutation<any, { userIds: string[]; payload: any }>({
      query: (body) => ({
        url: "/bulk",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Notifications"],
    }),

    // POST /api/notifications/broadcast (Admin)
    broadcastNotification: builder.mutation<any, any>({
      query: (body) => ({
        url: "/broadcast",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Notifications"],
    }),

    // PUT /api/notifications/mark-read/:id (User)
    markAsRead: builder.mutation<any, string>({
      query: (id) => ({
        url: `/mark-read/${id}`, // Updated to match back-end route :id
        method: "PUT",
      }),
      invalidatesTags: ["Notifications"],
    }),

    // PUT /api/notifications/mark-all-read/:userId (User)
    markAllRead: builder.mutation<any, string>({
      query: (userId) => ({
        url: `/mark-all-read/${userId}`,
        method: "PUT",
      }),
      invalidatesTags: ["Notifications"],
    }),

    // DELETE /api/notifications/delete/:id (Admin)
    deleteNotification: builder.mutation<any, string>({
      query: (id) => ({
        url: `/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),

    // DELETE /api/notifications/delete-all/:userId (Admin)
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