import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Octicons, Feather, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Toast from 'react-native-toast-message';

const UNIVERSITY_RED = "#D32F2F";
const UNIVERSITY_WHITE = "#FFFFFF";
const DARK_NAVY = "#1A237E";
const BORDER_COLOR = "#E0E0E0";
const DISABLED_GREY = "#BDBDBD";

export default function DetailedPrivacyPolicy() {
  const navigation = useNavigation();
  const [hasReadToBottom, setHasReadToBottom] = useState(false);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    
    if (isCloseToBottom && !hasReadToBottom) {
      setHasReadToBottom(true);
      Toast.show({
        type: 'success',
        text1: 'Verification Complete',
        text2: 'You have acknowledged the Data Protection Protocol.',
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={UNIVERSITY_WHITE} />
      
      {/* NAVIGATION HEADER */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={UNIVERSITY_RED} />
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>Privacy & Data Governance</Text>
        <TouchableOpacity style={styles.shareIconButton} onPress={() => Linking.openURL('https://www.laikipia.ac.ke')}>
          <MaterialCommunityIcons name="shield-crown-outline" size={24} color={UNIVERSITY_RED} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.container} 
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        
        {/* EXECUTIVE SUMMARY */}
        <View style={styles.headerSection}>
          <View style={styles.avatarInner}>
            <FontAwesome5 name="user-shield" size={32} color={UNIVERSITY_WHITE} />
          </View>
          <Text style={styles.devName}>Data Privacy Shield</Text>
          <Text style={styles.devRole}>Laikipia University Electoral Standard</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>OFFICIAL DOCUMENT • FEB 2026</Text>
          </View>
        </View>

        {/* 1. DATA COLLECTION & SOURCE */}
        <SectionHeader title="1. Data Origin & Scope" />
        <View style={styles.detailCard}>
          <Text style={styles.bodyText}>
            The Laikipia E-Vote system interfaces with the <Text style={styles.bold}>University Registrar Database (ERP)</Text>. We collect the following minimum data points:
          </Text>
          <BulletPoint text="Primary Identity: Full Name and Registration Number for SSO validation." />
          <BulletPoint text="Academic Status: School, Department, and Current Year of Study to determine constituency eligibility." />
          <BulletPoint text="Device Metadata: IP Address and Device ID to prevent double-voting and 'Sybil' attacks (bot networks)." />
        </View>

        {/* 2. THE SECRET BALLOT ARCHITECTURE */}
        <SectionHeader title="2. The 'Secret Ballot' Protocol" />
        <View style={styles.detailCard}>
          <Text style={styles.bodyText}>
            To ensure constitutional compliance, we employ a <Text style={styles.bold}>Decoupled Logic Architecture</Text>:
          </Text>
          <View style={styles.logicBox}>
            <MaterialCommunityIcons name="arrow-split-vertical" size={20} color={UNIVERSITY_RED} />
            <Text style={styles.logicText}>
              Once you cast a vote, the system generates two separate records: (A) A "Voted" flag on your profile to prevent re-entry, and (B) A standalone ballot entry with NO connection to your Student ID.
            </Text>
          </View>
        </View>

        {/* 3. LEGAL COMPLIANCE */}
        <SectionHeader title="3. Legal Framework" />
        <View style={styles.detailCard}>
          <Text style={styles.bodyText}>
            This application operates under the following jurisdictions:
          </Text>
          <BulletPoint text="Kenya Data Protection Act (2019): Ensuring Right to Privacy and Data Portability." />
          <BulletPoint text="University Statutes (Article VI): Governing the integrity of student elections." />
          <BulletPoint text="Cyber Crimes Act: Criminalizing unauthorized access or system manipulation." />
        </View>

        {/* 4. DATA RETENTION & DELETION */}
        <SectionHeader title="4. Retention Policy" />
        <View style={styles.detailCard}>
          <Text style={styles.bodyText}>
            Electoral data is categorized into two tiers:
          </Text>
          <Text style={[styles.bodyText, {marginTop: 8}]}>
            <Text style={styles.bold}>Tier 1 (Audit Logs):</Text> Retained for 90 days following the election to facilitate UEC disputes, after which they are purged.
          </Text>
          <Text style={styles.bodyText}>
            <Text style={styles.bold}>Tier 2 (Sensitive Identifiers):</Text> Immediately encrypted post-session and wiped within 48 hours of result ratification.
          </Text>
        </View>

        {/* 5. USER RIGHTS */}
        <SectionHeader title="5. Your Digital Rights" />
        <View style={styles.expertiseGrid}>
          <GridItem icon="eye" title="Transparency" desc="View your eligibility status at any time." />
          <GridItem icon="database-edit" title="Correction" desc="Request data updates via the Registrar." />
          <GridItem icon="shield-off" title="Objection" desc="Withdraw consent (forfeits voting rights)." />
          <GridItem icon="file-download" title="Portability" desc="Request a log of your login history." />
        </View>

        {/* ACKNOWLEDGMENT BUTTON */}
        <TouchableOpacity 
          style={[styles.acceptButton, !hasReadToBottom && styles.disabledButton]} 
          onPress={() => hasReadToBottom && navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.acceptButtonText}>
            {hasReadToBottom ? "I ACKNOWLEDGE & AGREE" : "SCROLL TO VERIFY READING"}
          </Text>
          {hasReadToBottom && <Ionicons name="shield-checkmark" size={20} color={UNIVERSITY_WHITE} style={{marginLeft: 10}} />}
        </TouchableOpacity>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerBrand}>ICT DIRECTORATE • DATA PROTECTION OFFICE</Text>
          <Text style={styles.footerSub}>SYSTEM ARCHITECT: GAKENYE NDIRITU • v1.0.4</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

/* HELPER COMPONENTS */
const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.titleLine} />
  </View>
);

const BulletPoint = ({ text }: { text: string }) => (
  <View style={styles.bulletRow}>
    <Octicons name="dot-fill" size={12} color={UNIVERSITY_RED} style={{ marginTop: 4 }} />
    <Text style={styles.bulletText}>{text}</Text>
  </View>
);

const GridItem = ({ icon, title, desc }: any) => (
  <View style={styles.gridCard}>
    <Feather name={icon} size={20} color={UNIVERSITY_RED} />
    <Text style={styles.gridTitle}>{title}</Text>
    <Text style={styles.gridDesc}>{desc}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FAFAFA" },
  topNav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 15, backgroundColor: UNIVERSITY_WHITE,
    borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
  },
  backButton: { padding: 8, borderRadius: 12, backgroundColor: '#FFF2F2' },
  topNavTitle: { fontSize: 13, fontWeight: "900", color: "#444", textTransform: 'uppercase', letterSpacing: 1 },
  shareIconButton: { padding: 8 },

  container: { padding: 20, paddingBottom: 60 },

  headerSection: { alignItems: 'center', marginBottom: 30 },
  avatarInner: { 
    width: 75, height: 75, borderRadius: 25, backgroundColor: DARK_NAVY, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 15
  },
  devName: { fontSize: 24, fontWeight: "900", color: "#111" },
  devRole: { fontSize: 13, color: UNIVERSITY_RED, fontWeight: "700", marginTop: 4 },
  statusBadge: { backgroundColor: '#F5F5F5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 12 },
  statusText: { fontSize: 10, fontWeight: '800', color: '#777', letterSpacing: 1 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  sectionTitle: { fontSize: 14, fontWeight: "900", color: "#222", textTransform: 'uppercase' },
  titleLine: { flex: 1, height: 1, backgroundColor: '#DDD', marginLeft: 15 },

  detailCard: { backgroundColor: UNIVERSITY_WHITE, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#EEE' },
  bodyText: { fontSize: 14, color: '#555', lineHeight: 22 },
  bold: { fontWeight: '700', color: '#222' },

  bulletRow: { flexDirection: 'row', marginTop: 12, paddingRight: 15 },
  bulletText: { fontSize: 13, color: '#555', marginLeft: 10, lineHeight: 20 },

  logicBox: { backgroundColor: '#F8F9FA', padding: 15, borderRadius: 12, marginTop: 15, borderLeftWidth: 4, borderLeftColor: UNIVERSITY_RED },
  logicText: { fontSize: 13, color: '#444', fontStyle: 'italic', lineHeight: 20 },

  expertiseGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: { width: '48%', backgroundColor: UNIVERSITY_WHITE, padding: 15, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#EEE' },
  gridTitle: { fontSize: 14, fontWeight: '800', color: '#222', marginTop: 10 },
  gridDesc: { fontSize: 11, color: '#777', marginTop: 5, lineHeight: 16 },

  acceptButton: { 
    backgroundColor: UNIVERSITY_RED, height: 60, borderRadius: 20, 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', 
    marginTop: 20, elevation: 4
  },
  disabledButton: { backgroundColor: DISABLED_GREY, elevation: 0 },
  acceptButtonText: { color: UNIVERSITY_WHITE, fontWeight: '900', fontSize: 15 },

  footer: { marginTop: 40, alignItems: 'center' },
  footerDivider: { width: 30, height: 2, backgroundColor: UNIVERSITY_RED, marginBottom: 15 },
  footerBrand: { fontSize: 10, fontWeight: '900', color: '#444', letterSpacing: 1 },
  footerSub: { fontSize: 9, color: '#999', marginTop: 5 }
});