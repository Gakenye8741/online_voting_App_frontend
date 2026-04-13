import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  StatusBar,
  Image,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  Ionicons, 
  MaterialCommunityIcons, 
  Octicons, 
  Feather 
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const UNIVERSITY_RED = "#D32F2F";
const UNIVERSITY_WHITE = "#FFFFFF";
const TECH_BLUE = "#1976D2";
const BORDER_COLOR = "#F0F0F0";
const { width } = Dimensions.get("window");

export default function DetailedVersionPage() {
  const navigation = useNavigation();
  const [pulseAnim] = useState(new Animated.Value(1));

  // Subtle pulse animation for the version icon
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const versionLogs = [
    {
      version: "v1.0.4-stable",
      tag: "Production",
      date: "Feb 08, 2026",
      hash: "8a2f1c9",
      changes: [
        "Implemented RTK Query for real-time ballot state management",
        "Biometric bypass logic for specific legacy Android kernels",
        "Asset compression pipeline reduced binary size by 14%",
        "Cloudflare WAF integration for edge-level DDoS mitigation",
      ],
    },
    {
      version: "v1.0.2-beta",
      tag: "Closed Beta",
      date: "Jan 15, 2026",
      hash: "4d9e3b2",
      changes: [
        "Initial LUSA Database schema migration (PostgreSQL)",
        "Implemented JWT-based session persistence with Refresh Tokens",
        "Added SHA-256 integrity checks for voting receipts",
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={UNIVERSITY_WHITE} />
      
      {/* BRANDED HEADER */}
      <View style={styles.topNav}>
        <View style={styles.navLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={26} color={UNIVERSITY_RED} />
          </TouchableOpacity>
          <Image 
            source={require('@/assets/images/Laikipia-logo.png')} 
            style={styles.navLogo} 
          />
        </View>
        <View style={styles.headerTextGroup}>
          <Text style={styles.topNavTitle}>System Manifest</Text>
          <Text style={styles.topNavSub}>LU-EVOTE-CORE-DISTRIBUTION</Text>
        </View>
        <TouchableOpacity style={styles.activityBtn}>
          <Feather name="activity" size={20} color={UNIVERSITY_RED} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* HERO SECTION */}
        <View style={styles.heroSection}>
          <View style={styles.vCircleContainer}>
            <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.vCircle}>
              <MaterialCommunityIcons name="shield-airplane" size={40} color={UNIVERSITY_WHITE} />
            </View>
          </View>
          <Text style={styles.appName}>Laikipia E-Vote</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionNumber}>STABLE RELEASE v1.0.4</Text>
          </View>
          <Text style={styles.buildInfo}>Build Identity: LU_PRD_2026_02_08_A1</Text>
        </View>

        {/* CORE ARCHITECTURE STATS */}
        <View style={styles.statGrid}>
          <StatBox label="OS TARGET" value={`${Platform.OS.toUpperCase()} ${Platform.Version}`} />
          <StatBox label="KERNEL" value="React 18.2" />
          <StatBox label="REGION" value="KE-CENTRAL" />
        </View>

        {/* TECHNICAL STACK */}
        <Text style={styles.sectionLabel}>Technical Stack</Text>
        <View style={styles.detailedCard}>
          <StackRow icon="layers" label="Framework" value="React Native 0.72.x (Hermes)" />
          <StackRow icon="database" label="Persistence" value="Redux Persist / Async" />
          <StackRow icon="link" label="API Layer" value="RESTful / RTK Query" />
          <StackRow icon="code" label="Language" value="TypeScript 5.x Strict" />
          <StackRow icon="lock" label="Encryption" value="AES-256-GCM / RSA-4096" />
        </View>

        {/* SECURITY AUDIT */}
        <View style={styles.auditSection}>
            <View style={styles.auditHeader}>
                <Octicons name="shield-check" size={18} color="#4CAF50" />
                <Text style={styles.auditTitle}>Security Audit Status</Text>
            </View>
            <View style={styles.auditGrid}>
                <AuditPill label="SSL/TLS 1.3" active />
                <AuditPill label="Root Detect" active />
                <AuditPill label="E2EE Active" active />
                <AuditPill label="FIPS 140-2" active />
            </View>
        </View>

        {/* RELEASE LOGS */}
        <Text style={styles.sectionLabel}>Version History</Text>
        {versionLogs.map((log, index) => (
          <View key={index} style={styles.logCard}>
            <View style={styles.logHeader}>
              <View>
                <Text style={styles.logVersion}>{log.version}</Text>
                <Text style={styles.logHash}>SHA: {log.hash}</Text>
              </View>
              <View style={styles.logMeta}>
                <View style={[styles.tagBadge, { backgroundColor: log.tag === 'Production' ? '#E8F5E9' : '#E3F2FD' }]}>
                  <Text style={[styles.tagText, { color: log.tag === 'Production' ? '#2E7D32' : TECH_BLUE }]}>{log.tag}</Text>
                </View>
                <Text style={styles.logDate}>{log.date}</Text>
              </View>
            </View>
            <View style={styles.logBody}>
              {log.changes.map((change, i) => (
                <View key={i} style={styles.changeRow}>
                    <View style={styles.bullet} />
                    <Text style={styles.changeText}>{change}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* COMPLIANCE */}
        <View style={styles.complianceBox}>
            <Ionicons name="information-circle-outline" size={20} color="#666" />
            <Text style={styles.complianceText}>
                Intellectual property of Laikipia University. Unauthorized debugging violates the Computing & Innovation Society standards.
            </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerMain}>LU ELECTORAL SYSTEM v1.0.4</Text>
          <Text style={styles.footerDev}>Lead Developer: Gakenye Ndiritu</Text>
          <Text style={styles.timestamp}>Last System Check: {new Date().toLocaleDateString()}</Text>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Sub-components
const StatBox = ({ label, value }: any) => (
  <View style={styles.statItem}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const StackRow = ({ icon, label, value }: any) => (
  <View style={styles.stackRow}>
    <Feather name={icon} size={14} color={UNIVERSITY_RED} style={{ width: 25 }} />
    <Text style={styles.stackLabel}>{label}:</Text>
    <Text style={styles.stackValue}>{value}</Text>
  </View>
);

const AuditPill = ({ label, active }: any) => (
    <View style={styles.auditPill}>
        <View style={[styles.statusDot, { backgroundColor: active ? '#4CAF50' : '#FF5252' }]} />
        <Text style={styles.auditPillText}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  topNav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, height: 75, backgroundColor: UNIVERSITY_WHITE,
    borderBottomWidth: 1, borderBottomColor: BORDER_COLOR,
  },
  navLeft: { flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 4, marginRight: 8 },
  navLogo: { width: 38, height: 38, resizeMode: 'contain' },
  headerTextGroup: { alignItems: 'center', flex: 1 },
  topNavTitle: { fontSize: 13, fontWeight: "900", color: "#1A1A1A", letterSpacing: 1, textTransform: 'uppercase' },
  topNavSub: { fontSize: 8, color: UNIVERSITY_RED, fontWeight: '700', marginTop: 2 },
  activityBtn: { padding: 8 },
  
  container: { padding: 20 },

  heroSection: { alignItems: 'center', marginBottom: 30 },
  vCircleContainer: { marginBottom: 15, justifyContent: 'center', alignItems: 'center' },
  vCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: UNIVERSITY_RED,
    justifyContent: "center", alignItems: "center", zIndex: 2,
  },
  pulseRing: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(211, 47, 47, 0.12)',
  },
  appName: { fontSize: 22, fontWeight: "900", color: "#1A1A1A" },
  versionBadge: {
    backgroundColor: "#1A1A1A", paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 8, marginTop: 8,
  },
  versionNumber: { color: UNIVERSITY_WHITE, fontWeight: "800", fontSize: 12 },
  buildInfo: { fontSize: 10, color: "#999", marginTop: 8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  statGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statItem: { 
    backgroundColor: UNIVERSITY_WHITE, width: (width - 60) / 3, 
    padding: 12, borderRadius: 16, borderWidth: 1, borderColor: BORDER_COLOR,
    alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5
  },
  statLabel: { fontSize: 8, fontWeight: '800', color: '#999', marginBottom: 4 },
  statValue: { fontSize: 10, fontWeight: '900', color: '#333' },

  sectionLabel: { fontSize: 15, fontWeight: "900", color: "#1A1A1A", marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  detailedCard: {
    backgroundColor: UNIVERSITY_WHITE, padding: 18, borderRadius: 24,
    borderWidth: 1, borderColor: BORDER_COLOR, marginBottom: 25,
  },
  stackRow: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  stackLabel: { fontSize: 12, color: "#888", width: 85, fontWeight: '600' },
  stackValue: { fontSize: 12, color: "#333", fontWeight: "700", flex: 1 },

  auditSection: { 
    backgroundColor: '#F1F8E9', padding: 15, borderRadius: 20, 
    borderWidth: 1, borderColor: '#C8E6C9', marginBottom: 25 
  },
  auditHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  auditTitle: { marginLeft: 10, fontSize: 14, fontWeight: '800', color: '#2E7D32' },
  auditGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  auditPill: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: UNIVERSITY_WHITE, 
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, 
    marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#E0E0E0'
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  auditPillText: { fontSize: 10, fontWeight: '700', color: '#555' },

  logCard: {
    backgroundColor: UNIVERSITY_WHITE, borderRadius: 24, padding: 18, marginBottom: 15,
    borderWidth: 1, borderColor: BORDER_COLOR,
  },
  logHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  logVersion: { fontSize: 16, fontWeight: "900", color: "#1A1A1A" },
  logHash: { fontSize: 10, color: UNIVERSITY_RED, fontFamily: 'monospace' },
  logMeta: { alignItems: 'flex-end' },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 4 },
  tagText: { fontSize: 9, fontWeight: "900", textTransform: "uppercase" },
  logDate: { fontSize: 11, color: "#999", fontWeight: '600' },
  logBody: { borderTopWidth: 1, borderTopColor: "#F5F5F5", paddingTop: 12 },
  changeRow: { flexDirection: 'row', marginBottom: 8 },
  bullet: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: UNIVERSITY_RED, marginTop: 6, marginRight: 10 },
  changeText: { fontSize: 13, color: "#555", flex: 1, lineHeight: 18 },

  complianceBox: { flexDirection: 'row', backgroundColor: '#F1F1F1', padding: 15, borderRadius: 16, marginTop: 10 },
  complianceText: { flex: 1, fontSize: 11, color: '#666', marginLeft: 12, lineHeight: 16, fontWeight: '500' },

  footer: { marginTop: 40, alignItems: "center" },
  footerMain: { fontSize: 11, color: "#1A1A1A", fontWeight: "900", letterSpacing: 1 },
  footerDev: { fontSize: 10, color: UNIVERSITY_RED, marginTop: 4, fontWeight: "800" },
  timestamp: { fontSize: 9, color: "#BBB", marginTop: 4 },
});