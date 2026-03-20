import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Animatable from "react-native-animatable";

// Redux & API Hooks
import { useSelector } from "react-redux";
import { RootState } from "@/src/store";
import { 
  useGetUserByIdQuery, 
  useUpdateUserMutation, 
  useDeleteUserMutation 
} from "@/src/store/Apis/User.Api";

// --- THEME ---
const UNIVERSITY_RED = "#D32F2F";
const DARK_NAVY = "#121212";
const CLEAN_WHITE = "#FFFFFF";
const BG_COLOR = "#F9FAFB";
const DANGER_ZONE = "#FF3B30";
const SUCCESS_GREEN = "#2E7D32";
const UNIVERSITY_BLACK = 'rgba(0,0,0,0.8)';

interface User {
  id: string;
  name: string;
  email: string;
  reg_no: string;
  role: string;
  expected_graduation: string;
  graduation_status: string;
  school: string;
  profile_complete: boolean;
  has_secret_code: boolean;
  has_face_verification: boolean;
  created_at: string;
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const [isEditModalVisible, setEditModalVisible] = useState(false);

  const userId = useSelector((state: RootState) => state.auth.user?.userId);

  const { data, isLoading, refetch, isFetching, error } = useGetUserByIdQuery(userId || "", {
    skip: !userId,
  });
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const userData = data?.user as User | undefined;
  const [form, setForm] = useState({ name: "", school: "" });

  useEffect(() => {
    if (userData) {
      setForm({ name: userData.name, school: userData.school });
    }
  }, [userData]);

  const handleUpdate = async () => {
    if (!userId) return;
    try {
      await updateUser({ id: userId, name: form.name, school: form.school }).unwrap();
      Alert.alert("Authorized", "Voter registry has been updated.");
      setEditModalVisible(false);
    } catch (err: any) {
      Alert.alert("Access Denied", err?.data?.error || "Sync failed.");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Secure Session", "Terminate encrypted connection?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive", 
        onPress: async () => {
          await AsyncStorage.multiRemove(["token", "user"]);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        } 
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "CRITICAL: PURGE IDENTITY",
      "This will remove you from the active voter registry. You will lose your right to vote in the current cycle.",
      [
        { text: "Abort", style: "cancel" },
        { 
          text: "Confirm Purge", 
          style: "destructive", 
          onPress: async () => {
            try {
              if (!userId) return;
              await deleteUser(userId).unwrap();
              await AsyncStorage.multiRemove(["token", "user"]);
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            } catch (err: any) {
              Alert.alert("Purge Failed", "Blockchain registry rejected the request.");
            }
          } 
        },
      ]
    );
  };

  if (isLoading || (userId && !userData && !error)) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color={UNIVERSITY_RED} />
        <Text style={styles.loadingText}>SYNCING VOTER RECORD...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Animatable.View animation="fadeInLeft" style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backChevron}>
             <Ionicons name="chevron-back" size={26} color={UNIVERSITY_RED} />
          </TouchableOpacity>
          <Image source={require('@/assets/images/Laikipia-logo.png')} style={styles.logo} />
          <View>
            <Text style={styles.headerTitle}>Voter Terminal</Text>
            <Text style={styles.headerSub}>NODE: {userData?.id.slice(0, 8).toUpperCase()}</Text>
          </View>
        </Animatable.View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.notifBell} 
            onPress={() => navigation.navigate("more/notifications")}
          >
            <Ionicons name="notifications-outline" size={24} color={UNIVERSITY_RED} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <MaterialCommunityIcons name="power-standby" size={22} color={UNIVERSITY_RED} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={UNIVERSITY_RED} />}
      >
        {/* VOTER ID CARD */}
        <View style={styles.heroSection}>
          <Animatable.View animation="flipInY" duration={2000} style={styles.voterCard}>
            <View style={styles.cardTop}>
                <Image source={require('@/assets/images/Laikipia-logo.png')} style={styles.cardLogo} />
                <View style={styles.chip} />
            </View>
            
            <View style={styles.cardBody}>
                <View style={styles.avatarBorder}>
                    <MaterialCommunityIcons name="account-tie" size={60} color={CLEAN_WHITE} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{userData?.name.toUpperCase()}</Text>
                    <Text style={styles.cardReg}>{userData?.reg_no}</Text>
                    <View style={styles.eligibilityBadge}>
                        <Text style={styles.eligibilityText}>ELIGIBLE VOTER</Text>
                    </View>
                </View>
            </View>
            
            <View style={styles.cardFooter}>
                <Text style={styles.cardFooterText}>LAIKIPIA UNIVERSITY ELECTORAL COMMISSION</Text>
            </View>
          </Animatable.View>
          
          <TouchableOpacity style={styles.editBadge} onPress={() => setEditModalVisible(true)}>
             <Ionicons name="shield-checkmark" size={14} color={CLEAN_WHITE} />
             <Text style={styles.editBadgeText}>UPDATE VOTER DETAILS</Text>
          </TouchableOpacity>
        </View>

        {/* ELECTION STATUS */}
        <View style={styles.gridSection}>
          <StatusCard 
            icon="fingerprint"
            label="Biometrics"
            value={userData?.has_face_verification ? "VERIFIED" : "PENDING"}
            isActive={userData?.has_face_verification}
          />
          <StatusCard 
            icon="vote"
            label="Ballot Status"
            value="NOT CAST"
            isActive={false}
          />
        </View>

        {/* SECURITY & RECORD DETAILS */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionLabel}>Election Metadata</Text>
          <InfoItem icon="ribbon-outline" label="Constituency" value={userData?.school} showArrow />
          <InfoItem icon="calendar-outline" label="Graduation Year" value={userData?.expected_graduation} isLocked />
        <InfoItem 
            icon="calendar-clear-outline" 
            label="Registration Date" 
            value={userData?.created_at ? new Date(userData.created_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }) : "PENDING"} 
            isLocked 
          />
          <InfoItem icon="globe-outline" label="Registry Status" value="On-Chain (Sepolia)" isLocked />


          <Text style={[styles.sectionLabel, { marginTop: 25 }]}>System Integrity</Text>
          <InfoItem icon="hardware-chip-outline" label="Session ID" value={userData?.id} isLocked />
          <InfoItem icon="person-outline" label="Registry Role" value={userData?.role.toUpperCase()} isLocked />

          <Text style={[styles.sectionLabel, { marginTop: 25, color: DANGER_ZONE }]}>DELETE ACCOUNT</Text>
          <TouchableOpacity style={styles.deleteBox} onPress={handleDeleteAccount} disabled={isDeleting}>
            <View style={styles.dangerIcon}>
                {isDeleting ? <ActivityIndicator size="small" color={DANGER_ZONE} /> : <Ionicons name="alert-circle-outline" size={20} color={DANGER_ZONE} />}
            </View>
            <View style={styles.infoContent}>
                <Text style={styles.deleteTitle}>Delete User Account</Text>
                <Text style={styles.deleteSub}>De-register from the current election cycle</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.syncButton} onPress={() => refetch()}>
          <Ionicons name="refresh-circle-outline" size={20} color={CLEAN_WHITE} />
          <Text style={styles.syncText}>REFRESH VOTER LEDGER</Text>
        </TouchableOpacity>

        <Text style={styles.footerInfo}>SECURE VOTING SYSTEM • BLOCKCHAIN ENABLED</Text>
      </ScrollView>

      {/* UPDATE MODAL */}
      <Modal visible={isEditModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Update Voter Data</Text>
            
            <Text style={styles.inputLabel}>Full Legal Name</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={(t) => setForm({...form, name: t})} />
            
            <Text style={styles.inputLabel}>University School</Text>
            <TextInput style={styles.input} value={form.school} onChangeText={(t) => setForm({...form, school: t})} />

            <Text style={styles.inputLabel}>Expected Graduation (System Locked)</Text>
            <TextInput 
              style={[styles.input, styles.disabledInput]} 
              value={userData?.expected_graduation} 
              editable={false} 
            />
            
            <View style={styles.noteBox}>
                <Ionicons name="information-circle" size={18} color={UNIVERSITY_RED} />
                <Text style={styles.noteText}>Contact Admin to update Graduation dates. All metadata changes are audited.</Text>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={isUpdating}>
              {isUpdating ? <ActivityIndicator color={CLEAN_WHITE} /> : <Text style={styles.saveBtnText}>SYNC WITH REGISTRY</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
              <Text style={styles.cancelBtnText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// COMPONENT HELPERS
const StatusCard = ({ icon, label, value, isActive }: any) => (
  <View style={styles.statusCard}>
    <MaterialCommunityIcons name={icon} size={28} color={isActive ? SUCCESS_GREEN : UNIVERSITY_RED} />
    <Text style={styles.statusLabel}>{label}</Text>
    <Text style={[styles.statusValue, { color: isActive ? SUCCESS_GREEN : UNIVERSITY_RED }]}>{value}</Text>
  </View>
);

const InfoItem = ({ icon, label, value, isLocked, showArrow }: any) => (
  <View style={styles.infoBox}>
    <View style={styles.iconContainer}><Ionicons name={icon} size={18} color={UNIVERSITY_RED} /></View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value || "NOT_SET"}</Text>
    </View>
    {isLocked ? <Ionicons name="lock-closed" size={12} color="#DDD" /> : showArrow ? <Ionicons name="chevron-forward" size={16} color="#BBB" /> : null}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_COLOR },
  loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: CLEAN_WHITE },
  loadingText: { marginTop: 15, fontSize: 10, fontWeight: "900", color: "#666", letterSpacing: 1.5 },
  
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 15, paddingVertical: 12, backgroundColor: CLEAN_WHITE, borderBottomWidth: 1, borderColor: "#EEE" },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  backChevron: { paddingRight: 8 },
  logo: { width: 38, height: 38, marginRight: 10, resizeMode: 'contain' },
  notifBell: { padding: 8, position: 'relative' },
  bellDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: UNIVERSITY_RED, borderWidth: 1.5, borderColor: CLEAN_WHITE },
  headerTitle: { fontSize: 16, fontWeight: "900", color: UNIVERSITY_RED },
  headerSub: { fontSize: 10, color: "#999", fontWeight: "700" },
  logoutBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFF5F5", justifyContent: "center", alignItems: "center" },
  
  heroSection: { alignItems: "center", paddingVertical: 25, backgroundColor: CLEAN_WHITE, borderBottomLeftRadius: 35, borderBottomRightRadius: 35, elevation: 4 },
  voterCard: { width: '90%', height: 180, backgroundColor: UNIVERSITY_BLACK, borderRadius: 20, padding: 20, elevation: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  cardLogo: { width: 35, height: 35, resizeMode: 'contain' },
  chip: { width: 40, height: 30, backgroundColor: 'gold', borderRadius: 5, opacity: 0.8 },
  cardBody: { flexDirection: 'row', alignItems: 'center' },
  avatarBorder: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: UNIVERSITY_RED, backgroundColor: '#1e1e1e', justifyContent: 'center', alignItems: 'center' },
  cardInfo: { marginLeft: 15, flex: 1 },
  cardName: { color: CLEAN_WHITE, fontSize: 16, fontWeight: '900' },
  cardReg: { color: '#AAA', fontSize: 12, fontWeight: '600' },
  eligibilityBadge: { backgroundColor: SUCCESS_GREEN, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginTop: 8 },
  eligibilityText: { color: CLEAN_WHITE, fontSize: 8, fontWeight: '900' },
  cardFooter: { marginTop: 'auto', borderTopWidth: 0.5, borderColor: '#333', paddingTop: 8 },
  cardFooterText: { color: '#666', fontSize: 8, textAlign: 'center', fontWeight: '800' },

  editBadge: { marginTop: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: UNIVERSITY_RED, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  editBadgeText: { color: CLEAN_WHITE, fontSize: 11, fontWeight: "800", marginLeft: 8 },

  gridSection: { flexDirection: "row", padding: 20, gap: 15 },
  statusCard: { flex: 1, backgroundColor: CLEAN_WHITE, padding: 18, borderRadius: 22, alignItems: "center", borderWidth: 1, borderColor: "#F0F0F0" },
  statusLabel: { fontSize: 9, color: "#AAA", fontWeight: "800", marginTop: 8, textTransform: "uppercase" },
  statusValue: { fontSize: 11, fontWeight: "900", marginTop: 2 },

  infoSection: { paddingHorizontal: 20 },
  sectionLabel: { fontSize: 11, fontWeight: "900", color: "#888", textTransform: "uppercase", marginBottom: 12, letterSpacing: 1 },
  infoBox: { flexDirection: "row", alignItems: "center", backgroundColor: CLEAN_WHITE, padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: "#F2F2F2" },
  iconContainer: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#FFF2F2", justifyContent: "center", alignItems: "center" },
  infoContent: { marginLeft: 15, flex: 1 },
  infoLabel: { fontSize: 8, color: "#AAA", fontWeight: "800", textTransform: "uppercase" },
  infoValue: { fontSize: 14, color: DARK_NAVY, fontWeight: "700", marginTop: 1 },
  
  deleteBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF8F7", padding: 15, borderRadius: 15, borderWidth: 1, borderColor: "#FFE0DE" },
  dangerIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#FFE0DE", justifyContent: "center", alignItems: "center" },
  deleteTitle: { fontSize: 14, fontWeight: "800", color: DANGER_ZONE },
  deleteSub: { fontSize: 10, color: "#A08080", fontWeight: "600" },

  syncButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", margin: 25, padding: 18, borderRadius: 20, backgroundColor: UNIVERSITY_RED },
  syncText: { color: CLEAN_WHITE, fontSize: 14, fontWeight: "900", marginLeft: 10 },
  footerInfo: { textAlign: "center", fontSize: 10, color: "#000", fontWeight: "700", marginBottom: 40 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 25 },
  modalContainer: { backgroundColor: CLEAN_WHITE, borderRadius: 30, padding: 25 },
  modalTitle: { fontSize: 20, fontWeight: "900", color: DARK_NAVY, marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 11, fontWeight: "800", color: "#999", marginBottom: 6, marginLeft: 5 },
  input: { backgroundColor: "#F7F7F7", padding: 16, borderRadius: 14, marginBottom: 15, fontWeight: "700", color: DARK_NAVY, borderWidth: 1, borderColor: "#EEE" },
  disabledInput: { color: "#AAA", backgroundColor: "#EAEAEA" },
  noteBox: { flexDirection: 'row', backgroundColor: "#FFF2F2", padding: 12, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  noteText: { flex: 1, color: UNIVERSITY_RED, fontSize: 10, fontWeight: "700", marginLeft: 8 },
  saveBtn: { backgroundColor: DARK_NAVY, padding: 18, borderRadius: 16, alignItems: "center" },
  saveBtnText: { color: CLEAN_WHITE, fontWeight: "900" },
  cancelBtn: { padding: 18, alignItems: "center" },
  cancelBtnText: { color: "#888", fontWeight: "800" }
});