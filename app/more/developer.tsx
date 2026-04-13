import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Share,
  Image,
  StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5, MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from 'react-native-toast-message';
import * as Animatable from 'react-native-animatable';

const UNIVERSITY_RED = "#D32F2F";
const UNIVERSITY_WHITE = "#FFFFFF";
const DARK_NAVY = "#1A237E";
const BORDER_COLOR = "#F1F5F9";

const DEVELOPER_DATA = {
  name: "Gakenye Ndiritu",
  role: "Lead Software Engineer",
  email: "brayogakenye04@gmail.com",
  phone: "254789757457", // Standardized for calling
  website: "https://gakenye-ndiritu.netlify.app",
  location: "Nairobi, Kenya",
  bio: "Architecting scalable mobile ecosystems and decentralized voting protocols. Focused on seamless UX, robust back-end logic, and blockchain transparency.",
  expertise: [
    { skill: "Mobile", detail: "React Native, Expo, Flutter", icon: "cellphone-link" },
    { skill: "Frontend", detail: "React.js, Next.js, Tailwind", icon: "xml" },
    { skill: "Backend", detail: "Node.js, PERN Stack, RTK", icon: "api" },
    { skill: "Blockchain", detail: "Solidity, Sepolia, DApps", icon: "ethereum" },
  ],
  achievements: [
    "Architected the Laikipia University Digital Election System.",
    "Improved API response times by 40% via logic optimization.",
    "Successfully deployed 10+ full-stack production apps.",
  ],
  socials: {
    github: "https://github.com/gakenye8741",
    linkedin: "https://linkedin.com/in/gakenye8741",
    whatsapp: "https://wa.me/254789757457",
    instagram: "https://instagram.com/itsgakenye",
  }
};

export default function CombinedProfilePage() {
  const router = useRouter();

  const handleLink = (url: string) => {
    Linking.openURL(url).catch(() => Toast.show({ type: 'error', text1: 'System Error', text2: 'Could not open secure link' }));
  };

  const onShare = async () => {
    try {
      await Share.share({ message: `Connect with Engineer ${DEVELOPER_DATA.name}: ${DEVELOPER_DATA.website}` });
    } catch (e) { console.error(e); }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* NAVBAR */}
      <View style={styles.navbar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backChevron}>
             <Ionicons name="chevron-back" size={26} color={UNIVERSITY_RED} />
          </TouchableOpacity>
          <Image source={require('@/assets/images/Laikipia-logo.png')} style={styles.logo} />
          <View>
            <Text style={styles.headerTitle}>Engineer Profile</Text>
            <Text style={styles.headerSub}>IDENT_VERIFIED_SECURE</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
            <Ionicons name="share-social-outline" size={22} color={UNIVERSITY_RED} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* EXECUTIVE IDENTITY CARD */}
        <Animatable.View animation="fadeInDown" duration={800} style={styles.headerSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarInner}>
              <MaterialCommunityIcons name="shield-account-variant" size={40} color={UNIVERSITY_WHITE} />
            </View>
            <Animatable.View animation="pulse" iterationCount="infinite" style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="check-decagram" size={26} color="#00B0FF" />
            </Animatable.View>
          </View>
          <Text style={styles.devName}>{DEVELOPER_DATA.name}</Text>
          <Text style={styles.devRole}>{DEVELOPER_DATA.role}</Text>
          
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>ENCRYPTED_SESSION_ACTIVE</Text>
            </View>
            <Text style={styles.locationText}>📍 {DEVELOPER_DATA.location}</Text>
          </View>
        </Animatable.View>

        {/* QUICK CONTACT ACTIONS */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryAction} onPress={() => handleLink(`mailto:${DEVELOPER_DATA.email}`)}>
            <Ionicons name="mail-unread" size={20} color={UNIVERSITY_WHITE} />
            <Text style={styles.primaryActionText}>Send Secure Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryAction} onPress={() => Linking.openURL(`tel:${DEVELOPER_DATA.phone}`)}>
            <Ionicons name="call-outline" size={22} color={UNIVERSITY_RED} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryAction} onPress={() => handleLink(DEVELOPER_DATA.website)}>
            <Ionicons name="globe-outline" size={22} color={UNIVERSITY_RED} />
          </TouchableOpacity>
        </View>

        {/* BIO CARD */}
        <View style={styles.bioCard}>
          <Octicons name="terminal" size={18} color={UNIVERSITY_RED} style={{ marginBottom: 12 }} />
          <Text style={styles.bioText}>{DEVELOPER_DATA.bio}</Text>
        </View>

        {/* DIGITAL FOOTPRINT GRID */}
        <Text style={styles.sectionHeading}>Digital Footprint</Text>
        <View style={styles.socialGrid}>
          <SocialBox icon="github" label="GitHub" sub="vcs.repo" color="#111" onPress={() => handleLink(DEVELOPER_DATA.socials.github)} />
          <SocialBox icon="linkedin" label="LinkedIn" sub="prof.connect" color="#0077b5" onPress={() => handleLink(DEVELOPER_DATA.socials.linkedin)} />
          <SocialBox icon="whatsapp" label="WhatsApp" sub="direct.msg" color="#25D366" onPress={() => handleLink(DEVELOPER_DATA.socials.whatsapp)} />
          <SocialBox icon="instagram" label="Instagram" sub="life.dev" color="#E1306C" onPress={() => handleLink(DEVELOPER_DATA.socials.instagram)} />
        </View>

        {/* TECHNICAL STACK */}
        <Text style={styles.sectionHeading}>Technical Stack</Text>
        <View style={styles.expertiseGrid}>
          {DEVELOPER_DATA.expertise.map((item, index) => (
            <Animatable.View animation="fadeInUp" delay={index * 100} key={index} style={styles.expertiseCard}>
              <View style={styles.expertiseIconBg}>
                <MaterialCommunityIcons name={item.icon as any} size={24} color={UNIVERSITY_RED} />
              </View>
              <Text style={styles.expertiseTitle}>{item.skill}</Text>
              <Text style={styles.expertiseDetail}>{item.detail}</Text>
            </Animatable.View>
          ))}
        </View>

        {/* MILESTONES */}
        <Text style={styles.sectionHeading}>Core Achievements</Text>
        <View style={styles.milestoneCard}>
          {DEVELOPER_DATA.achievements.map((ach, index) => (
            <View key={index} style={styles.milestoneRow}>
              <View style={styles.milestoneDot} />
              <Text style={styles.milestoneText}>{ach}</Text>
            </View>
          ))}
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.signatureLine} />
          <Text style={styles.footerBrand}>GAKENYE NDIRITU • ARCHITECT</Text>
          <Text style={styles.footerSub}>SYSTEM BUILD v1.0.4 • © 2026</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const SocialBox = ({ icon, label, sub, color, onPress }: any) => (
  <TouchableOpacity style={styles.socialBox} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.iconCircle, { backgroundColor: color }]}>
      <FontAwesome5 name={icon} size={18} color={UNIVERSITY_WHITE} />
    </View>
    <View style={styles.socialTextContainer}>
        <Text style={styles.socialLabel}>{label}</Text>
        <Text style={styles.socialSubLabel}>{sub}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FAFAFA" },
  
  // NAVBAR
  navbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, height: 75, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee", elevation: 2 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backChevron: { marginRight: 8, padding: 4 },
  logo: { width: 40, height: 40, resizeMode: 'contain', marginRight: 10 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: UNIVERSITY_RED, textTransform: 'uppercase' },
  headerSub: { fontSize: 9, color: '#999', fontWeight: 'bold', letterSpacing: 0.5 },
  shareBtn: { padding: 10 },
  
  container: { padding: 20 },

  /* HEADER */
  headerSection: { alignItems: 'center', marginVertical: 20 },
  avatarWrapper: { marginBottom: 15, position: 'relative' },
  avatarInner: { 
    width: 90, height: 90, borderRadius: 32, backgroundColor: DARK_NAVY, 
    justifyContent: 'center', alignItems: 'center',
    shadowColor: DARK_NAVY, shadowOpacity: 0.2, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }
  },
  verifiedBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#FFF', borderRadius: 20, padding: 2 },
  devName: { fontSize: 30, fontWeight: "900", color: "#111", letterSpacing: -0.8 },
  devRole: { fontSize: 13, color: UNIVERSITY_RED, fontWeight: "800", marginTop: 5, textTransform: 'uppercase', letterSpacing: 1.5 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50', marginRight: 8 },
  statusText: { fontSize: 9, fontWeight: '900', color: '#475569', letterSpacing: 0.5 },
  locationText: { fontSize: 11, color: '#94A3B8', marginLeft: 15, fontWeight: '700' },

  /* ACTIONS */
  actionRow: { flexDirection: 'row', gap: 10, marginVertical: 25 },
  primaryAction: { flex: 2, backgroundColor: DARK_NAVY, flexDirection: 'row', height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  primaryActionText: { color: UNIVERSITY_WHITE, fontWeight: '800', marginLeft: 10, fontSize: 14, textTransform: 'uppercase' },
  secondaryAction: { flex: 0.6, backgroundColor: UNIVERSITY_WHITE, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: BORDER_COLOR },

  /* BIO */
  bioCard: { backgroundColor: UNIVERSITY_WHITE, padding: 22, borderRadius: 28, marginBottom: 35, borderWidth: 1, borderColor: '#F1F5F9' },
  bioText: { fontSize: 14, color: '#475569', lineHeight: 22, fontWeight: '500' },

  sectionHeading: { fontSize: 14, fontWeight: "900", color: "#1E293B", textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15, marginLeft: 5 },

  /* SOCIAL GRID */
  socialGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
  socialBox: { 
    width: '48%', backgroundColor: UNIVERSITY_WHITE, padding: 12, borderRadius: 22, 
    flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: BORDER_COLOR 
  },
  iconCircle: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  socialTextContainer: { marginLeft: 10 },
  socialLabel: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
  socialSubLabel: { fontSize: 9, color: '#94A3B8', marginTop: 1, fontWeight: '700' },

  /* EXPERTISE */
  expertiseGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
  expertiseCard: { width: '48%', backgroundColor: '#FFF', padding: 20, borderRadius: 28, marginBottom: 15, borderWidth: 1, borderColor: BORDER_COLOR, elevation: 2, shadowColor: '#000', shadowOpacity: 0.02 },
  expertiseIconBg: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FDF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  expertiseTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  expertiseDetail: { fontSize: 10, color: '#64748B', marginTop: 5, lineHeight: 15, fontWeight: '600' },

  /* MILESTONES */
  milestoneCard: { backgroundColor: UNIVERSITY_WHITE, padding: 24, borderRadius: 30, borderWidth: 1, borderColor: BORDER_COLOR },
  milestoneRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'center', gap: 15 },
  milestoneDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: UNIVERSITY_RED },
  milestoneText: { flex: 1, fontSize: 13, color: '#475569', fontWeight: '600', lineHeight: 20 },

  /* FOOTER */
  footer: { marginTop: 40, alignItems: 'center' },
  signatureLine: { width: 35, height: 4, backgroundColor: UNIVERSITY_RED, borderRadius: 2, marginBottom: 15 },
  footerBrand: { fontSize: 10, fontWeight: '900', color: '#1E293B', letterSpacing: 1.5 },
  footerSub: { fontSize: 9, color: '#CBD5E1', marginTop: 6, fontWeight: '800' }
});