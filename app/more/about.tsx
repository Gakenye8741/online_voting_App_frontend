import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const UNIVERSITY_RED = "#D32F2F";
const UNIVERSITY_WHITE = "#FFFFFF";
const LIGHT_GRAY = "#F8F9FA";

export default function AboutPage() {
  const navigation = useNavigation();

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
        <Text style={styles.topNavTitle}>About Platform</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* HERO SECTION */}
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="shield-check" size={60} color={UNIVERSITY_RED} />
          </View>
          <Text style={styles.appTitle}>Laikipia E-Vote</Text>
          <Text style={styles.appTagline}>Integrity • Transparency • Efficiency</Text>
        </View>

        {/* MISSION STATEMENT */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.bodyText}>
            To revolutionize the student electoral process at Laikipia University by 
            providing a secure, accessible, and transparent digital voting environment. 
            We bridge the gap between technology and democracy for the next generation of leaders.
          </Text>
        </View>

        {/* CORE PILLARS GRID */}
        <Text style={styles.label}>System Core Pillars</Text>
        <View style={styles.pillarGrid}>
          <View style={styles.pillarItem}>
            <Ionicons name="finger-print" size={28} color={UNIVERSITY_RED} />
            <Text style={styles.pillarTitle}>Biometric Logic</Text>
            <Text style={styles.pillarDesc}>Ensuring one student, one vote via unique identifiers.</Text>
          </View>
          <View style={styles.pillarItem}>
            <MaterialCommunityIcons name="database-lock" size={28} color={UNIVERSITY_RED} />
            <Text style={styles.pillarTitle}>Encrypted</Text>
            <Text style={styles.pillarDesc}>End-to-end data protection and vault security.</Text>
          </View>
          <View style={styles.pillarItem}>
            <FontAwesome5 name="chart-line" size={22} color={UNIVERSITY_RED} />
            <Text style={styles.pillarTitle}>Real-time</Text>
            <Text style={styles.pillarDesc}>Instant, audited result tracking and analytics.</Text>
          </View>
          <View style={styles.pillarItem}>
            <Ionicons name="people" size={28} color={UNIVERSITY_RED} />
            <Text style={styles.pillarTitle}>Inclusive</Text>
            <Text style={styles.pillarDesc}>A UI designed for all students across campuses.</Text>
          </View>
        </View>

        {/* SECURITY TRANSPARENCY SECTION */}
        <View style={styles.securityCard}>
          <View style={styles.securityHeader}>
            <Ionicons name="lock-closed" size={18} color={UNIVERSITY_WHITE} />
            <Text style={styles.securityHeaderText}>SECURE PROTOCOL V1.0.4</Text>
          </View>
          <View style={styles.securityBody}>
            <Text style={styles.securityText}>
              • Multi-factor Student Authentication{"\n"}
              • Immutable Ledger Record Keeping{"\n"}
              • Advanced Anti-Tamper Algorithms{"\n"}
              • Real-time Fraud Detection Layers
            </Text>
          </View>
        </View>

        {/* INSTITUTIONAL INFO */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Institutional Alignment</Text>
          <Text style={styles.bodyText}>
            This platform is strictly engineered to follow the Laikipia University 
            Student Organization (LUSO) constitution and the University's electoral guidelines 
            under the supervision of the Electoral Commission.
          </Text>
          
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkButtonText}>Read Electoral Guidelines</Text>
            <Ionicons name="open-outline" size={16} color={UNIVERSITY_RED} />
          </TouchableOpacity>
        </View>

        {/* DEVELOPER FOOTNOTE */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>
            Designed and Developed by{"\n"}
            <Text style={styles.devName}>Gakenye Ndiritu</Text>
          </Text>
          <Text style={styles.versionText}>System Build: PRODUCTION_STABLE_V1</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: UNIVERSITY_WHITE },
  
  /* TOP NAV STYLES */
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

  container: { padding: 20, paddingBottom: 40 },
  
  heroSection: { alignItems: 'center', marginVertical: 20 },
  iconContainer: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: '#FFF5F5', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 15
  },
  appTitle: { fontSize: 32, fontWeight: '900', color: '#1A1A1A' },
  appTagline: { fontSize: 13, color: UNIVERSITY_RED, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 5 },

  card: { 
    backgroundColor: LIGHT_GRAY, 
    padding: 22, 
    borderRadius: 24, 
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#EEE'
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 10 },
  bodyText: { fontSize: 14, color: '#555', lineHeight: 22 },

  label: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 15, marginLeft: 5 },
  pillarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  pillarItem: { 
    width: '48%', 
    backgroundColor: UNIVERSITY_WHITE, 
    padding: 18, 
    borderRadius: 20, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
      android: { elevation: 2 }
    })
  },
  pillarTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginTop: 10 },
  pillarDesc: { fontSize: 11, color: '#888', textAlign: 'center', marginTop: 6, lineHeight: 16 },

  securityCard: { backgroundColor: '#2D2D2D', borderRadius: 24, overflow: 'hidden', marginBottom: 25 },
  securityHeader: { 
    flexDirection: 'row', 
    backgroundColor: UNIVERSITY_RED, 
    padding: 14, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  securityHeaderText: { color: UNIVERSITY_WHITE, fontWeight: '800', fontSize: 11, marginLeft: 8, letterSpacing: 1.2 },
  securityBody: { padding: 22 },
  securityText: { color: '#BDBDBD', fontSize: 13, lineHeight: 26, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  infoSection: { marginBottom: 30 },
  linkButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 15, 
    borderWidth: 1.5, 
    borderColor: UNIVERSITY_RED, 
    paddingHorizontal: 16,
    paddingVertical: 12, 
    borderRadius: 14,
    alignSelf: 'flex-start'
  },
  linkButtonText: { color: UNIVERSITY_RED, fontWeight: '700', fontSize: 13, marginRight: 8 },

  footer: { alignItems: 'center', marginTop: 20 },
  footerLine: { width: 40, height: 4, backgroundColor: '#EEE', borderRadius: 2, marginBottom: 25 },
  footerText: { textAlign: 'center', fontSize: 12, color: '#999', lineHeight: 20 },
  devName: { color: '#444', fontWeight: '800' },
  versionText: { fontSize: 10, color: '#DDD', marginTop: 12, letterSpacing: 1 }
});