import React, { useCallback, useState, useEffect } from "react";
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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import * as Haptics from "expo-haptics"; 
import * as Animatable from "react-native-animatable";

import { 
  useGetUserNotificationsQuery, 
  useMarkAsReadMutation, 
  useMarkAllReadMutation 
} from "@/src/store/Apis/Notification.Api";

dayjs.extend(relativeTime);

// --- THEME ---
const UNIVERSITY_RED = "#D32F2F";
const DARK_NAVY = "#121212";
const CLEAN_WHITE = "#FFFFFF";
const BG_COLOR = "#F9FAFB";

export default function NotificationPage() {
  const router = useRouter();
  const [selectedNotif, setSelectedNotif] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [regNo, setRegNo] = useState<string | null>(null);

  // Dynamic User ID retrieval
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setRegNo(parsedUser.reg_no);
      }
    };
    loadUser();
  }, []);

  // Hardcoded fallback ID preserved as per your request, though regNo is now available
  const userId = "a03561f1-5793-479f-aba4-bcb167729bd0"; 

  const { data: notifications, isLoading, isFetching, refetch } = useGetUserNotificationsQuery(userId);
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllRead] = useMarkAllReadMutation();

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const onRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    refetch();
  }, [refetch]);

  const handlePressNotification = async (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedNotif(item);
    setModalVisible(true);

    if (!item.is_read) {
      try {
        const notificationId = item.id || item._id;
        await markAsRead(notificationId).unwrap();
      } catch (error) {
        console.error("Sync Error:", error);
      }
    }
  };

  const handleMarkAll = () => {
    Alert.alert(
      "Clear Registry Indicators",
      "Mark all official briefings as read?",
      [
        { text: "Abort", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            try {
              await markAllRead(userId).unwrap();
            } catch (error) {
              Alert.alert("Sync Error", "Could not update read status on-chain.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* --- TOP NAVIGATION BAR --- */}
      <View style={styles.navBar}>
        <Animatable.View animation="fadeInLeft" style={styles.navLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backChevron}>
             <Ionicons name="chevron-back" size={26} color={UNIVERSITY_RED} />
          </TouchableOpacity>
          <Image source={require('@/assets/images/Laikipia-logo.png')} style={styles.navLogo} />
          <View>
            <Text style={styles.navTitle}>Registry Inbox</Text>
            <Text style={styles.navSub}>ENCRYPTED CHANNEL</Text>
          </View>
        </Animatable.View>
        
        <TouchableOpacity 
          style={styles.navRight} 
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
          <RefreshControl refreshing={isFetching} onRefresh={onRefresh} tintColor={UNIVERSITY_RED} />
        }
      >
        {/* HEADER SECTION */}
        <Animatable.View animation="fadeInDown" style={styles.headerSection}>
          <View style={styles.iconWrapper}>
            <View style={styles.iconInner}>
              <MaterialCommunityIcons name="shield-lock-outline" size={42} color={CLEAN_WHITE} />
            </View>
            {unreadCount > 0 && <View style={styles.activeIndicator} />}
          </View>
          <Text style={styles.pageTitle}>Communication Center</Text>
          <Text style={styles.pageSubTitle}>L.U.E.C Node: {regNo || "FETCHING..."}</Text>
          
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: isFetching ? '#FFB300' : UNIVERSITY_RED }]} />
            <Text style={styles.statusText}>
              {isFetching ? "SYNCING REGISTRY..." : `${unreadCount} UNREAD BRIEFING(S)`}
            </Text>
          </View>
        </Animatable.View>

        <View style={styles.sectionDivider}>
          <Text style={styles.sectionLabel}>Broadcast History</Text>
          <View style={styles.dividerLine} />
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={UNIVERSITY_RED} />
            <Text style={styles.loadingText}>ACCESSING SECURE DATABASE...</Text>
          </View>
        ) : notifications && notifications.length > 0 ? (
          notifications.map((item, index) => (
            <Animatable.View key={item.id || item._id} animation="fadeInUp" delay={index * 100}>
              <TouchableOpacity 
                activeOpacity={0.8}
                style={[styles.notifCard, !item.is_read && styles.unreadCard]}
                onPress={() => handlePressNotification(item)}
              >
                <View style={[styles.iconCircle, !item.is_read && styles.unreadIconCircle]}>
                  <MaterialCommunityIcons 
                    name={item.is_read ? "email-open-outline" : "email-seal-outline"} 
                    size={20} 
                    color={item.is_read ? "#BBB" : UNIVERSITY_RED} 
                  />
                </View>
                
                <View style={styles.contentArea}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.notifTitle, !item.is_read && styles.boldTitle]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.timeStamp}>{dayjs(item.createdAt).fromNow()}</Text>
                  </View>
                  <Text style={styles.notifMessage} numberOfLines={1}>{item.message}</Text>
                </View>
              </TouchableOpacity>
            </Animatable.View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="shield-off-outline" size={60} color="#DDD" />
            <Text style={styles.emptyTitle}>Secure & Empty</Text>
            <Text style={styles.emptySub}>Your official inbox is currently clear of briefings.</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerMain}>L.U.E.C INFRASTRUCTURE</Text>
          <Text style={styles.footerSub}>SESSION SECURE • 2026</Text>
        </View>
      </ScrollView>

      {/* ENCRYPTED BRIEFING MODAL */}
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Animatable.View animation="zoomIn" duration={300} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIndicator}>
                <View style={styles.redLine} />
                <Text style={styles.officialTag}>OFFICIAL BRIEFING</Text>
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

            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>DISMISS BRIEFING</Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG_COLOR },
  
  // NAVIGATION
  navBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 15, paddingVertical: 12, backgroundColor: CLEAN_WHITE, borderBottomWidth: 1, borderColor: "#EEE" },
  navLeft: { flexDirection: "row", alignItems: "center" },
  backChevron: { paddingRight: 8 },
  navLogo: { width: 35, height: 35, marginRight: 10, resizeMode: 'contain' },
  navTitle: { fontSize: 14, fontWeight: "900", color: UNIVERSITY_RED },
  navSub: { fontSize: 8, color: "#999", fontWeight: "700", letterSpacing: 0.5 },
  navRight: { padding: 8 },

  scrollContainer: { paddingHorizontal: 20, paddingBottom: 50 },
  
  // HEADER
  headerSection: { alignItems: 'center', marginTop: 25, marginBottom: 30 },
  iconWrapper: { position: 'relative', marginBottom: 15 },
  iconInner: { width: 90, height: 90, borderRadius: 32, backgroundColor: UNIVERSITY_RED, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  activeIndicator: { position: 'absolute', top: -4, right: -4, width: 24, height: 24, borderRadius: 12, backgroundColor: CLEAN_WHITE, borderWidth: 4, borderColor: UNIVERSITY_RED },
  pageTitle: { fontSize: 24, fontWeight: "900", color: DARK_NAVY },
  pageSubTitle: { fontSize: 10, color: UNIVERSITY_RED, fontWeight: "800", marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF2F2', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 25, borderWidth: 1, borderColor: UNIVERSITY_RED + '20', marginTop: 15 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  statusText: { fontSize: 10, fontWeight: '900', color: UNIVERSITY_RED },

  sectionDivider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sectionLabel: { fontSize: 10, fontWeight: "900", color: "#AAA", textTransform: 'uppercase', letterSpacing: 1 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#EEE", marginLeft: 15 },

  // CARDS
  notifCard: { flexDirection: 'row', backgroundColor: CLEAN_WHITE, padding: 18, borderRadius: 20, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: "#EEE" },
  unreadCard: { borderColor: UNIVERSITY_RED + '20', borderLeftWidth: 5, borderLeftColor: UNIVERSITY_RED },
  iconCircle: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#F8F8F8', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  unreadIconCircle: { backgroundColor: '#FFF2F2' },
  contentArea: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle: { fontSize: 15, color: "#777", fontWeight: '700' },
  boldTitle: { color: DARK_NAVY, fontWeight: '900' },
  timeStamp: { fontSize: 9, color: "#AAA", fontWeight: '700' },
  notifMessage: { fontSize: 12, color: '#888', fontWeight: '500' },

  loaderContainer: { flex: 1, alignItems: 'center', marginTop: 50 },
  loadingText: { marginTop: 10, color: "#AAA", fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: "#DDD", marginTop: 15 },
  emptySub: { fontSize: 12, color: "#AAA", marginTop: 6, textAlign: 'center' },

  footer: { marginTop: 40, alignItems: 'center', opacity: 0.3 },
  footerMain: { fontSize: 9, fontWeight: '900', color: DARK_NAVY, letterSpacing: 1 },
  footerSub: { fontSize: 8, color: DARK_NAVY, marginTop: 4, fontWeight: '700' },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: CLEAN_WHITE, borderRadius: 28, padding: 25, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalHeaderIndicator: { flexDirection: 'row', alignItems: 'center' },
  redLine: { width: 4, height: 20, backgroundColor: UNIVERSITY_RED, marginRight: 10, borderRadius: 2 },
  officialTag: { fontSize: 11, fontWeight: '900', color: UNIVERSITY_RED, letterSpacing: 1 },
  modalScroll: { paddingBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: DARK_NAVY, marginBottom: 8 },
  modalTime: { fontSize: 11, color: "#AAA", fontWeight: '700' },
  modalDivider: { height: 1, backgroundColor: "#EEE", marginVertical: 15 },
  modalMessage: { fontSize: 15, color: '#444', lineHeight: 24, fontWeight: '500' },
  closeButton: { backgroundColor: UNIVERSITY_RED, paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  closeButtonText: { color: CLEAN_WHITE, fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});