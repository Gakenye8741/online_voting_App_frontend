import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -------------------- TYPES --------------------
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
  message?: string;
}

// -------------------- API --------------------
export const notificationApi = createApi({
  reducerPath: "notificationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://online-voting-system-oq4p.onrender.com/api/notifications",
    prepareHeaders: async (headers, { getState }) => {
      try {
        // 1. Priority: Get token from Redux state (Instant sync after login)
        let token = (getState() as any).auth?.token;

        // 2. Fallback: Get token from AsyncStorage (Persistence after app restart)
        if (!token) {
          token = await AsyncStorage.getItem("token");
        }

        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      } catch (error) {
        console.error("Notification Auth Header Error:", error);
      }
      headers.set("Content-Type", "application/json");
      headers.set("Accept", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Notifications"],
  endpoints: (builder) => ({
    
    // ==========================================
    // 📱 DEVICE & PUSH REGISTRATION
    // ==========================================

    registerPushToken: builder.mutation<{ message: string }, { userId: string; pushToken: string }>({
      query: (body) => ({
        url: "register-token", // Clean path (no leading slash)
        method: "PATCH",
        body,
      }),
    }),

    // ==========================================
    // 👤 USER ACTIONS (STUDENT APP)
    // ==========================================

    getUserNotifications: builder.query<Notification[], string>({
  query: (userId) => `user/${userId}`,
  transformResponse: (response: any) => {
    // If the backend sends { data: [...] } or { notifications: [...] }
    if (response?.notifications) return response.notifications;
    if (response?.data) return response.data;
    if (Array.isArray(response)) return response;
    return [];
  },
  providesTags: ["Notifications"],
}),

    markAsRead: builder.mutation<any, string>({
      query: (id) => ({
        url: `mark-read/${id}`,
        method: "PUT",
        body: { is_read: true }
      }),
      invalidatesTags: ["Notifications"],
    }),

    markAllRead: builder.mutation<any, string>({
      query: (userId) => ({
        url: `mark-all-read/${userId}`,
        method: "PUT",
      }),
      invalidatesTags: ["Notifications"],
    }),

    // ==========================================
    // 🛡️ ADMIN ACTIONS (DASHBOARD)
    // ==========================================

    getAllNotifications: builder.query<Notification[], void>({
      query: () => "",
      transformResponse: (response: NotificationsResponse | Notification[]) => 
        Array.isArray(response) ? response : response.notifications || [],
      providesTags: ["Notifications"],
    }),

    createNotification: builder.mutation<any, Partial<Notification>>({
      query: (body) => ({
        url: "create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Notifications"],
    }),

    sendBulkNotifications: builder.mutation<any, { userIds: string[]; payload: any }>({
      query: (body) => ({
        url: "bulk",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Notifications"],
    }),

    broadcastNotification: builder.mutation<any, any>({
      query: (body) => ({
        url: "broadcast",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Notifications"],
    }),

    // ==========================================
    // 🧹 CLEANUP
    // ==========================================

    deleteNotification: builder.mutation<any, string>({
      query: (id) => ({
        url: `delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),

    deleteAllUserNotifications: builder.mutation<any, string>({
      query: (userId) => ({
        url: `delete-all/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useRegisterPushTokenMutation,
  useGetUserNotificationsQuery,
  useGetAllNotificationsQuery,
  useCreateNotificationMutation,
  useSendBulkNotificationsMutation,
  useBroadcastNotificationMutation,
  useMarkAsReadMutation,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllUserNotificationsMutation,
} = notificationApi;