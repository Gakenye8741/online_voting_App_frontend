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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  Ionicons, 
  MaterialCommunityIcons, 
  Octicons, 
  Feather, 
  FontAwesome5 
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Toast from 'react-native-toast-message';

const UNIVERSITY_RED = "#D32F2F";
const UNIVERSITY_WHITE = "#FFFFFF";
const DARK_NAVY = "#1A237E";
const BORDER_COLOR = "#F0F0F0";
const DISABLED_GREY = "#BDBDBD";

export default function DetailedPrivacyPolicy() {
  const navigation = useNavigation();
  const [hasReadToBottom, setHasReadToBottom] = useState(false);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
    
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
      
      {/* BRANDED NAVIGATION HEADER */}
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
              <Text style={styles.topNavTitle}>Privacy & Governance</Text>
              <Text style={styles.topNavSub}>LU-EVOTE-SECURE-2026</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.shareIconButton} onPress={() => Linking.openURL('https://www.laikipia.ac.ke')}>
          <MaterialCommunityIcons name="shield-crown-outline" size={24} color={UNIVERSITY_RED} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.container} 
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
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
          <BulletPoint text="Academic Status: School, Department, and Current Year of Study." />
          <BulletPoint text="Security: IP and Device ID to prevent double-voting." />
        </View>

        {/* 2. THE SECRET BALLOT ARCHITECTURE */}
        <SectionHeader title="2. The 'Secret Ballot' Protocol" />
        <View style={styles.detailCard}>
          <Text style={styles.bodyText}>
            To ensure constitutional compliance, we employ a <Text style={styles.bold}>Decoupled Logic Architecture</Text>:
          </Text>
          <View style={styles.logicBox}>
            <MaterialCommunityIcons name="link-variant-off" size={20} color={UNIVERSITY_RED} />
            <Text style={styles.logicText}>
              Once you cast a vote, your Student ID is marked as "Voted," but your ballot is stored in a separate digital urn with zero link to your identity.
            </Text>
          </View>
        </View>

        {/* 5. USER RIGHTS */}
        <SectionHeader title="3. Your Digital Rights" />
        <View style={styles.expertiseGrid}>
          <GridItem icon="eye" title="Transparency" desc="View your eligibility status." />
          <GridItem icon="database-edit" title="Correction" desc="Update data via Registrar." />
          <GridItem icon="shield-off" title="Objection" desc="Withdraw consent at any time." />
          <GridItem icon="file-download" title="Portability" desc="Access your login history." />
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

const BulletPoint = ({ text }: { text: string }) => (
  <View style={styles.bulletRow}>
    <Octicons name="dot-fill" size={10} color={UNIVERSITY_RED} style={{ marginTop: 6 }} />
    <Text style={styles.bulletText}>{text}</Text>
  </View>
);

const GridItem = ({ icon, title, desc }: any) => (
  <View style={styles.gridCard}>
    <Feather name={icon} size={18} color={UNIVERSITY_RED} />
    <Text style={styles.gridTitle}>{title}</Text>
    <Text style={styles.gridDesc}>{desc}</Text>
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
  
  shareIconButton: { padding: 8 },

  container: { padding: 20, paddingBottom: 60 },

  headerSection: { alignItems: 'center', marginBottom: 30 },
  avatarInner: { 
    width: 70, height: 70, borderRadius: 24, backgroundColor: DARK_NAVY, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 15
  },
  devName: { fontSize: 22, fontWeight: "900", color: "#111" },
  devRole: { fontSize: 13, color: UNIVERSITY_RED, fontWeight: "700", marginTop: 4 },
  statusBadge: { backgroundColor: '#F0F0F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 12 },
  statusText: { fontSize: 9, fontWeight: '800', color: '#777', letterSpacing: 1 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "900", color: "#222", textTransform: 'uppercase' },
  titleLine: { flex: 1, height: 1, backgroundColor: '#EEE', marginLeft: 15 },

  detailCard: { backgroundColor: UNIVERSITY_WHITE, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: BORDER_COLOR },
  bodyText: { fontSize: 14, color: '#555', lineHeight: 22 },
  bold: { fontWeight: '800', color: '#222' },

  bulletRow: { flexDirection: 'row', marginTop: 12 },
  bulletText: { fontSize: 13, color: '#555', marginLeft: 10, lineHeight: 20, flex: 1 },

  logicBox: { backgroundColor: '#F8F9FA', padding: 15, borderRadius: 16, marginTop: 15, borderLeftWidth: 4, borderLeftColor: UNIVERSITY_RED },
  logicText: { fontSize: 12, color: '#444', fontStyle: 'italic', lineHeight: 18 },

  expertiseGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: { width: '48%', backgroundColor: UNIVERSITY_WHITE, padding: 18, borderRadius: 24, marginBottom: 15, borderWidth: 1, borderColor: BORDER_COLOR },
  gridTitle: { fontSize: 13, fontWeight: '900', color: '#222', marginTop: 10 },
  gridDesc: { fontSize: 10, color: '#777', marginTop: 5, lineHeight: 16 },

  acceptButton: { 
    backgroundColor: UNIVERSITY_RED, height: 60, borderRadius: 24, 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', 
    marginTop: 20, elevation: 4, shadowColor: UNIVERSITY_RED, shadowOpacity: 0.2, shadowRadius: 10
  },
  disabledButton: { backgroundColor: DISABLED_GREY, elevation: 0, shadowOpacity: 0 },
  acceptButtonText: { color: UNIVERSITY_WHITE, fontWeight: '900', fontSize: 15 },

  footer: { marginTop: 40, alignItems: 'center' },
  footerDivider: { width: 30, height: 2, backgroundColor: UNIVERSITY_RED, marginBottom: 15 },
  footerBrand: { fontSize: 10, fontWeight: '900', color: '#444', letterSpacing: 1 },
  footerSub: { fontSize: 9, color: '#999', marginTop: 5, fontWeight: '700' }
});