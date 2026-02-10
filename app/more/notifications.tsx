import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Button,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useGetNotificationsForUserQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
} from "@/src/store/Apis/Notification.Api";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";

// Notification type colors and icons
const typeColors: Record<string, string> = {
  SYSTEM: "#4B7BE5",
  REMINDER: "#F5A623",
  ALERT: "#E53935",
  ELECTION: "#2E7D32",
  CANDIDATE: "#9C27B0",
};
const typeIcons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  SYSTEM: "information",
  REMINDER: "bell",
  ALERT: "alert-circle",
  ELECTION: "vote",
  CANDIDATE: "account",
};

const NotificationsScreen: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);

  // Load userId from AsyncStorage
  useEffect(() => {
    const fetchUserId = async () => {
      const id = await AsyncStorage.getItem("userId");
      if (id) setUserId(id);
    };
    fetchUserId();
  }, []);

  // Fetch notifications (skip until userId is loaded)
  const {
    data: notifications,
    isLoading,
    isFetching,
    refetch,
  } = useGetNotificationsForUserQuery(undefined, { skip: !userId });

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  // Mark single notification as read
  const handleMarkRead = useCallback(
    async (id: string, isBroadcast: boolean) => {
      if (isBroadcast) return; // cannot mark broadcast as read
      try {
        await markAsRead({ id }).unwrap();
        refetch();
      } catch (err) {
        console.log("Error marking notification as read:", err);
      }
    },
    [markAsRead, refetch]
  );

  // Mark all notifications as read
  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllAsRead().unwrap();
      refetch();
    } catch (err) {
      console.log("Error marking all notifications as read:", err);
    }
  }, [markAllAsRead, refetch]);

  // Delete notification
  const handleDelete = useCallback(
    (id: string, isBroadcast: boolean) => {
      if (isBroadcast) {
        Alert.alert("Cannot delete broadcast notification");
        return;
      }
      Alert.alert("Delete Notification", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteNotification({ id }).unwrap();
              refetch();
            } catch (err) {
              console.log("Error deleting notification:", err);
            }
          },
        },
      ]);
    },
    [deleteNotification, refetch]
  );

  const renderRightActions = (id: string, isBroadcast: boolean) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => handleDelete(id, isBroadcast)}
    >
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: any) => {
    const isBroadcast = !item.user_id;
    const typeColor = typeColors[item.type.toUpperCase()] || "#555";
    const iconName = typeIcons[item.type.toUpperCase()] || "bell";

    return (
      <Swipeable renderRightActions={() => renderRightActions(item.id, isBroadcast)}>
        <TouchableOpacity
          style={[
            styles.notificationItem,
            item.is_read ? styles.read : styles.unread,
            isBroadcast && styles.broadcast,
            { borderLeftColor: typeColor },
          ]}
          onPress={() => handleMarkRead(item.id, isBroadcast)}
        >
          <View style={styles.row}>
            <MaterialCommunityIcons
              name={iconName}
              size={24}
              color={typeColor}
              style={{ marginRight: 8 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {item.title} {isBroadcast ? "(Broadcast)" : ""}
              </Text>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={[styles.type, { color: typeColor }]}>{item.type}</Text>
            </View>
          </View>
          {!item.is_read && !isBroadcast && (
            <Text style={styles.mark}>Tap to mark as read</Text>
          )}
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const unreadCount =
    notifications?.filter((n) => !n.is_read && n.user_id).length || 0;

  if (!userId || isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Button title="Mark All as Read" onPress={handleMarkAllRead} color="#007AFF" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={notifications || []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.empty}>No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  notificationItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#f2f2f2",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
  },
  unread: {},
  read: { opacity: 0.7 },
  broadcast: { backgroundColor: "#FFF4E5" },
  row: { flexDirection: "row", alignItems: "flex-start" },
  title: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  message: { fontSize: 14, marginBottom: 4 },
  type: { fontSize: 12, fontWeight: "bold" },
  mark: { marginTop: 6, fontSize: 12, color: "#007AFF", fontStyle: "italic" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 },
  empty: { fontSize: 16, color: "#999" },
  deleteButton: { backgroundColor: "#E53935", justifyContent: "center", alignItems: "center", width: 80, marginBottom: 12, borderRadius: 8 },
  deleteText: { color: "#fff", fontWeight: "bold" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8 },
  badge: { backgroundColor: "#E53935", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, minWidth: 24, alignItems: "center" },
  badgeText: { color: "#fff", fontWeight: "bold" },
});
