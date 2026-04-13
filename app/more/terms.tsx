import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  StatusBar,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  Ionicons, 
  MaterialCommunityIcons, 
  Octicons 
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Toast from 'react-native-toast-message';

const UNIVERSITY_RED = "#D32F2F";
const UNIVERSITY_WHITE = "#FFFFFF";
const DARK_NAVY = "#1A237E";
const BORDER_COLOR = "#F0F0F0";
const DISABLED_GREY = "#BDBDBD";

export default function TermsOfServicePage() {
  const navigation = useNavigation();
  const [hasReadToBottom, setHasReadToBottom] = useState(false);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
    
    if (isCloseToBottom && !hasReadToBottom) {
      setHasReadToBottom(true);
      Toast.show({
        type: 'success',
        text1: 'Terms Reviewed',
        text2: 'The agreement button is now active.',
        position: 'bottom'
      });
    }
  };

  const handleAccept = () => {
    if (hasReadToBottom) {
      navigation.navigate('VotingDashboard' as never);
    } else {
      Toast.show({
        type: 'info',
        text1: 'Attention',
        text2: 'Please scroll to the bottom to accept the terms.',
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={UNIVERSITY_WHITE} />
      
      {/* BRANDED HEADER */}
      <View style={styles.topNav}>
        <View style={styles.navLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={26} color={UNIVERSITY_RED} />
          </TouchableOpacity>
          
          <View style={styles.brandContainer}>
            <Image 
              source={require('@/assets/images/Laikipia-logo.png')} 
              style={styles.navLogo} 
            />
            <View style={styles.headerTextGroup}>
              <Text style={styles.topNavTitle}>Legal Framework</Text>
              <Text style={styles.topNavSub}>LU-EVOTE-TERMS-2026</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.helpIconButton} onPress={() => Linking.openURL('mailto:support@laikipia.ac.ke')}>
          <MaterialCommunityIcons name="help-circle-outline" size={24} color={UNIVERSITY_RED} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        
        {/* EXECUTIVE HEADER CARD */}
        <View style={styles.headerSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarInner}>
              <MaterialCommunityIcons name="gavel" size={36} color={UNIVERSITY_WHITE} />
            </View>
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="shield-check" size={24} color="#C5A059" />
            </View>
          </View>
          <Text style={styles.docName}>Terms of Service</Text>
          <Text style={styles.docSubLabel}>Laikipia University E-Vote</Text>
          
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Legally Binding</Text>
            </View>
            <Text style={styles.refText}>Ref: LU/UEC/2026/01</Text>
          </View>
        </View>

        {/* BINDING NOTICE CARD */}
        <View style={styles.bioCard}>
          <Octicons name="info" size={18} color={UNIVERSITY_RED} style={{ marginBottom: 10 }} />
          <Text style={styles.bioText}>
            By accessing the system via your Student ID, you acknowledge that any electoral malpractice is a violation of University Statutes and the Data Protection Act.
          </Text>
        </View>

        {/* LEGAL PILLARS GRID */}
        <SectionHeader title="Core Regulations" />
        <View style={styles.legalGrid}>
          <LegalBox icon="account-key" label="Identity" sub="SSO Auth Required" color="#24292e" />
          <LegalBox icon="vote" label="Integrity" sub="1 Student = 1 Vote" color="#0077b5" />
          <LegalBox icon="incognito" label="Anonymity" sub="Zero Traceability" color="#2E7D32" />
          <LegalBox icon="gavel" label="Conduct" sub="Statute Compliance" color="#E1306C" />
        </View>

        {/* DETAILED TERMS */}
        <SectionHeader title="Detailed Clauses" />
        <View style={styles.expertiseGrid}>
            <ExpertiseCard 
              icon="account-check" 
              title="Eligibility" 
              desc="Strictly limited to currently enrolled students with valid portal credentials." 
            />
            <ExpertiseCard 
              icon="database-lock" 
              title="Data Privacy" 
              desc="Individual choices are encrypted and decoupled from Student IDs in final logs." 
            />
            <ExpertiseCard 
              icon="alert-octagon" 
              title="Fraud Control" 
              desc="Attempts to bypass system limits via scripts or bots will lead to immediate lockout." 
            />
            <ExpertiseCard 
              icon="file-certificate" 
              title="Finality" 
              desc="Results are provisional until audited and ratified by the University Senate." 
            />
        </View>

        {/* VOTER OATH */}
        <SectionHeader title="Voter Declaration" />
        <View style={styles.milestoneCard}>
            <MilestoneRow text="I affirm that I am the sole authorized user of these credentials." />
            <MilestoneRow text="I shall exercise my democratic right free from coercion or external influence." />
        </View>

        {/* ACCEPT BUTTON */}
        <TouchableOpacity 
          style={[styles.acceptButton, !hasReadToBottom && styles.disabledButton]} 
          onPress={handleAccept}
          activeOpacity={0.8}
        >
          <Text style={styles.acceptButtonText}>
            {hasReadToBottom ? "I ACCEPT & CONTINUE" : "SCROLL TO READ TERMS"}
          </Text>
          {hasReadToBottom && <Ionicons name="chevron-forward" size={20} color={UNIVERSITY_WHITE} style={{marginLeft: 8}} />}
        </TouchableOpacity>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerBrand}>LAIKIPIA UNIVERSITY ELECTORAL COMMISSION</Text>
          <Text style={styles.footerSub}>SYSTEM SECURED BY GAKENYE NDIRITU • © 2026</Text>
        </View>

      </ScrollView>
      <Toast />
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

const LegalBox = ({ icon, label, sub, color }: any) => (
  <View style={styles.socialBox}>
    <View style={[styles.iconCircle, { backgroundColor: color }]}>
      <MaterialCommunityIcons name={icon} size={18} color={UNIVERSITY_WHITE} />
    </View>
    <View style={styles.socialTextContainer}>
        <Text style={styles.socialLabel}>{label}</Text>
        <Text style={styles.socialSubLabel}>{sub}</Text>
    </View>
  </View>
);

const ExpertiseCard = ({ icon, title, desc }: any) => (
  <View style={styles.expertiseCard}>
    <View style={styles.expertiseIconBg}>
      <MaterialCommunityIcons name={icon} size={22} color={UNIVERSITY_RED} />
    </View>
    <Text style={styles.expertiseTitle}>{title}</Text>
    <Text style={styles.expertiseDetail}>{desc}</Text>
  </View>
);

const MilestoneRow = ({ text }: { text: string }) => (
  <View style={styles.milestoneRow}>
    <Ionicons name="checkmark-done-circle" size={20} color={UNIVERSITY_RED} style={{ marginTop: 2 }} />
    <Text style={styles.milestoneText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  topNav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, height: 75, backgroundColor: UNIVERSITY_WHITE,
    borderBottomWidth: 1, borderBottomColor: BORDER_COLOR,
  },
  navLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backButton: { padding: 4, marginRight: 6 },
  
  brandContainer: { flexDirection: 'row', alignItems: 'center' },
  navLogo: { width: 38, height: 38, resizeMode: 'contain', marginRight: 10 },
  headerTextGroup: { justifyContent: 'center' },
  topNavTitle: { fontSize: 13, fontWeight: "900", color: "#1A1A1A", letterSpacing: 0.3, textTransform: 'uppercase' },
  topNavSub: { fontSize: 8, color: UNIVERSITY_RED, fontWeight: '700', marginTop: 1 },
  
  helpIconButton: { padding: 8 },
  
  container: { padding: 20, paddingBottom: 60 },

  headerSection: { alignItems: 'center', marginBottom: 25 },
  avatarWrapper: { marginBottom: 15, position: 'relative' },
  avatarInner: { 
    width: 80, height: 80, borderRadius: 28, backgroundColor: DARK_NAVY, 
    justifyContent: 'center', alignItems: 'center',
  },
  verifiedBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#FFF', borderRadius: 15, padding: 2 },
  docName: { fontSize: 24, fontWeight: "900", color: "#111", letterSpacing: -0.5 },
  docSubLabel: { fontSize: 13, color: UNIVERSITY_RED, fontWeight: "700", marginTop: 4, textTransform: 'uppercase' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF2F2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: UNIVERSITY_RED, marginRight: 8 },
  statusText: { fontSize: 11, fontWeight: '800', color: UNIVERSITY_RED },
  refText: { fontSize: 12, color: '#999', marginLeft: 15, fontWeight: '600' },

  bioCard: { backgroundColor: UNIVERSITY_WHITE, padding: 20, borderRadius: 24, marginBottom: 35, borderWidth: 1, borderColor: BORDER_COLOR },
  bioText: { fontSize: 14, color: '#4F4F4F', fontStyle: 'italic', lineHeight: 22 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "900", color: "#222", textTransform: 'uppercase', letterSpacing: 0.5 },
  titleLine: { flex: 1, height: 1, backgroundColor: '#EEE', marginLeft: 15 },

  legalGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  socialBox: { 
    width: '48%', backgroundColor: UNIVERSITY_WHITE, padding: 12, borderRadius: 20, 
    flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: BORDER_COLOR 
  },
  iconCircle: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  socialTextContainer: { marginLeft: 10, flex: 1 },
  socialLabel: { fontSize: 13, fontWeight: '800', color: '#1A1A1A' },
  socialSubLabel: { fontSize: 9, color: '#AAA', marginTop: 1 },

  expertiseGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  expertiseCard: { width: '48%', backgroundColor: '#FFF', padding: 18, borderRadius: 24, marginBottom: 15, borderWidth: 1, borderColor: BORDER_COLOR },
  expertiseIconBg: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  expertiseTitle: { fontSize: 14, fontWeight: '800', color: '#111' },
  expertiseDetail: { fontSize: 11, color: '#777', marginTop: 5, lineHeight: 16 },

  milestoneCard: { backgroundColor: UNIVERSITY_WHITE, padding: 24, borderRadius: 28, borderWidth: 1, borderColor: BORDER_COLOR, marginBottom: 30 },
  milestoneRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start', gap: 12 },
  milestoneText: { flex: 1, fontSize: 13, color: '#444', fontWeight: '500', lineHeight: 20 },

  acceptButton: { 
    backgroundColor: UNIVERSITY_RED, flexDirection: 'row', height: 60, 
    borderRadius: 24, justifyContent: 'center', alignItems: 'center', 
    marginTop: 10, elevation: 4, shadowColor: UNIVERSITY_RED, shadowOpacity: 0.2, shadowRadius: 10
  },
  disabledButton: { backgroundColor: DISABLED_GREY, shadowOpacity: 0, elevation: 0 },
  acceptButtonText: { color: UNIVERSITY_WHITE, fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },

  footer: { marginTop: 40, alignItems: 'center' },
  footerDivider: { width: 40, height: 3, backgroundColor: UNIVERSITY_RED, borderRadius: 2, marginBottom: 15 },
  footerBrand: { fontSize: 10, fontWeight: '900', color: '#333', letterSpacing: 1, textAlign: 'center' },
  footerSub: { fontSize: 9, color: '#BBB', marginTop: 6, fontWeight: '700' }
});