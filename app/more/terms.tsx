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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // Using this for better notch handling
import { Ionicons, MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Toast from 'react-native-toast-message';

const UNIVERSITY_RED = "#D32F2F";
const UNIVERSITY_WHITE = "#FFFFFF";
const DARK_NAVY = "#1A237E";
const BORDER_COLOR = "#E0E0E0";
const DISABLED_GREY = "#BDBDBD";

export default function TermsOfServicePage() {
  const navigation = useNavigation();
  const [hasReadToBottom, setHasReadToBottom] = useState(false);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    // Check if user is near the bottom
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    
    if (isCloseToBottom && !hasReadToBottom) {
      setHasReadToBottom(true);
      Toast.show({
        type: 'success',
        text1: 'Terms Reviewed',
        text2: 'The agreement button is now active.',
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
      
      {/* NAVIGATION HEADER - Exact Mirror of Profile Style */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={UNIVERSITY_RED} />
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>Legal Framework</Text>
        <TouchableOpacity style={styles.shareIconButton} onPress={() => Linking.openURL('mailto:support@laikipia.ac.ke')}>
          <MaterialCommunityIcons name="help-circle-outline" size={22} color={UNIVERSITY_RED} />
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
          <Text style={styles.devName}>Terms of Service</Text>
          <Text style={styles.devRole}>Laikipia University E-Vote</Text>
          
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Legally Binding</Text>
            </View>
            <Text style={styles.locationText}>Ref: LU/UEC/2026/01</Text>
          </View>
        </View>

        {/* BINDING NOTICE CARD */}
        <View style={styles.bioCard}>
          <Octicons name="info" size={18} color={UNIVERSITY_RED} style={{ marginBottom: 10 }} />
          <Text style={styles.bioText}>
            This document governs the use of the Laikipia E-Vote platform. By accessing the system via your Student ID, you acknowledge that any electoral malpractice is a violation of University Statutes.
          </Text>
        </View>

        {/* LEGAL PILLARS GRID */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Core Regulations</Text>
          <View style={styles.titleLine} />
        </View>
        
        <View style={styles.socialGrid}>
          <LegalBox icon="account-key" label="Identity" sub="SSO Auth Required" color="#24292e" />
          <LegalBox icon="vote" label="Integrity" sub="1 Student = 1 Vote" color="#0077b5" />
          <LegalBox icon="incognito" label="Anonymity" sub="Zero Traceability" color="#2E7D32" />
          <LegalBox icon="gavel" label="Conduct" sub="Statute Compliance" color="#E1306C" />
        </View>

        {/* DETAILED TERMS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Detailed Clauses</Text>
          <View style={styles.titleLine} />
        </View>
        <View style={styles.expertiseGrid}>
            <View style={styles.expertiseCard}>
              <View style={styles.expertiseIconBg}>
                <MaterialCommunityIcons name="account-check" size={24} color={UNIVERSITY_RED} />
              </View>
              <Text style={styles.expertiseTitle}>Eligibility</Text>
              <Text style={styles.expertiseDetail}>Strictly limited to currently enrolled students with valid portal credentials.</Text>
            </View>
            
            <View style={styles.expertiseCard}>
              <View style={styles.expertiseIconBg}>
                <MaterialCommunityIcons name="database-lock" size={24} color={UNIVERSITY_RED} />
              </View>
              <Text style={styles.expertiseTitle}>Data Privacy</Text>
              <Text style={styles.expertiseDetail}>Individual choices are encrypted and decoupled from Student IDs in final logs.</Text>
            </View>

            <View style={styles.expertiseCard}>
              <View style={styles.expertiseIconBg}>
                <MaterialCommunityIcons name="alert-octagon" size={24} color={UNIVERSITY_RED} />
              </View>
              <Text style={styles.expertiseTitle}>Fraud Control</Text>
              <Text style={styles.expertiseDetail}>Attempts to bypass system limits via scripts or bots will lead to immediate lockout.</Text>
            </View>

            <View style={styles.expertiseCard}>
              <View style={styles.expertiseIconBg}>
                <MaterialCommunityIcons name="file-certificate" size={24} color={UNIVERSITY_RED} />
              </View>
              <Text style={styles.expertiseTitle}>Finality</Text>
              <Text style={styles.expertiseDetail}>Results are provisional until audited and ratified by the University Senate.</Text>
            </View>
        </View>

        {/* VOTER OATH */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Voter Declaration</Text>
          <View style={styles.titleLine} />
        </View>
        <View style={styles.milestoneCard}>
            <View style={styles.milestoneRow}>
              <Ionicons name="checkmark-done-circle" size={20} color={UNIVERSITY_RED} style={{ marginTop: 2 }} />
              <Text style={styles.milestoneText}>I affirm that I am the sole authorized user of these credentials.</Text>
            </View>
            <View style={styles.milestoneRow}>
              <Ionicons name="checkmark-done-circle" size={20} color={UNIVERSITY_RED} style={{ marginTop: 2 }} />
              <Text style={styles.milestoneText}>I shall exercise my democratic right free from coercion or external influence.</Text>
            </View>
        </View>

        {/* ACCEPT BUTTON - Logic Added */}
        <TouchableOpacity 
          style={[styles.acceptButton, !hasReadToBottom && styles.disabledButton]} 
          onPress={handleAccept}
          activeOpacity={0.8}
        >
          <Text style={styles.acceptButtonText}>
            {hasReadToBottom ? "I ACCEPT & CONTINUE" : "SCROLL TO READ TERMS"}
          </Text>
          {hasReadToBottom && <Ionicons name="chevron-forward" size={20} color={UNIVERSITY_WHITE} style={{marginLeft: 5}} />}
        </TouchableOpacity>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerBrand}>LAIKIPIA UNIVERSITY ELECTORAL COMMISSION</Text>
          <Text style={styles.footerSub}>SYSTEM SECURED BY GAKENYE NDIRITU • © 2026</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FAFAFA" },
  topNav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: UNIVERSITY_WHITE,
    borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
  },
  backButton: { padding: 8, borderRadius: 12, backgroundColor: '#FFF2F2' },
  shareIconButton: { padding: 8 },
  topNavTitle: { fontSize: 13, fontWeight: "800", color: "#666", textTransform: 'uppercase', letterSpacing: 1.5 },
  
  container: { padding: 20, paddingBottom: 60 },

  headerSection: { alignItems: 'center', marginBottom: 25 },
  avatarWrapper: { marginBottom: 15, position: 'relative' },
  avatarInner: { 
    width: 86, height: 86, borderRadius: 30, backgroundColor: DARK_NAVY, 
    justifyContent: 'center', alignItems: 'center',
  },
  verifiedBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#FFF', borderRadius: 15, padding: 2 },
  devName: { fontSize: 26, fontWeight: "900", color: "#111", letterSpacing: -0.5 },
  devRole: { fontSize: 13, color: UNIVERSITY_RED, fontWeight: "700", marginTop: 4, textTransform: 'uppercase' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF2F2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: UNIVERSITY_RED, marginRight: 8 },
  statusText: { fontSize: 11, fontWeight: '800', color: UNIVERSITY_RED },
  locationText: { fontSize: 12, color: '#999', marginLeft: 15, fontWeight: '600' },

  bioCard: { backgroundColor: UNIVERSITY_WHITE, padding: 22, borderRadius: 24, marginBottom: 35, borderWidth: 1, borderColor: '#F0F0F0' },
  bioText: { fontSize: 14, color: '#4F4F4F', fontStyle: 'italic', lineHeight: 22 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: "900", color: "#222", textTransform: 'uppercase', letterSpacing: 0.5 },
  titleLine: { flex: 1, height: 1, backgroundColor: '#EEE', marginLeft: 15 },

  socialGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
  socialBox: { 
    width: '48%', backgroundColor: UNIVERSITY_WHITE, padding: 12, borderRadius: 20, 
    flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' 
  },
  iconCircle: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  socialTextContainer: { marginLeft: 10, flex: 1 },
  socialLabel: { fontSize: 13, fontWeight: '800', color: '#333' },
  socialSubLabel: { fontSize: 9, color: '#AAA', marginTop: 1 },

  expertiseGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
  expertiseCard: { width: '48%', backgroundColor: '#FFF', padding: 18, borderRadius: 24, marginBottom: 15, borderWidth: 1, borderColor: '#F0F0F0' },
  expertiseIconBg: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  expertiseTitle: { fontSize: 14, fontWeight: '800', color: '#111' },
  expertiseDetail: { fontSize: 11, color: '#777', marginTop: 5, lineHeight: 16 },

  milestoneCard: { backgroundColor: UNIVERSITY_WHITE, padding: 24, borderRadius: 28, borderWidth: 1, borderColor: '#F0F0F0', marginBottom: 30 },
  milestoneRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start', gap: 12 },
  milestoneText: { flex: 1, fontSize: 13, color: '#444', fontWeight: '500', lineHeight: 20 },

  /* NEW ACCEPT BUTTON STYLES */
  acceptButton: { 
    backgroundColor: UNIVERSITY_RED, 
    flexDirection: 'row',
    height: 56, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 10,
    shadowColor: UNIVERSITY_RED,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  disabledButton: { backgroundColor: DISABLED_GREY, shadowOpacity: 0, elevation: 0 },
  acceptButtonText: { color: UNIVERSITY_WHITE, fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },

  footer: { marginTop: 40, alignItems: 'center' },
  footerDivider: { width: 40, height: 3, backgroundColor: UNIVERSITY_RED, borderRadius: 2, marginBottom: 15 },
  footerBrand: { fontSize: 10, fontWeight: '900', color: '#333', letterSpacing: 1, textAlign: 'center' },
  footerSub: { fontSize: 9, color: '#BBB', marginTop: 6, fontWeight: '600' }
});