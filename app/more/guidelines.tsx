import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
  RefreshControl,
  Image,
  ToastAndroid,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from 'expo-local-authentication';

const UNIVERSITY_RED = "#D32F2F";
const DARK_NAVY = "#1A237E";

export default function VotingGuidelinesScreen() {
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<string | null>("P-0");
  const [refreshing, setRefreshing] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  
  const toastY = useRef(new Animated.Value(-100)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);
    })();
  }, []);

  const sections = useMemo(() => [
    {
      id: "P",
      title: "How to Vote",
      subtitle: "STEP-BY-STEP PROCESS",
      data: [
        { title: "1. Select Election", icon: "ballot-outline", text: "Browse the 'Active Elections' list on your dashboard. Ensure you select the correct category (e.g., SGC Executive or Faculty Rep)." },
        { title: "2. Review Candidates", icon: "account-search-outline", text: "Click on a candidate to view their profile and manifesto. Take your time to make an informed decision based on their vision." },
        { title: "3. Cast & Confirm", icon: "touch-app", text: "Tap 'Vote' on your preferred candidate. A confirmation summary will appear. Review it carefully as blockchain entries cannot be reversed." },
        { title: "4. Cryptographic Signing", icon: "key-chain", text: "To finalize, you must sign the transaction using your Biometrics or PIN. This authorizes the Smart Contract to record your vote." },
        { title: "5. Receipt Generation", icon: "file-certificate", text: "Once the block is confirmed, you will receive a unique Transaction Hash (TxID). Save this to verify your vote on the public ledger later." },
      ]
    },
    {
      id: "B",
      title: "Blockchain Security",
      subtitle: "TECHNICAL PROTOCOLS",
      data: [
        { title: "Immutable Ledger", icon: "database-lock", text: "Your vote is stored in a decentralized block. No administrator, IT staff, or student leader can delete or change your ballot once cast." },
        { title: "Double-Vote Shield", icon: "shield-refresh-outline", text: "The Smart Contract checks your cryptographic signature against the voter registry. If a duplicate attempt is detected, the transaction is automatically rejected." },
        { title: "Anonymity Engine", icon: "incognito-off", text: "While the system verifies you are an eligible student, your specific choice is detached from your identity using zero-knowledge principles." },
      ]
    },
    {
      id: "G",
      title: "Rules of Conduct",
      subtitle: "UNIVERSITY STANDARDS",
      data: [
        { title: "Voter Eligibility", icon: "school-outline", text: "Must be a bona fide Laikipia University student with an active semester registration. Suspended students are automatically blacklisted." },
        { title: "Coercion & Bribery", icon: "alert-octagon", text: "Any student found influencing others through intimidation or financial incentives within the digital platform will face the Disciplinary Committee." },
        { title: "Technical Integrity", icon: "bug-stop", text: "Attempting to reverse-engineer the API or perform a DDoS attack on the nodes will lead to permanent expulsion and legal prosecution." },
      ]
    }
  ], []);

  const showToast = (message: string) => {
    if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT);
    Animated.parallel([
      Animated.timing(toastY, { toValue: 60, duration: 500, useNativeDriver: true }),
      Animated.timing(toastOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastY, { toValue: -100, duration: 500, useNativeDriver: true }),
        Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 2800);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showToast("Electoral Nodes Verified");
      setRefreshing(false);
    }, 1200);
  }, []);

  const handleProceed = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (isBiometricSupported) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authorize Voter Credentials',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push("/(tabs)/vote");
      }
    } else {
      router.push("/(tabs)/vote");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* TOAST */}
      <Animated.View style={[styles.toastContainer, { opacity: toastOpacity, transform: [{ translateY: toastY }] }]}>
        <LinearGradient colors={[DARK_NAVY, "#0D47A1"]} style={styles.toastContent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <MaterialCommunityIcons name="link-variant" size={18} color="#fff" />
          <Text style={styles.toastText}>Network: Sepolia Mainnet Sync</Text>
        </LinearGradient>
      </Animated.View>

      {/* NAVBAR */}
      <View style={styles.navbar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backChevron}>
             <Ionicons name="chevron-back" size={26} color={UNIVERSITY_RED} />
          </TouchableOpacity>
          <Image source={require('@/assets/images/Laikipia-logo.png')} style={styles.logo} />
          <View>
            <Text style={styles.headerTitle}>Guidelines</Text>
            <Text style={styles.headerSub}>E-VOTE PORTAL</Text>
          </View>
        </View>
        <View style={styles.statusGroup}>
            <View style={styles.dot} />
            <Text style={styles.statusLabel}>LIVE</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[UNIVERSITY_RED]} />}
      >
        <View style={styles.instructionBox}>
            <Text style={styles.instructionTitle}>Electoral Protocols</Text>
            <Text style={styles.instructionText}>
                Please expand each section to understand the voting mechanism and security standards enforced for this election.
            </Text>
        </View>

        {sections.map((section) => (
          <View key={section.id} style={styles.mainSection}>
            <View style={styles.sectionHeaderLine}>
                <View>
                    <Text style={styles.headerText}>{section.title}</Text>
                    <Text style={styles.headerSubText}>{section.subtitle}</Text>
                </View>
                <View style={styles.titleLine} />
            </View>

            {section.data.map((item, idx) => {
              const currentId = `${section.id}-${idx}`;
              const isExpanded = expandedIndex === currentId;
              return (
                <View key={currentId} style={[styles.sectionCard, isExpanded && styles.selectedCard]}>
                  <TouchableOpacity onPress={() => setExpandedIndex(isExpanded ? null : currentId)} activeOpacity={0.7} style={styles.cardHeader}>
                    <View style={styles.titleContainer}>
                       <Text style={styles.stepTag}>{section.id === "P" ? "STEP" : section.id === "B" ? "NODE" : "POLICY"} 0{idx + 1}</Text>
                       <Text style={[styles.sectionTitle, isExpanded && { color: UNIVERSITY_RED }]}>{item.title}</Text>
                    </View>
                    <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={isExpanded ? UNIVERSITY_RED : "#CCC"} />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.expandedContent}>
                       <View style={styles.divider} />
                       <View style={styles.contentRow}>
                          <View style={styles.iconCircle}>
                            <MaterialCommunityIcons name={item.icon as any} size={20} color={UNIVERSITY_RED} />
                          </View>
                          <Text style={styles.sectionText}>{item.text}</Text>
                       </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        <TouchableOpacity style={styles.proceedButton} onPress={handleProceed}>
          <LinearGradient colors={[UNIVERSITY_RED, "#9B1C1C"]} style={styles.gradientBtn} start={{x:0, y:0}} end={{x:1, y:0}}>
            <MaterialCommunityIcons name="shield-check" size={22} color="#FFF" />
            <Text style={styles.proceedText}>Accept & Authenticate</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>LAIKIPIA UNIVERSITY COMPUTING SOCIETY</Text>
          <Text style={styles.footerSub}>BLOCKCHAIN INFRASTRUCTURE V2.1.0 • 2026</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FAFAFA" },
  navbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, height: 75, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee", elevation: 3 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backChevron: { marginRight: 8, padding: 4 },
  logo: { width: 40, height: 40, resizeMode: 'contain', marginRight: 10 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: UNIVERSITY_RED, textTransform: 'uppercase' },
  headerSub: { fontSize: 9, color: '#999', fontWeight: 'bold' },
  statusGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEBEE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: UNIVERSITY_RED, marginRight: 6 },
  statusLabel: { fontSize: 10, fontWeight: '900', color: UNIVERSITY_RED },
  scrollContent: { padding: 20 },
  toastContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99999, alignItems: 'center' },
  toastContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, gap: 8, elevation: 10 },
  toastText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  instructionBox: { backgroundColor: DARK_NAVY, padding: 20, borderRadius: 20, marginBottom: 30 },
  instructionTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', marginBottom: 5 },
  instructionText: { color: '#B0BEC5', fontSize: 13, lineHeight: 19 },
  mainSection: { marginBottom: 35 },
  sectionHeaderLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  headerText: { fontSize: 17, fontWeight: "900", color: "#222" },
  headerSubText: { fontSize: 9, color: UNIVERSITY_RED, fontWeight: '900', letterSpacing: 0.5 },
  titleLine: { flex: 1, height: 1, backgroundColor: '#EEE', marginLeft: 15 },
  sectionCard: { padding: 18, marginVertical: 6, borderRadius: 22, backgroundColor: "#fff", borderWidth: 1, borderColor: "#F0F0F0" },
  selectedCard: { borderColor: UNIVERSITY_RED, backgroundColor: "#FFF9F9", elevation: 2 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  titleContainer: { flex: 1 },
  stepTag: { fontSize: 8, fontWeight: "900", color: "#BBB", letterSpacing: 1, marginBottom: 2 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: DARK_NAVY },
  expandedContent: { marginTop: 15 },
  divider: { height: 1, backgroundColor: "#F5F5F5", marginBottom: 15 },
  contentRow: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FDF2F2', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  sectionText: { flex: 1, fontSize: 13, color: "#555", lineHeight: 20, fontWeight: '500' },
  proceedButton: { marginTop: 10, borderRadius: 20, overflow: 'hidden', elevation: 6 },
  gradientBtn: { padding: 22, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  proceedText: { color: "#FFF", fontWeight: "900", fontSize: 16, textTransform: 'uppercase' },
  footer: { marginTop: 40, alignItems: 'center', paddingBottom: 20 },
  footerBrand: { fontSize: 10, fontWeight: '900', color: '#AAA', letterSpacing: 1 },
  footerSub: { fontSize: 8, color: '#CCC', marginTop: 4 },
});