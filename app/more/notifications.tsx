import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import * as Haptics from "expo-haptics"; 

import { 
  useGetUserNotificationsQuery, 
  useMarkAsReadMutation, 
  useMarkAllReadMutation 
} from "@/src/store/Apis/Notification.Api";

dayjs.extend(relativeTime);

// UNIVERSITY BRAND COLORS ONLY
const UNIVERSITY_RED = "#D32F2F";
const UNIVERSITY_WHITE = "#FFFFFF";
const BACKGROUND_GREY = "#FAFAFA";

export default function NotificationPage() {
  const navigation = useNavigation();
  
  // Modal State
  const [selectedNotif, setSelectedNotif] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // User ID from your system
  const userId = "a03561f1-5793-479f-aba4-bcb167729bd0"; 

  const { data: notifications, isLoading, isFetching, refetch } = useGetUserNotificationsQuery(userId);
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllRead] = useMarkAllReadMutation();

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handlePressNotification = async (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setSelectedNotif(item);
    setModalVisible(true);

    if (!item.is_read) {
      try {
        const notificationId = item.id || item._id;
        // Integrating the PUT {{baseUrl}}/mark-read/{{notificationId}}
        await markAsRead(notificationId).unwrap();
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
  };

  const handleMarkAll = () => {
    Alert.alert(
      "Clear Indicators",
      "Mark all official briefings as read?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            try {
              await markAllRead(userId).unwrap();
            } catch (error) {
              Alert.alert("Error", "Could not sync read status.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={UNIVERSITY_RED} />
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>Communication Center</Text>
        <TouchableOpacity 
          style={styles.actionIcon} 
          onPress={handleMarkAll}
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
          <RefreshControl 
            refreshing={isFetching} 
            onRefresh={onRefresh} 
            tintColor={UNIVERSITY_RED} 
            colors={[UNIVERSITY_RED]} 
          />
        }
      >
        
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
              <View style={[styles.statusDot, { backgroundColor: isFetching ? '#FFB300' : UNIVERSITY_RED }]} />
              <Text style={styles.statusText}>
                {isFetching ? "Syncing..." : `${unreadCount} Unread Briefing(s)`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionDivider}>
          <Text style={styles.sectionLabel}>Recent Briefings</Text>
          <View style={styles.dividerLine} />
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={UNIVERSITY_RED} />
            <Text style={styles.loadingText}>Fetching updates...</Text>
          </View>
        ) : notifications && notifications.length > 0 ? (
          notifications.map((item) => (
            <TouchableOpacity 
              key={item.id || item._id} 
              activeOpacity={0.7}
              style={[styles.notifCard, !item.is_read && styles.unreadCard]}
              onPress={() => handlePressNotification(item)}
            >
              <View style={[styles.iconCircle, !item.is_read && styles.unreadIconCircle]}>
                <MaterialCommunityIcons 
                  name={item.is_read ? "email-open-outline" : "email-mark-as-unread"} 
                  size={20} 
                  color={item.is_read ? UNIVERSITY_RED + '80' : UNIVERSITY_RED} 
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
            <MaterialCommunityIcons name="bell-off-outline" size={60} color={UNIVERSITY_RED + '30'} />
            <Text style={styles.emptyTitle}>Secure & Empty</Text>
            <Text style={styles.emptySub}>Your official inbox is currently clear.</Text>
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerMain}>LAIKIPIA UNIVERSITY ELECTORAL COMMISSION</Text>
          <Text style={styles.footerSub}>SYSTEM SECURED • © 2026</Text>
        </View>
      </ScrollView>

      {/* Message Detail Modal (Red & White Only) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIndicator}>
                <View style={styles.redLine} />
                <Text style={styles.officialTag}>Official Notice</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={32} color={UNIVERSITY_RED} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <Text style={styles.modalTitle}>{selectedNotif?.title}</Text>
              <Text style={styles.modalTime}>{dayjs(selectedNotif?.createdAt).format('DD MMM YYYY • HH:mm')}</Text>
              <View style={styles.modalDivider} />
              <Text style={styles.modalMessage}>{selectedNotif?.message}</Text>
            </ScrollView>

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close Briefing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BACKGROUND_GREY },
  topNav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: UNIVERSITY_WHITE,
    borderBottomWidth: 1, borderBottomColor: UNIVERSITY_RED + '20',
  },
  backButton: { padding: 8, borderRadius: 12, backgroundColor: '#FFF2F2' },
  actionIcon: { padding: 8 },
  topNavTitle: { fontSize: 13, fontWeight: "800", color: UNIVERSITY_RED, textTransform: 'uppercase', letterSpacing: 1.2 },
  scrollContainer: { padding: 20, paddingBottom: 50 },
  headerSection: { alignItems: 'center', marginBottom: 30 },
  iconWrapper: { position: 'relative', marginBottom: 15 },
  iconInner: { width: 86, height: 86, borderRadius: 30, backgroundColor: UNIVERSITY_RED, justifyContent: 'center', alignItems: 'center' },
  activeIndicator: { position: 'absolute', top: -2, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: UNIVERSITY_WHITE, borderWidth: 3, borderColor: UNIVERSITY_RED },
  pageTitle: { fontSize: 28, fontWeight: "900", color: UNIVERSITY_RED, letterSpacing: -0.5 },
  pageSubTitle: { fontSize: 13, color: UNIVERSITY_RED, fontWeight: "700", marginTop: 4, textTransform: 'uppercase', opacity: 0.8 },
  badgeRow: { marginTop: 15 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF2F2', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 25, borderWidth: 1, borderColor: UNIVERSITY_RED + '30' },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 12, fontWeight: '800', color: UNIVERSITY_RED },
  sectionDivider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: "900", color: UNIVERSITY_RED, textTransform: 'uppercase' },
  dividerLine: { flex: 1, height: 1, backgroundColor: UNIVERSITY_RED + '20', marginLeft: 15 },
  notifCard: { flexDirection: 'row', backgroundColor: UNIVERSITY_WHITE, padding: 16, borderRadius: 22, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: UNIVERSITY_RED + '10' },
  unreadCard: { borderColor: UNIVERSITY_RED + '40', borderLeftWidth: 6, borderLeftColor: UNIVERSITY_RED },
  iconCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  unreadIconCircle: { backgroundColor: '#FFF2F2' },
  contentArea: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle: { fontSize: 15, color: UNIVERSITY_RED, fontWeight: '600', opacity: 0.7 },
  boldTitle: { color: UNIVERSITY_RED, fontWeight: '900', opacity: 1 },
  timeStamp: { fontSize: 10, color: UNIVERSITY_RED, fontWeight: '700', opacity: 0.5 },
  notifMessage: { fontSize: 13, color: '#666', lineHeight: 18 },
  loaderContainer: { flex: 1, alignItems: 'center', marginTop: 50 },
  loadingText: { marginTop: 10, color: UNIVERSITY_RED, fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: UNIVERSITY_RED, marginTop: 15 },
  emptySub: { fontSize: 14, color: UNIVERSITY_RED, opacity: 0.5, marginTop: 6, textAlign: 'center' },
  footer: { marginTop: 40, alignItems: 'center' },
  footerLine: { width: 40, height: 3, backgroundColor: UNIVERSITY_RED, borderRadius: 2, marginBottom: 15 },
  footerMain: { fontSize: 10, fontWeight: '900', color: UNIVERSITY_RED, letterSpacing: 1 },
  footerSub: { fontSize: 9, color: UNIVERSITY_RED, marginTop: 5, fontWeight: '600', opacity: 0.4 },

  // Modal Styles (Strictly Red & White)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(211, 47, 47, 0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: UNIVERSITY_WHITE, borderRadius: 24, padding: 24, maxHeight: '85%', borderWidth: 2, borderColor: UNIVERSITY_RED, shadowColor: UNIVERSITY_RED, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalHeaderIndicator: { flexDirection: 'row', alignItems: 'center' },
  redLine: { width: 4, height: 20, backgroundColor: UNIVERSITY_RED, marginRight: 10, borderRadius: 2 },
  officialTag: { fontSize: 12, fontWeight: '800', color: UNIVERSITY_RED, textTransform: 'uppercase' },
  modalScroll: { paddingBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: UNIVERSITY_RED, marginBottom: 8 },
  modalTime: { fontSize: 12, color: UNIVERSITY_RED, fontWeight: '700', opacity: 0.6 },
  modalDivider: { height: 1, backgroundColor: UNIVERSITY_RED + '20', marginVertical: 15 },
  modalMessage: { fontSize: 16, color: '#444', lineHeight: 24, fontWeight: '400' },
  closeButton: { backgroundColor: UNIVERSITY_RED, padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  closeButtonText: { color: UNIVERSITY_WHITE, fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }
});