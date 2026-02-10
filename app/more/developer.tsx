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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5, MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Toast from 'react-native-toast-message';

const UNIVERSITY_RED = "#D32F2F";
const UNIVERSITY_WHITE = "#FFFFFF";
const DARK_NAVY = "#1A237E";
const BORDER_COLOR = "#E0E0E0";

const DEVELOPER_DATA = {
  name: "Gakenye Ndiritu",
  role: "Lead Software Engineer",
  email: "brayogakenye04@gmail.com",
  phone: "089757457",
  website: "https://gakenye-ndiritu.netlify.app",
  location: "Nairobi, Kenya",
  bio: "A results-driven Software Engineer architecting scalable mobile and web ecosystems. Expert in modern JavaScript frameworks and cloud integrations, focusing on seamless user experiences and robust back-end logic.",
  expertise: [
    { skill: "Mobile", detail: "React Native, Expo, Flutter", icon: "cellphone-cog" },
    { skill: "Frontend", detail: "React.js, Next.js, Tailwind", icon: "layers-outline" },
    { skill: "Backend", detail: "Node.js, Express, RTK Query", icon: "database-settings" },
    { skill: "Cloud", detail: "Firebase, Azure, AWS", icon: "cloud-sync" },
  ],
  achievements: [
    "Architected the University Digital Election System.",
    "Improved API response times by 40% via optimization.",
    "Successfully deployed 10+ full-stack applications.",
  ],
  socials: {
    github: "https://github.com/gakenye8741",
    linkedin: "https://linkedin.com/in/gakenye8741",
    whatsapp: "https://wa.me/254789757457",
    instagram: "https://instagram.com/itsgakenye",
  }
};

export default function CombinedProfilePage() {
  const navigation = useNavigation();

  const handleLink = (url: string) => {
    Linking.openURL(url).catch(() => Toast.show({ type: 'error', text1: 'Could not open link' }));
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${DEVELOPER_DATA.email}`).catch(() => 
      Toast.show({ type: 'error', text1: 'Mail client not found' })
    );
  };

  const onShare = async () => {
    try {
      await Share.share({ message: `Connect with ${DEVELOPER_DATA.name}: ${DEVELOPER_DATA.website}` });
    } catch (e) { console.error(e); }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* NAVIGATION HEADER */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={UNIVERSITY_RED} />
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>Engineer Profile</Text>
        <TouchableOpacity style={styles.shareIconButton} onPress={onShare}>
          <Ionicons name="share-social-outline" size={22} color={UNIVERSITY_RED} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* EXECUTIVE HEADER CARD */}
        <View style={styles.headerSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarInner}>
              <FontAwesome5 name="user-astronaut" size={36} color={UNIVERSITY_WHITE} />
            </View>
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="check-decagram" size={24} color="#00B0FF" />
            </View>
          </View>
          <Text style={styles.devName}>{DEVELOPER_DATA.name}</Text>
          <Text style={styles.devRole}>{DEVELOPER_DATA.role}</Text>
          
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Active Now</Text>
            </View>
            <Text style={styles.locationText}>📍 {DEVELOPER_DATA.location}</Text>
          </View>
        </View>

        {/* QUICK CONTACT ACTIONS */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryAction} onPress={handleEmail}>
            <Ionicons name="mail" size={20} color={UNIVERSITY_WHITE} />
            <Text style={styles.primaryActionText}>Direct Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryAction} onPress={() => Linking.openURL(`tel:${DEVELOPER_DATA.phone}`)}>
            <Ionicons name="call-outline" size={22} color={UNIVERSITY_RED} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryAction} onPress={() => handleLink(DEVELOPER_DATA.website)}>
            <Ionicons name="globe-outline" size={22} color={UNIVERSITY_RED} />
          </TouchableOpacity>
        </View>

        {/* BIO SECTION */}
        <View style={styles.bioCard}>
          <Octicons name="quote" size={18} color={UNIVERSITY_RED} style={{ marginBottom: 10 }} />
          <Text style={styles.bioText}>{DEVELOPER_DATA.bio}</Text>
        </View>

        {/* SOCIAL LINKS GRID */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Digital Footprint</Text>
          <View style={styles.titleLine} />
        </View>
        
        <View style={styles.socialGrid}>
          <SocialBox icon="github" label="GitHub" sub="Source Code" color="#24292e" onPress={() => handleLink(DEVELOPER_DATA.socials.github)} />
          <SocialBox icon="linkedin" label="LinkedIn" sub="Professional" color="#0077b5" onPress={() => handleLink(DEVELOPER_DATA.socials.linkedin)} />
          <SocialBox icon="whatsapp" label="WhatsApp" sub="Instant Chat" color="#25D366" onPress={() => handleLink(DEVELOPER_DATA.socials.whatsapp)} />
          <SocialBox icon="instagram" label="Instagram" sub="Life & Tech" color="#E1306C" onPress={() => handleLink(DEVELOPER_DATA.socials.instagram)} />
        </View>

        {/* TECHNICAL EXPERTISE */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Technical Expertise</Text>
          <View style={styles.titleLine} />
        </View>
        <View style={styles.expertiseGrid}>
          {DEVELOPER_DATA.expertise.map((item, index) => (
            <View key={index} style={styles.expertiseCard}>
              <View style={styles.expertiseIconBg}>
                <MaterialCommunityIcons name={item.icon as any} size={24} color={UNIVERSITY_RED} />
              </View>
              <Text style={styles.expertiseTitle}>{item.skill}</Text>
              <Text style={styles.expertiseDetail}>{item.detail}</Text>
            </View>
          ))}
        </View>

        {/* PROJECT MILESTONES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Key Achievements</Text>
          <View style={styles.titleLine} />
        </View>
        <View style={styles.milestoneCard}>
          {DEVELOPER_DATA.achievements.map((ach, index) => (
            <View key={index} style={styles.milestoneRow}>
              <Ionicons name="ribbon" size={20} color={UNIVERSITY_RED} style={{ marginTop: 2 }} />
              <Text style={styles.milestoneText}>{ach}</Text>
            </View>
          ))}
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerBrand}>ENGINEERED BY GAKENYE NDIRITU</Text>
          <Text style={styles.footerSub}>SYSTEM VERSION 1.0.4 • © 2026</Text>
        </View>

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
  topNav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: UNIVERSITY_WHITE,
    borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
  },
  backButton: { padding: 8, borderRadius: 12, backgroundColor: '#FFF2F2' },
  shareIconButton: { padding: 8 },
  topNavTitle: { fontSize: 13, fontWeight: "800", color: "#666", textTransform: 'uppercase', letterSpacing: 1.5 },
  
  container: { padding: 20, paddingBottom: 60 },

  /* HEADER */
  headerSection: { alignItems: 'center', marginBottom: 25 },
  avatarWrapper: { marginBottom: 15, position: 'relative' },
  avatarInner: { 
    width: 86, height: 86, borderRadius: 30, backgroundColor: DARK_NAVY, 
    justifyContent: 'center', alignItems: 'center',
    shadowColor: DARK_NAVY, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }
  },
  verifiedBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#FFF', borderRadius: 15, padding: 2 },
  devName: { fontSize: 28, fontWeight: "900", color: "#111", letterSpacing: -0.5 },
  devRole: { fontSize: 14, color: UNIVERSITY_RED, fontWeight: "700", marginTop: 4, textTransform: 'uppercase' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFFFF4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#00C853', marginRight: 8 },
  statusText: { fontSize: 11, fontWeight: '800', color: '#1B5E20' },
  locationText: { fontSize: 12, color: '#999', marginLeft: 15, fontWeight: '600' },

  /* ACTIONS */
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  primaryAction: { flex: 2, backgroundColor: UNIVERSITY_RED, flexDirection: 'row', height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  primaryActionText: { color: UNIVERSITY_WHITE, fontWeight: '800', marginLeft: 10, fontSize: 15 },
  secondaryAction: { flex: 0.6, backgroundColor: UNIVERSITY_WHITE, height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: BORDER_COLOR },

  /* BIO */
  bioCard: { backgroundColor: UNIVERSITY_WHITE, padding: 22, borderRadius: 24, marginBottom: 35, borderWidth: 1, borderColor: '#F0F0F0' },
  bioText: { fontSize: 15, color: '#4F4F4F', fontStyle: 'italic', lineHeight: 24, fontWeight: '400' },

  /* SECTION HEADERS */
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: "#222", textTransform: 'uppercase', letterSpacing: 0.5 },
  titleLine: { flex: 1, height: 1, backgroundColor: '#EEE', marginLeft: 15 },

  /* SOCIAL GRID */
  socialGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
  socialBox: { 
    width: '48%', backgroundColor: UNIVERSITY_WHITE, padding: 12, borderRadius: 20, 
    flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' 
  },
  iconCircle: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  socialTextContainer: { marginLeft: 10 },
  socialLabel: { fontSize: 13, fontWeight: '800', color: '#333' },
  socialSubLabel: { fontSize: 10, color: '#AAA', marginTop: 1 },

  /* EXPERTISE */
  expertiseGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
  expertiseCard: { width: '48%', backgroundColor: '#FFF', padding: 18, borderRadius: 24, marginBottom: 15, borderWidth: 1, borderColor: '#F0F0F0' },
  expertiseIconBg: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  expertiseTitle: { fontSize: 15, fontWeight: '800', color: '#111' },
  expertiseDetail: { fontSize: 11, color: '#777', marginTop: 5, lineHeight: 16 },

  /* MILESTONES */
  milestoneCard: { backgroundColor: UNIVERSITY_WHITE, padding: 24, borderRadius: 28, borderWidth: 1, borderColor: '#F0F0F0' },
  milestoneRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start', gap: 12 },
  milestoneText: { flex: 1, fontSize: 14, color: '#444', fontWeight: '500', lineHeight: 20 },

  /* FOOTER */
  footer: { marginTop: 40, alignItems: 'center' },
  footerDivider: { width: 40, height: 3, backgroundColor: UNIVERSITY_RED, borderRadius: 2, marginBottom: 15 },
  footerBrand: { fontSize: 11, fontWeight: '900', color: '#333', letterSpacing: 1.5 },
  footerSub: { fontSize: 10, color: '#BBB', marginTop: 6, fontWeight: '600' }
});