import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

// Import your RTK Query hooks
import { 
  useGetUserNotificationsQuery, 
  useMarkAsReadMutation, 
  useMarkAllReadMutation 
} from "@/src/store/Apis/Notification.Api";

dayjs.extend(relativeTime);

// UNIVERSITY THEME COLORS
const UNIVERSITY_RED = "#D32F2F";
const UNIVERSITY_WHITE = "#FFFFFF";
const DARK_NAVY = "#1A237E";
const BACKGROUND_GREY = "#FAFAFA";

export default function NotificationPage() {
  const navigation = useNavigation();

  // HARDCODED ID FROM YOUR JSON (Replace with your useSelector(state => state.auth.user.id) later)
  const userId = "a03561f1-5793-479f-aba4-bcb167729bd0";

  // 1. Fetch data for this specific user
  const { data: notifications, isLoading, isFetching, refetch } = useGetUserNotificationsQuery(userId);
  
  // 2. Mutations
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllRead] = useMarkAllReadMutation();

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const handlePressNotification = async (notifId: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(notifId);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={UNIVERSITY_WHITE} />
      
      {/* TOP NAVIGATION BAR - Profile Style */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={UNIVERSITY_RED} />
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>Communication Center</Text>
        <TouchableOpacity 
          style={styles.actionIcon} 
          onPress={() => markAllRead(userId)}
          disabled={unreadCount === 0}
        >
          <MaterialCommunityIcons 
            name="check-all" 
            size={22} 
            color={unreadCount > 0 ? UNIVERSITY_RED : "#CCC"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={UNIVERSITY_RED} />
        }
      >
        
        {/* EXECUTIVE HEADER SECTION */}
        <View style={styles.headerSection}>
          <View style={styles.iconWrapper}>
            <View style={styles.iconInner}>
              <MaterialCommunityIcons name="shield-outline" size={38} color={UNIVERSITY_WHITE} />
            </View>
            {unreadCount > 0 && <View style={styles.activeIndicator} />}
          </View>
          <Text style={styles.pageTitle}>Inbox</Text>
          <Text style={styles.pageSubTitle}>LUEC Official Correspondence</Text>
          
          <View style={styles.badgeRow}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{unreadCount} Unread Message(s)</Text>
            </View>
          </View>
        </View>

        {/* NOTIFICATION FEED */}
        <View style={styles.sectionDivider}>
          <Text style={styles.sectionLabel}>Recent Briefings</Text>
          <View style={styles.dividerLine} />
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={UNIVERSITY_RED} />
          </View>
        ) : notifications && notifications.length > 0 ? (
          notifications.map((item) => (
            <TouchableOpacity 
              key={item.id || item._id} 
              style={[styles.notifCard, !item.is_read && styles.unreadCard]}
              onPress={() => handlePressNotification(item.id || item._id || "", item.is_read)}
            >
              <View style={[styles.iconCircle, !item.is_read && styles.unreadIconCircle]}>
                <MaterialCommunityIcons 
                  name={item.is_read ? "email-open-outline" : "email-mark-as-unread"} 
                  size={20} 
                  color={item.is_read ? "#999" : UNIVERSITY_RED} 
                />
              </View>
              
              <View style={styles.contentArea}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.notifTitle, !item.is_read && styles.boldTitle]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.timeStamp}>{dayjs(item.createdAt).fromNow()}</Text>
                </View>
                <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bell-off-outline" size={60} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>Secure & Empty</Text>
            <Text style={styles.emptySub}>No official notifications found for your registration number.</Text>
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerMain}>LAIKIPIA UNIVERSITY ELECTORAL COMMISSION</Text>
          <Text style={styles.footerSub}>SYSTEM SECURED BY GAKENYE NDIRITU • © 2026</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BACKGROUND_GREY },
  topNav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: UNIVERSITY_WHITE,
    borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
  },
  backButton: { padding: 8, borderRadius: 12, backgroundColor: '#FFF2F2' },
  actionIcon: { padding: 8 },
  topNavTitle: { fontSize: 13, fontWeight: "800", color: "#666", textTransform: 'uppercase', letterSpacing: 1.2 },
  
  scrollContainer: { padding: 20, paddingBottom: 50 },

  headerSection: { alignItems: 'center', marginBottom: 30 },
  iconWrapper: { position: 'relative', marginBottom: 15 },
  iconInner: { width: 86, height: 86, borderRadius: 30, backgroundColor: DARK_NAVY, justifyContent: 'center', alignItems: 'center' },
  activeIndicator: { position: 'absolute', top: -2, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: UNIVERSITY_RED, borderWidth: 3, borderColor: '#FFF' },
  pageTitle: { fontSize: 28, fontWeight: "900", color: "#111", letterSpacing: -0.5 },
  pageSubTitle: { fontSize: 13, color: UNIVERSITY_RED, fontWeight: "700", marginTop: 4, textTransform: 'uppercase' },
  badgeRow: { marginTop: 15 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF2F2', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 25 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: UNIVERSITY_RED, marginRight: 8 },
  statusText: { fontSize: 12, fontWeight: '800', color: UNIVERSITY_RED },

  sectionDivider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: "900", color: "#222", textTransform: 'uppercase' },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#EEE', marginLeft: 15 },

  notifCard: { 
    flexDirection: 'row', backgroundColor: UNIVERSITY_WHITE, padding: 16, borderRadius: 22, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0' 
  },
  unreadCard: { borderColor: '#FFEBEB', borderLeftWidth: 5, borderLeftColor: UNIVERSITY_RED },
  iconCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  unreadIconCircle: { backgroundColor: '#FFF2F2' },
  contentArea: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle: { fontSize: 15, color: '#444', fontWeight: '600' },
  boldTitle: { color: '#111', fontWeight: '800' },
  timeStamp: { fontSize: 10, color: '#AAA', fontWeight: '700' },
  notifMessage: { fontSize: 13, color: '#777', lineHeight: 18 },

  loaderContainer: { flex: 1, alignItems: 'center', marginTop: 50 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#444', marginTop: 15 },
  emptySub: { fontSize: 14, color: '#AAA', marginTop: 6, textAlign: 'center' },

  footer: { marginTop: 40, alignItems: 'center' },
  footerLine: { width: 40, height: 3, backgroundColor: UNIVERSITY_RED, borderRadius: 2, marginBottom: 15 },
  footerMain: { fontSize: 10, fontWeight: '900', color: '#333', letterSpacing: 1 },
  footerSub: { fontSize: 9, color: '#BBB', marginTop: 5, fontWeight: '600' }
});