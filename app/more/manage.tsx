import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
  Animated,
  Share,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import ConfettiCannon from "react-native-confetti-cannon";

type User = {
  name: string;
  email: string;
  admission: string;
  voterId: string;
  department: string;
  year: string;
  avatar: string;
  hasVoted: boolean;
  twoFAEnabled: boolean;
  passwordSet: boolean;
};

type VoteHistoryItem = {
  election: string;
  date: string;
  status: "Voted" | "Missed";
  details: string;
};

export default function AccountDashboard() {
  const [user, setUser] = useState<User>({
    name: "John Doe",
    email: "john.doe@school.ac.ke",
    admission: "ADM2025-00123",
    voterId: "VTR-888-221-993",
    department: "Computer Science",
    year: "4th Year",
    avatar:
      "https://ui-avatars.com/api/?name=John+Doe&background=ff3366&color=fff",
    hasVoted: false,
    twoFAEnabled: false,
    passwordSet: true,
  });

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [nextElection] = useState("15 Dec 2025");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVote, setSelectedVote] = useState<VoteHistoryItem | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const [voteHistory, setVoteHistory] = useState<VoteHistoryItem[]>([
    { election: "Student Council 2024", date: "12 Jan 2024", status: "Voted", details: "Voted for Jane Smith as president." },
    { election: "Class Rep 2024", date: "20 Feb 2024", status: "Missed", details: "Did not participate." },
    { election: "Sports Committee 2024", date: "05 Mar 2024", status: "Voted", details: "Voted for Alex Kimani as Sports Rep." },
  ]);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const statusAnim = useRef(new Animated.Value(0)).current;
  const historyAnim = useRef(voteHistory.map(() => new Animated.Value(0))).current;
  const votePulseAnim = useRef(new Animated.Value(1)).current;

  const profileCompletion = Math.floor(
    ((user.avatar ? 1 : 0) +
      (user.email ? 1 : 0) +
      (user.passwordSet ? 1 : 0) +
      (user.twoFAEnabled ? 1 : 0)) /
      4 *
      100
  );

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    Animated.timing(statusAnim, { toValue: 1, duration: 600, delay: 300, useNativeDriver: true }).start();
    historyAnim.forEach((anim, index) => {
      Animated.timing(anim, { toValue: 1, duration: 500, delay: 500 + index * 200, useNativeDriver: true }).start();
    });

    if (!user.hasVoted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(votePulseAnim, { toValue: 1.05, duration: 700, useNativeDriver: true }),
          Animated.timing(votePulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    }
  }, []);

  const handleChange = (field: keyof User, value: string) => setUser({ ...user, [field]: value });

  const pickImage = async (camera: boolean = false) => {
    const permissionResult = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) return alert("Permission is required!");
    const result = camera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled) setUser({ ...user, avatar: result.assets[0].uri });
  };

  const handleSave = () => alert("Profile updated successfully!");
  const handleVoteNow = () => {
    setUser({ ...user, hasVoted: true });
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  };
  const handleShareVoterId = async () => {
    try {
      await Share.share({ message: `My voter ID: ${user.voterId}\nName: ${user.name}\nSchool: Laikipia University` });
    } catch { alert("Failed to share voter ID"); }
  };

  const openVoteDetails = (vote: VoteHistoryItem) => {
    setSelectedVote(vote);
    setModalVisible(true);
  };

  const handleLogout = () => Alert.alert("Logout", "Are you sure you want to logout?", [{ text: "Cancel" }, { text: "Logout", onPress: () => alert("Logged out") }]);

  return (
    <SafeAreaView style={styles.container}>
      {showConfetti && <ConfettiCannon count={150} origin={{ x: -10, y: 0 }} fadeOut />}
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Header */}
        <Animated.View style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }] }}>
          <LinearGradient colors={["#ff3366", "#ff6688"]} style={styles.headerGradient}>
            <View style={styles.profileTop}>
              <View style={styles.avatarRow}>
                <TouchableOpacity onPress={() => pickImage(false)} style={styles.avatarWrapper}>
                  <Image source={{ uri: user.avatar }} style={styles.avatar} />
                  <View style={styles.cameraIcon}><Text style={styles.cameraIconText}>📸</Text></View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => pickImage(true)} style={styles.cameraButton}><Text style={styles.cameraButtonText}>Take Photo</Text></TouchableOpacity>
              </View>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${profileCompletion}%` }]} />
                <Text style={styles.progressText}>Profile Completion: {profileCompletion}%</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Voting Status */}
        <Animated.View style={{ opacity: statusAnim, transform: [{ scale: statusAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }}>
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>Voting Status:</Text>
            <Text style={[styles.statusValue, { color: user.hasVoted ? "#2ecc71" : "#ff3366" }]}>{user.hasVoted ? "✅ Already Voted" : "❌ Not Voted"}</Text>
            {!user.hasVoted && <Animated.View style={{ transform: [{ scale: votePulseAnim }] }}><TouchableOpacity style={styles.voteButton} onPress={handleVoteNow}><Text style={styles.voteButtonText}>Vote Now</Text></TouchableOpacity></Animated.View>}
            <View style={styles.reminderBadge}><Text style={styles.reminderText}>Next Election: {nextElection}</Text></View>
            <TouchableOpacity style={styles.shareButton} onPress={handleShareVoterId}><Text style={styles.shareButtonText}>Share Voter ID</Text></TouchableOpacity>
            <View style={styles.qrContainer}><QRCode value={user.voterId} size={100} /></View>
          </View>
        </Animated.View>

        {/* Editable Fields & Security */}
        <View style={styles.form}>
          {[
            { label: "Full Name", field: "name" as keyof User },
            { label: "Email", field: "email" as keyof User },
            { label: "Admission Number", field: "admission" as keyof User },
            { label: "Voter ID", field: "voterId" as keyof User },
          ].map(({ label, field }) => (
            <View key={field} style={[styles.inputContainer, focusedField === field && styles.inputContainerFocused]}>
              <Text style={styles.label}>{label}</Text>w
              <TextInput value={String(user[field])} onChangeText={(txt) => handleChange(field, txt)} onFocus={() => setFocusedField(field)} onBlur={() => setFocusedField(null)} style={styles.input} editable={field !== "voterId"} />
            </View>
          ))}
          <View style={[styles.inputContainer, focusedField === "password" && styles.inputContainerFocused]}>
            <Text style={styles.label}>Change Password</Text>
            <TextInput value={password} onChangeText={setPassword} onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)} style={styles.input} secureTextEntry placeholder="Enter new password" placeholderTextColor="#aaa" />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Two-Factor Authentication (2FA)</Text>
            <TouchableOpacity style={[styles.twoFAButton, { backgroundColor: user.twoFAEnabled ? "#2ecc71" : "#eee" }]} onPress={() => setUser({ ...user, twoFAEnabled: !user.twoFAEnabled })}>
              <Text style={{ color: user.twoFAEnabled ? "#fff" : "#555", fontWeight: "700" }}>{user.twoFAEnabled ? "Enabled" : "Enable"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Voting History */}
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Voting History</Text>
          {voteHistory.map((vote, idx) => (
            <Animated.View key={idx} style={{ opacity: historyAnim[idx], transform: [{ translateY: historyAnim[idx].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
              <TouchableOpacity style={styles.historyItem} onPress={() => openVoteDetails(vote)}>
                <Text style={styles.historyElection}>{vote.election}</Text>
                <Text style={styles.historyDate}>{vote.date}</Text>
                <Text style={[styles.historyStatus, { color: vote.status === "Voted" ? "#2ecc71" : "#ff3366" }]}>{vote.status}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}><Text style={styles.saveButtonText}>Save Changes</Text></TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}><Text style={styles.logoutButtonText}>Logout</Text></TouchableOpacity>

        {/* Improved Modal for Voting History */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <Animated.View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedVote?.election}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>Date:</Text>
                <Text style={styles.modalText}>{selectedVote?.date}</Text>

                <Text style={styles.modalLabel}>Status:</Text>
                <Text style={[styles.modalText, { color: selectedVote?.status === "Voted" ? "#2ecc71" : "#ff3366" }]}>
                  {selectedVote?.status}
                </Text>

                <Text style={styles.modalLabel}>Details:</Text>
                <Text style={styles.modalText}>{selectedVote?.details}</Text>
              </View>
              <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

// === Styles ===
// (Add all previous styles for header, profile, voting status, forms, buttons, etc.)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerGradient: { paddingVertical: 20, paddingHorizontal: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  profileTop: { alignItems: "center" },
  avatarRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatarWrapper: { width: 80, height: 80, borderRadius: 40, overflow: "hidden", marginRight: 10 },
  avatar: { width: "100%", height: "100%" },
  cameraIcon: { position: "absolute", bottom: 0, right: 0, backgroundColor: "#ff3366", borderRadius: 12, padding: 2 },
  cameraIconText: { color: "#fff", fontSize: 12 },
  cameraButton: { backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  cameraButtonText: { color: "#ff3366", fontWeight: "700" },
  userName: { fontSize: 20, fontWeight: "700", color: "#fff" },
  userEmail: { fontSize: 14, color: "#fff", marginBottom: 10 },
  progressContainer: { width: "100%", backgroundColor: "#fff3", borderRadius: 10, overflow: "hidden", height: 10, marginBottom: 10 },
  progressBar: { height: "100%", backgroundColor: "#fff" },
  progressText: { fontSize: 12, color: "#fff", marginTop: 5 },
  statusCard: { backgroundColor: "#fff", margin: 20, borderRadius: 16, padding: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  statusText: { fontSize: 16, fontWeight: "600" },
  statusValue: { fontSize: 16, fontWeight: "700", marginVertical: 5 },
  voteButton: { backgroundColor: "#ff3366", padding: 12, borderRadius: 12, alignItems: "center", marginVertical: 10 },
  voteButtonText: { color: "#fff", fontWeight: "700" },
  reminderBadge: { backgroundColor: "#ffdde0", padding: 8, borderRadius: 12, alignItems: "center", marginVertical: 5 },
  reminderText: { color: "#ff3366", fontWeight: "700" },
  shareButton: { backgroundColor: "#ff6688", padding: 10, borderRadius: 12, alignItems: "center", marginTop: 10 },
  shareButtonText: { color: "#fff", fontWeight: "700" },
  qrContainer: { marginTop: 10, alignItems: "center" },
  form: { paddingHorizontal: 20, marginTop: 10 },
  inputContainer: { marginVertical: 8, borderWidth: 1, borderColor: "#eee", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  inputContainerFocused: { borderColor: "#ff3366" },
  label: { fontSize: 14, fontWeight: "600", color: "#555" },
  input: { fontSize: 16, color: "#333" },
  twoFAButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, marginTop: 6, alignItems: "center" },
  historyCard: { margin: 20, padding: 16, backgroundColor: "#fff", borderRadius: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 },
  historyTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  historyItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#eee" },
  historyElection: { fontSize: 15, fontWeight: "600" },
  historyDate: { fontSize: 13, color: "#888" },
  historyStatus: { fontSize: 13, fontWeight: "700" },
  saveButton: { backgroundColor: "#ff3366", marginHorizontal: 20, paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 20 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  logoutButton: { marginTop: 15, marginHorizontal: 20, backgroundColor: "#555", paddingVertical: 15, borderRadius: 12, alignItems: "center" },
  logoutButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // --- Modal Styles ---
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  modalCard: { width: "100%", backgroundColor: "#fff", borderRadius: 20, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#ff3366" },
  modalClose: { fontSize: 20, fontWeight: "700", color: "#aaa" },
  modalBody: { marginBottom: 20 },
  modalLabel: { fontSize: 14, fontWeight: "600", color: "#555", marginTop: 10 },
  modalText: { fontSize: 16, color: "#333" },
  modalButton: { backgroundColor: "#ff3366", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  modalButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
