import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const UNIVERSITY_RED = "#D32F2F";
const UNIVERSITY_WHITE = "#FFFFFF";
const TECH_BLUE = "#1976D2";

export default function VersionPage() {
  const navigation = useNavigation();

  const versionLogs = [
    {
      version: "v1.0.4",
      tag: "Stable Production",
      date: "Feb 2026",
      changes: [
        "Implemented RTK Query for real-time vote syncing",
        "Enhanced biometric bypass security",
        "Optimized UI for low-bandwidth student data",
      ],
    },
    {
      version: "v1.0.2",
      tag: "Beta Testing",
      date: "Jan 2026",
      changes: [
        "Initial LUSO database integration",
        "Security handshake protocols added",
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* STICKY TOP NAVIGATION BAR */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={UNIVERSITY_RED} />
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>System Information</Text>
        <View style={{ width: 40 }} /> {/* Balancer for center alignment */}
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* CURRENT VERSION HEADER */}
        <View style={styles.vHeader}>
          <View style={styles.vCircle}>
            <MaterialCommunityIcons
              name="update"
              size={45}
              color={UNIVERSITY_WHITE}
            />
          </View>
          <Text style={styles.vMainTitle}>System Version</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionNumber}>1.0.4</Text>
          </View>
          <Text style={styles.buildStatus}>Build: 2026.02.08.STABLE</Text>
        </View>

        {/* SYSTEM SPECS CARD */}
        <View style={styles.specCard}>
          <Text style={styles.specTitle}>System Architecture</Text>
          <View style={styles.divider} />

          <View style={styles.specRow}>
            <Octicons name="stack" size={16} color={UNIVERSITY_RED} />
            <Text style={styles.specLabel}>Engine:</Text>
            <Text style={styles.specValue}>React Native 0.7x</Text>
          </View>

          <View style={styles.specRow}>
            <MaterialCommunityIcons
              name="shield-key"
              size={16}
              color={UNIVERSITY_RED}
            />
            <Text style={styles.specLabel}>Security:</Text>
            <Text style={styles.specValue}>AES-256 Encryption</Text>
          </View>

          <View style={styles.specRow}>
            <Ionicons name="cloud-done" size={16} color={UNIVERSITY_RED} />
            <Text style={styles.specLabel}>State:</Text>
            <Text style={styles.specValue}>Redux Toolkit / RTK Query</Text>
          </View>
        </View>

        {/* RELEASE LOGS */}
        <Text style={styles.sectionLabel}>Release History</Text>

        {versionLogs.map((log, index) => (
          <View key={index} style={styles.logCard}>
            <View style={styles.logHeader}>
              <Text style={styles.logVersion}>{log.version}</Text>
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{log.tag}</Text>
              </View>
              <Text style={styles.logDate}>{log.date}</Text>
            </View>
            <View style={styles.logBody}>
              {log.changes.map((change, i) => (
                <Text key={i} style={styles.changeText}>
                  • {change}
                </Text>
              ))}
            </View>
          </View>
        ))}

        {/* INTEGRITY CHECK SECTION */}
        <TouchableOpacity style={styles.integrityCard}>
          <MaterialCommunityIcons name="shield-check" size={24} color="#4CAF50" />
          <View style={{ marginLeft: 15 }}>
            <Text style={styles.integrityTitle}>Integrity Verified</Text>
            <Text style={styles.integritySub}>
              This build is signed and authorized by LU IT.
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.legalText}>
          Unauthorized redistribution or modification of this binary is strictly
          prohibited under the Kenya Information and Communications Act.
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Laikipia University E-Vote Project</Text>
          <Text style={styles.devCredit}>Lead Engineer: Gakenye Ndiritu</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FDFDFD" },
  container: { padding: 20, paddingTop: 10 },

  /* NEW TOP NAV STYLES */
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: UNIVERSITY_WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  topNavTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A1A",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  vHeader: { alignItems: "center", marginVertical: 20 },
  vCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: UNIVERSITY_RED,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: UNIVERSITY_RED,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: { elevation: 10 },
    }),
  },
  vMainTitle: { fontSize: 24, fontWeight: "900", color: "#1A1A1A" },
  versionBadge: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 8,
  },
  versionNumber: { color: UNIVERSITY_RED, fontWeight: "800", fontSize: 16 },
  buildStatus: { fontSize: 11, color: "#888", marginTop: 8, letterSpacing: 1 },

  specCard: {
    backgroundColor: UNIVERSITY_WHITE,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEE",
    marginBottom: 25,
  },
  specTitle: { fontSize: 16, fontWeight: "800", color: "#333", marginBottom: 10 },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginBottom: 15 },
  specRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  specLabel: { fontSize: 13, color: "#888", marginLeft: 10, width: 70 },
  specValue: { fontSize: 13, color: "#333", fontWeight: "700" },

  sectionLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 15,
  },
  logCard: {
    backgroundColor: UNIVERSITY_WHITE,
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  logVersion: { fontSize: 15, fontWeight: "800", color: "#1A1A1A" },
  tagBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginHorizontal: 10,
  },
  tagText: {
    color: TECH_BLUE,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  logDate: { fontSize: 12, color: "#999", flex: 1, textAlign: "right" },
  logBody: { borderTopWidth: 1, borderTopColor: "#F9F9F9", paddingTop: 10 },
  changeText: { fontSize: 13, color: "#666", marginBottom: 6, lineHeight: 18 },

  integrityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F8E9",
    padding: 15,
    borderRadius: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  integrityTitle: { fontSize: 14, fontWeight: "800", color: "#2E7D32" },
  integritySub: { fontSize: 11, color: "#666" },

  legalText: {
    fontSize: 10,
    color: "#BBB",
    textAlign: "center",
    marginTop: 30,
    lineHeight: 16,
  },
  footer: {
    marginTop: 30,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    paddingTop: 20,
    paddingBottom: 20,
  },
  footerText: { fontSize: 12, color: "#888", fontWeight: "600" },
  devCredit: {
    fontSize: 11,
    color: UNIVERSITY_RED,
    marginTop: 4,
    fontWeight: "800",
  },
});