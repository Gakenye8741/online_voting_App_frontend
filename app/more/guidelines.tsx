import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  StatusBar,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

// ---------- CONSTANTS ----------
const UNIVERSITY_RED = "#D32F2F";

const guidelines = [
  {
    title: "Introduction",
    icon: "information-circle",
    text: "Welcome to the Laikipia E-Vote platform! This system is designed to enable all students to cast their votes in a secure and transparent manner. Please read the guidelines carefully before proceeding.",
  },
  {
    title: "Eligibility to Vote",
    icon: "people",
    text: "• Only registered students are allowed to vote.\n• Students must have a valid admission number.\n• Each student can vote only once per election.",
  },
  {
    title: "Election Positions",
    icon: "ribbon",
    text: "• President: Leads the student government.\n• Vice President: Assists the president.\n• Secretary: Maintains records.\n• Treasurer: Manages student funds.\n• Sports & Cultural Reps: Oversee student activities.",
  },
  {
    title: "Voting Process",
    icon: "checkmark-circle",
    text: "1. Log in with student credentials.\n2. Select your election.\n3. Review candidate manifestos.\n4. Cast and confirm your selection securely.",
  },
  {
    title: "Rules & Conduct",
    icon: "alert-circle",
    text: "• No multiple voting attempts.\n• Respect the democratic process.\n• Malpractice leads to automatic disqualification.",
  },
  {
    title: "Assistance",
    icon: "call",
    text: "For any issues, contact the student affairs office or email support@laikipia.edu.",
  },
];

export default function VotingGuidelinesScreen() {
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [agreed, setAgreed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Toast Animation State
  const toastY = useRef(new Animated.Value(-100)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // ---------- Toast Logic ----------
  const showToast = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
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

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      showToast();
      setRefreshing(false);
    }, 1000);
  };

  const toggleExpand = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  const handleAgreeToggle = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAgreed(!agreed);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* REFRESH TOAST */}
      <Animated.View style={[styles.toastContainer, { opacity: toastOpacity, transform: [{ translateY: toastY }] }]}>
        <LinearGradient colors={[UNIVERSITY_RED, "#B71C1C"]} style={styles.toastContent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Ionicons name="shield-checkmark" size={18} color="#fff" />
          <Text style={styles.toastText}>Guidelines Verified</Text>
        </LinearGradient>
      </Animated.View>

      {/* NAVBAR */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color={UNIVERSITY_RED} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Voting Rules</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[UNIVERSITY_RED]} />}
      >
        <Text style={styles.subtitle}>
          Please review the official voting protocols for the Laikipia University elections before casting your ballot.
        </Text>

        <Text style={styles.header}>Official Guidelines</Text>

        {guidelines.map((section, idx) => {
          const isExpanded = expandedIndex === idx;
          return (
            <View key={idx} style={[styles.sectionCard, isExpanded && styles.selectedCard]}>
              <TouchableOpacity 
                onPress={() => toggleExpand(idx)} 
                activeOpacity={0.7}
                style={styles.sectionHeader}
              >
                <View style={styles.titleContainer}>
                   <Text style={styles.stepText}>PROTOCOL {idx + 1}</Text>
                   <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={isExpanded ? UNIVERSITY_RED : "#999"}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.expandedContent}>
                   <View style={styles.divider} />
                   <View style={styles.contentRow}>
                      <Ionicons name={section.icon as any} size={20} color={UNIVERSITY_RED} style={{marginRight: 10, marginTop: 2}} />
                      <Text style={styles.sectionText}>{section.text}</Text>
                   </View>
                </View>
              )}
            </View>
          );
        })}

        {/* AGREEMENT SECTION */}
        {/* <View style={styles.agreementContainer}>
           <TouchableOpacity 
            style={styles.checkboxRow} 
            onPress={handleAgreeToggle}
            activeOpacity={0.8}
          >
            <View style={[styles.customCheckbox, agreed && styles.checkboxActive]}>
              {agreed && <Ionicons name="checkmark" size={16} color="#FFF" />}
            </View>
            <Text style={styles.agreementText}>
              I have read and agree to follow the guidelines.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, !agreed && { opacity: 0.5 }]}
            onPress={() => agreed && router.push("/vote")}
            disabled={!agreed}
          >
            <Text style={styles.buttonText}>Proceed to Vote</Text>
          </TouchableOpacity>
        </View> */}

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  navbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: "#eee" },
  backButton: { padding: 8 },
  navTitle: { fontSize: 18, fontWeight: "800", color: UNIVERSITY_RED, textTransform: "uppercase" },
  scrollContent: { padding: 20 },
  
  toastContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99999, alignItems: 'center' },
  toastContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, gap: 8, elevation: 10, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 5 },
  toastText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  subtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 25, lineHeight: 20 },
  header: { fontSize: 22, fontWeight: "800", color: UNIVERSITY_RED, marginBottom: 15 },
  
  sectionCard: { padding: 18, marginVertical: 6, borderWidth: 1.5, borderColor: "#eee", borderRadius: 15, backgroundColor: "#fff", elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 },
  selectedCard: { borderColor: UNIVERSITY_RED, backgroundColor: "#FFF5F5" },
  
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  titleContainer: { flex: 1 },
  stepText: { fontSize: 10, fontWeight: "800", color: "#999", letterSpacing: 1, marginBottom: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: UNIVERSITY_RED },
  
  expandedContent: { marginTop: 12 },
  divider: { height: 1, backgroundColor: "#eee", marginBottom: 12 },
  contentRow: { flexDirection: 'row', alignItems: 'flex-start' },
  sectionText: { flex: 1, fontSize: 14, color: "#444", lineHeight: 22 },

  agreementContainer: { marginTop: 25, paddingVertical: 10 },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginBottom: 20, paddingHorizontal: 5 },
  customCheckbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: UNIVERSITY_RED, marginRight: 12, justifyContent: "center", alignItems: "center" },
  checkboxActive: { backgroundColor: UNIVERSITY_RED },
  agreementText: { fontSize: 14, color: "#333", fontWeight: "700" },
  
  button: { backgroundColor: UNIVERSITY_RED, padding: 16, borderRadius: 12, alignItems: "center", marginTop: 5 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15, textTransform: "uppercase" },
});