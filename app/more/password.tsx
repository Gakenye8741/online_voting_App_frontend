import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Modal,
  DimensionValue, // Added for type safety
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Animatable from "react-native-animatable";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useUpdatePasswordMutation } from "@/src/store/Apis/Auth.Api";

// --- THEME ---
const UNIVERSITY_RED = "#D32F2F";
const DARK_NAVY = "#121212";
const CLEAN_WHITE = "#FFFFFF";
const BG_COLOR = "#F9FAFB";
const SUCCESS_GREEN = "#2E7D32";
const WARNING_GOLD = "#F9A825";

// Define the strength type to fix the 'DimensionValue' error
interface StrengthState {
  label: string;
  color: string;
  percent: DimensionValue; 
}

export default function UpdatePasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [regNo, setRegNo] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [updatePassword] = useUpdatePasswordMutation();

  // Fix 1: Properly typed strength state
  const [strength, setStrength] = useState<StrengthState>({ 
    label: 'VOID', 
    color: '#DDD', 
    percent: '0%' 
  });

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

  useEffect(() => {
    validatePassword(password);
  }, [password]);

  const validatePassword = (pass: string) => {
    if (pass.length === 0) return setStrength({ label: 'VOID', color: '#DDD', percent: '0%' });
    if (pass.length < 6) return setStrength({ label: 'WEAK', color: UNIVERSITY_RED, percent: '30%' });
    
    // Regex for strong password
    const isSecure = pass.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/);
    if (isSecure) {
      return setStrength({ label: 'SECURE', color: SUCCESS_GREEN, percent: '100%' });
    }
    return setStrength({ label: 'MODERATE', color: WARNING_GOLD, percent: '65%' });
  };

  const handleCommitRequest = () => {
    if (!password || !confirmPassword) {
      Alert.alert("Incomplete", "Please fill both fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Security Breach", "Password must be at least 6 characters.");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    // Fix 2: Handle 'string | null' by providing a fallback or checking truthiness
    if (!regNo) {
      Alert.alert("Error", "Voter identity not found.");
      return;
    }

    setShowConfirmModal(false);
    setLoading(true);
    try {
      const res: any = await updatePassword({ reg_no: regNo, password }).unwrap();
      Alert.alert("Success", res.message || "Credential keys updated successfully!");
      router.replace("/(tabs)"); 
    } catch (err: any) {
      Alert.alert("Access Denied", err?.data?.error || "Registry update failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <Animatable.View animation="fadeInLeft" style={styles.navLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backChevron}>
             <Ionicons name="chevron-back" size={26} color={UNIVERSITY_RED} />
          </TouchableOpacity>
          <Image source={require('@/assets/images/Laikipia-logo.png')} style={styles.navLogo} />
          <View>
            <Text style={styles.navTitle}>Security Terminal</Text>
            <Text style={styles.navSub}>ENCRYPTED CHANNEL</Text>
          </View>
        </Animatable.View>
        <View style={styles.navRight}>
          <View style={styles.secureBadge}>
            <MaterialCommunityIcons name="shield-check" size={14} color={UNIVERSITY_RED} />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <Animatable.View animation="fadeInDown" style={styles.header}>
             <Image source={require('@/assets/images/Laikipia-logo.png')} style={styles.mainLogo} />
             <Text style={styles.headerTitle}>Rotate Access Keys</Text>
             <Text style={styles.headerSub}>NODE ID: {regNo || "UNKNOWN"}</Text>
          </Animatable.View>

          <View style={styles.formSection}>
            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={UNIVERSITY_RED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Min 6 characters"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#BBB" />
              </TouchableOpacity>
            </View>

            <View style={styles.strengthRow}>
                <View style={styles.strengthBarBackground}>
                    {/* Width type is now validated by DimensionValue */}
                    <View style={[styles.strengthBarActive, { width: strength.percent, backgroundColor: strength.color }]} />
                </View>
                <Text style={[styles.strengthText, { color: strength.color }]}>{strength.label}</Text>
            </View>

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="key-outline" size={18} color={UNIVERSITY_RED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm your entry"
                placeholderTextColor="#999"
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeIcon}>
                <Ionicons name={showConfirm ? "eye-off" : "eye"} size={20} color="#BBB" />
              </TouchableOpacity>
            </View>
          </View>

          <Animatable.View animation="fadeInUp" delay={500} style={styles.footer}>
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleCommitRequest}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={CLEAN_WHITE} />
              ) : (
                <>
                  <MaterialCommunityIcons name="shield-key" size={20} color={CLEAN_WHITE} />
                  <Text style={styles.primaryBtnText}>COMMIT CHANGES</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.replace("/(tabs)")}
              disabled={loading}
            >
              <Text style={styles.secondaryBtnText}>ABORT UPDATE</Text>
            </TouchableOpacity>
          </Animatable.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <Animatable.View animation="zoomIn" duration={300} style={styles.modalContainer}>
                <View style={styles.modalIconCircle}>
                    <MaterialCommunityIcons name="alert-decagram" size={40} color={UNIVERSITY_RED} />
                </View>
                <Text style={styles.modalTitle}>Confirm Key Rotation</Text>
                <Text style={styles.modalDesc}>
                    Are you sure you want to update your access credentials? You will be logged out of other sessions.
                </Text>
                <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.modalCancel} onPress={() => setShowConfirmModal(false)}>
                        <Text style={styles.modalCancelText}>CANCEL</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalConfirm} onPress={handleFinalSubmit}>
                        <Text style={styles.modalConfirmText}>CONFIRM</Text>
                    </TouchableOpacity>
                </View>
            </Animatable.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_COLOR },
  navBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 15, paddingVertical: 12, backgroundColor: CLEAN_WHITE, borderBottomWidth: 1, borderColor: "#EEE" },
  navLeft: { flexDirection: "row", alignItems: "center" },
  backChevron: { paddingRight: 8 },
  navLogo: { width: 35, height: 35, marginRight: 10, resizeMode: 'contain' },
  navTitle: { fontSize: 14, fontWeight: "900", color: UNIVERSITY_RED },
  navSub: { fontSize: 8, color: "#999", fontWeight: "700" },
  navRight: { padding: 8 },
  secureBadge: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#FFF2F2", justifyContent: "center", alignItems: "center" },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 25, paddingBottom: 40 },
  header: { alignItems: "center", marginTop: 30, marginBottom: 25 },
  mainLogo: { width: 80, height: 80, resizeMode: 'contain', marginBottom: 15 },
  headerTitle: { fontSize: 22, fontWeight: "900", color: DARK_NAVY },
  headerSub: { fontSize: 11, fontWeight: "800", color: UNIVERSITY_RED, letterSpacing: 1, marginTop: 4 },
  formSection: { width: "100%", marginBottom: 25 },
  inputLabel: { fontSize: 10, fontWeight: "900", color: "#888", textTransform: "uppercase", marginBottom: 8, marginLeft: 5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: CLEAN_WHITE, borderRadius: 16, borderWidth: 1, borderColor: "#EEE", marginBottom: 10, paddingHorizontal: 15 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 16, fontSize: 15, fontWeight: "700", color: DARK_NAVY },
  eyeIcon: { padding: 5 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 5 },
  strengthBarBackground: { flex: 1, height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden', marginRight: 10 },
  strengthBarActive: { height: '100%', borderRadius: 3 },
  strengthText: { fontSize: 10, fontWeight: "900", width: 65, textAlign: 'right' },
  footer: { width: "100%", gap: 12 },
  primaryBtn: { flexDirection: 'row', backgroundColor: UNIVERSITY_RED, paddingVertical: 18, borderRadius: 18, alignItems: "center", justifyContent: 'center' },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: CLEAN_WHITE, fontWeight: "900", fontSize: 13, marginLeft: 10 },
  secondaryBtn: { paddingVertical: 18, borderRadius: 18, alignItems: "center", borderWidth: 1.5, borderColor: "#DDD" },
  secondaryBtnText: { color: "#888", fontWeight: "900", fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { backgroundColor: CLEAN_WHITE, borderRadius: 25, padding: 25, width: '100%', alignItems: 'center' },
  modalIconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "900", color: DARK_NAVY, marginBottom: 10 },
  modalDesc: { textAlign: 'center', color: '#666', fontSize: 14, lineHeight: 20, marginBottom: 25 },
  modalActions: { flexDirection: 'row', gap: 15, width: '100%' },
  modalCancel: { flex: 1, paddingVertical: 15, borderRadius: 12, borderWidth: 1, borderColor: '#DDD', alignItems: 'center' },
  modalCancelText: { fontWeight: "800", color: '#888' },
  modalConfirm: { flex: 1, paddingVertical: 15, borderRadius: 12, backgroundColor: UNIVERSITY_RED, alignItems: 'center' },
  modalConfirmText: { fontWeight: "900", color: CLEAN_WHITE }
});