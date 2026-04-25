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

  // Pulse animation for the main logo container
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const versionLogs = [
    {
      version: "v1.0.0-stable",
      tag: "Production",
      date: "April 26, 2026",
      hash: "8a2f1c9",
      changes: [
        "Blockchain Ledger: Ethereum Sepolia voting integration",
        "Drizzle ORM: Optimized PostgreSQL database queries",
        "Security: JWT session persistence with AES-256 encryption",
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
        
        {/* HERO SECTION WITH CISLU LOGO */}
        <View style={styles.heroSection}>
          <View style={styles.vCircleContainer}>
            <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.logoContainer}>
              <Image 
                source={require('@/assets/images/Laikipia-logo.png')} 
                style={styles.mainCisluLogo} 
              />
            </View>
          </View>
          
          <View style={styles.brandRow}>
          
            <Text style={styles.appName}>Laikipia E-Vote</Text>
          </View>

          <View style={styles.versionBadge}>
            <Text style={styles.versionNumber}>OFFICIAL RELEASE v1.0.0</Text>
          </View>
          <Text style={styles.buildInfo}>Build Identity: LU_PRD_2026_V1_STABLE</Text>
        </View>

        {/* CORE ARCHITECTURE STATS */}
        <View style={styles.statGrid}>
          <StatBox label="DATABASE" value="PostgreSQL" />
          <StatBox label="ORM" value="Drizzle" />
          <StatBox label="LEDGER" value="Sepolia" />
        </View>

        {/* TECHNICAL STACK */}
        <Text style={styles.sectionLabel}>Technical Core</Text>
        <View style={styles.detailedCard}>
          <StackRow icon="layers" label="Backend" value="Node.js / Express" />
          <StackRow icon="code" label="Language" value="TypeScript 5.x Strict" />
          <StackRow icon="link" label="State" value="RTK Query / Redux" />
          <StackRow icon="lock" label="Auth" value="JWT / Session Persistence" />
        </View>

        {/* UPCOMING ARCHITECTURE SECTION */}
        <Text style={styles.sectionLabel}>Upcoming Architecture</Text>
        <View style={styles.roadmapCard}>
          <View style={styles.roadmapItem}>
             <Ionicons name="sync-circle-outline" size={20} color={UNIVERSITY_RED} />
             <View style={styles.roadmapTextWrap}>
                <Text style={styles.roadmapTitle}>Registry Sync Protocol</Text>
                <Text style={styles.roadmapDesc}>Direct integration with university student database for auto-verification.</Text>
             </View>
          </View>
          <View style={styles.roadmapItem}>
             <Ionicons name="scan-outline" size={20} color={UNIVERSITY_RED} />
             <View style={styles.roadmapTextWrap}>
                <Text style={styles.roadmapTitle}>Biometric Facial Auth</Text>
                <Text style={styles.roadmapDesc}>AI-driven face matching for enhanced identity security.</Text>
             </View>
          </View>
        </View>

        {/* VERSION LOGS */}
        <Text style={styles.sectionLabel}>Active Protocols</Text>
        {versionLogs.map((log, index) => (
          <View key={index} style={styles.logCard}>
            <View style={styles.logHeader}>
              <View>
                <Text style={styles.logVersion}>{log.version}</Text>
                <Text style={styles.logHash}>SHA: {log.hash}</Text>
              </View>
              <View style={styles.logMeta}>
                <View style={styles.tagBadge}>
                  <Text style={styles.tagText}>{log.tag}</Text>
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

        <View style={styles.footer}>
          <Text style={styles.footerMain}>Laikipia e-Vote v1.0.0</Text>
          <Text style={styles.footerDev}>Developer: Gakenye Ndiritu</Text>
          <Text style={styles.footerSub}>Certified Software Engineer</Text>
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  topNav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, height: 70, backgroundColor: UNIVERSITY_WHITE,
    borderBottomWidth: 1, borderBottomColor: BORDER_COLOR,
  },
  navLeft: { flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 4 },
  headerTextGroup: { alignItems: 'center', flex: 1 },
  topNavTitle: { fontSize: 13, fontWeight: "900", color: "#1A1A1A", letterSpacing: 1, textTransform: 'uppercase' },
  topNavSub: { fontSize: 8, color: UNIVERSITY_RED, fontWeight: '700', marginTop: 2 },
  activityBtn: { padding: 8 },
  
  container: { padding: 20 },

  heroSection: { alignItems: 'center', marginBottom: 30 },
  vCircleContainer: { marginBottom: 15, justifyContent: 'center', alignItems: 'center' },
  logoContainer: {
    width: 90, height: 90, borderRadius: 25,
    backgroundColor: UNIVERSITY_WHITE,
    justifyContent: "center", alignItems: "center", zIndex: 2,
    borderWidth: 1, borderColor: BORDER_COLOR,
    elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10
  },
  mainCisluLogo: { width: 70, height: 70, resizeMode: 'contain' },
  pulseRing: {
    position: 'absolute', width: 110, height: 110, borderRadius: 32,
    backgroundColor: 'rgba(211, 47, 47, 0.08)',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  heroLogo: { width: 32, height: 32, resizeMode: 'contain' },
  appName: { fontSize: 22, fontWeight: "900", color: "#1A1A1A" },
  versionBadge: {
    backgroundColor: "#1A1A1A", paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 8, marginTop: 12,
  },
  versionNumber: { color: UNIVERSITY_WHITE, fontWeight: "800", fontSize: 11 },
  buildInfo: { fontSize: 10, color: "#999", marginTop: 8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  statGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statItem: { 
    backgroundColor: UNIVERSITY_WHITE, width: (width - 60) / 3, 
    padding: 12, borderRadius: 16, borderWidth: 1, borderColor: BORDER_COLOR,
    alignItems: 'center', elevation: 1
  },
  statLabel: { fontSize: 8, fontWeight: '800', color: '#999', marginBottom: 4 },
  statValue: { fontSize: 10, fontWeight: '900', color: '#333' },

  sectionLabel: { fontSize: 12, fontWeight: "900", color: "#BBB", marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1.2 },
  
  detailedCard: {
    backgroundColor: UNIVERSITY_WHITE, padding: 18, borderRadius: 24,
    borderWidth: 1, borderColor: BORDER_COLOR, marginBottom: 25,
  },
  stackRow: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  stackLabel: { fontSize: 12, color: "#888", width: 85, fontWeight: '600' },
  stackValue: { fontSize: 12, color: "#333", fontWeight: "700", flex: 1 },

  roadmapCard: { 
    backgroundColor: '#FFF9F9', padding: 20, borderRadius: 24, 
    borderWidth: 1, borderColor: UNIVERSITY_RED, borderStyle: 'dashed', marginBottom: 25 
  },
  roadmapItem: { flexDirection: 'row', marginBottom: 15, gap: 12 },
  roadmapTextWrap: { flex: 1 },
  roadmapTitle: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A' },
  roadmapDesc: { fontSize: 12, color: '#666', lineHeight: 18, marginTop: 2 },

  logCard: {
    backgroundColor: UNIVERSITY_WHITE, borderRadius: 24, padding: 18, marginBottom: 15,
    borderWidth: 1, borderColor: BORDER_COLOR,
  },
  logHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  logVersion: { fontSize: 16, fontWeight: "900", color: "#1A1A1A" },
  logHash: { fontSize: 10, color: UNIVERSITY_RED, fontFamily: 'monospace' },
  logMeta: { alignItems: 'flex-end' },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 4, backgroundColor: '#E8F5E9' },
  tagText: { fontSize: 9, fontWeight: "900", textTransform: "uppercase", color: '#2E7D32' },
  logDate: { fontSize: 11, color: "#999", fontWeight: '600' },
  logBody: { borderTopWidth: 1, borderTopColor: "#F5F5F5", paddingTop: 12 },
  changeRow: { flexDirection: 'row', marginBottom: 8 },
  bullet: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: UNIVERSITY_RED, marginTop: 6, marginRight: 10 },
  changeText: { fontSize: 13, color: "#555", flex: 1, lineHeight: 18 },

  footer: { marginTop: 40, alignItems: "center" },
  footerMain: { fontSize: 11, color: "#1A1A1A", fontWeight: "900", letterSpacing: 1 },
  footerDev: { fontSize: 12, color: UNIVERSITY_RED, marginTop: 4, fontWeight: "900" },
  footerSub: { fontSize: 10, color: "#666", fontWeight: '600' },
});