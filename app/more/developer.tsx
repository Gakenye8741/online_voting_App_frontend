import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
  StatusBar,
  Share
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5, MaterialCommunityIcons, Octicons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from 'react-native-toast-message';
import * as Animatable from 'react-native-animatable';

// --- BRAND IDENTITY SYSTEM ---
const UNIVERSITY_RED = "#D32F2F";
const DARK_NAVY = "#0A0E21"; 
const BORDER_COLOR = "#E2E8F0";
const ACCENT_BLUE = "#00B0FF";
const TEXT_MUTED = "#64748B";

const DEVELOPER_DATA = {
  name: "Gakenye Ndiritu",
  role: "Lead Systems Architect",
  title: "Secretary General, CISLU",
  org: "Laikipia University",
  email: "brayogakenye04@gmail.com",
  phone: "254789757457", 
  website: "https://gakenye-ndiritu.netlify.app",
  location: "Nyahururu, Kenya",
  profileImg: "https://res.cloudinary.com/dwibg4vvf/image/upload/v1776254794/gl7q3thun1ludsazud1h.jpg",
  
  bio: "Lead Systems Architect specialized in high-integrity mobile ecosystems and decentralized governance protocols. With deep expertise in the PERN stack (PostgreSQL, Express, React, Node.js), I bridge the gap between complex blockchain logic and seamless user experiences. Beyond web architecture, I maintain programmable mastery in systems-level languages, driving digital transformation through robust, scalable, and secure software engineering.",
  
  stack: [
    { skill: "Full-Stack (PERN)", detail: "Expertise in PostgreSQL, Express, React, and Node.js with Drizzle ORM.", icon: "layers-outline" },
    { skill: "Mobile Engine", detail: "React Native & Expo specialist. Architecting high-concurrency apps like Unihaven.", icon: "cellphone-link" },
    { skill: "Blockchain", detail: "Solidity & Ethereum Sepolia. Developed gasless protocols for Laikipia E-Vote.", icon: "ethereum" },
    { skill: "Systems Logic", detail: "Strong foundational knowledge in Python, C++, and Bash for system-level automation.", icon: "code-slash" },
  ],

  socialNodes: [
    { platform: "Portfolio", handle: "web.presence", icon: "globe", color: ACCENT_BLUE, url: "https://gakenye-ndiritu.netlify.app" },
    { platform: "GitHub", handle: "vcs.repo", icon: "github", color: "#111", url: "https://github.com/gakenye8741" },
    { platform: "LinkedIn", handle: "prof.connect", icon: "linkedin", color: "#0077b5", url: "https://linkedin.com/in/gakenye8741" },
    { platform: "TikTok", handle: "tech.content", icon: "tiktok", color: "#000", url: "https://tiktok.com/@itsgakenye" },
    { platform: "YouTube", handle: "dev.logs", icon: "youtube", color: "#FF0000", url: "https://youtube.com/@itsgakenye" },
    { platform: "WhatsApp", handle: "direct.msg", icon: "whatsapp", color: "#25D366", url: "https://wa.me/254789757457" },
  ],

  projects: [
    { name: "Laikipia E-Vote", desc: "Decentralized election system utilizing gasless blockchain transactions for integrity.", tech: "Solidity | Node.js | TypeScript" },
    { name: "Unihaven", desc: "Student hostel ecosystem featuring real-time booking and verified review schemas.", tech: "PERN Stack | Drizzle ORM" },
    { name: "Anma Jewelry", desc: "Full-stack e-commerce architecture with integrated stock management and UI.", tech: "React | Express | PostgreSQL" }
  ],

  achievements: [
    "Secretary General of the Computing & Innovation Society (CISLU).",
    "Lead Architect for institutional decentralized voting protocols.",
    "Reduced API latency by 40% through advanced database indexing and middleware logic.",
    "Active contributor to secure mainframe development in Kali Linux environments."
  ]
};

export default function CombinedProfilePage() {
  const router = useRouter();

  const handleLink = (url: string) => {
    Linking.openURL(url).catch(() => 
      Toast.show({ type: 'error', text1: 'Node Error', text2: 'Encrypted link unreachable.' })
    );
  };

  // ENHANCED DETAILED SHARE FUNCTION (CODE AESTHETIC)
  const onShare = async () => {
    try {
      const shareMessage = `
/**
 * @profile SYSTEM_ARCHITECT_NODE
 * @status ACTIVE_DEPLOYMENT
 * @version 1.6.0
 */

const DEVELOPER = {
  identity: "${DEVELOPER_DATA.name.toUpperCase()}",
  role: "${DEVELOPER_DATA.role}",
  position: "${DEVELOPER_DATA.title}",
  institution: "${DEVELOPER_DATA.org}",
  location: "${DEVELOPER_DATA.location}"
};

const TECH_STACK = {
  core: ["PostgreSQL", "Express", "React", "Node.js"],
  mobile: ["React Native", "Expo", "TypeScript"],
  blockchain: ["Solidity", "Ethereum Sepolia", "Gasless-TX"],
  ops: ["Kali Linux", "Bash", "System Automation"]
};

const PROJECTS = [
  "Laikipia E-Vote (Blockchain)",
  "Unihaven (Prop-Tech)",
  "Anma Perfumes (E-Commerce)"
];

// INITIALIZE_CONNECTION
const ENDPOINTS = {
  web: "${DEVELOPER_DATA.website}",
  git: "https://github.com/gakenye8741",
  comm: "${DEVELOPER_DATA.email}"
};

console.log("Transmission Successful.");
      `.trim();

      await Share.share({
        message: shareMessage,
        title: `${DEVELOPER_DATA.name} | Systems Architect`,
      });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Share Error', text2: 'Internal node failure.' });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER COMMAND BAR */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
           <Ionicons name="chevron-back" size={24} color={UNIVERSITY_RED} />
        </TouchableOpacity>
        <View style={styles.navInfo}>
           <Text style={styles.headerTitle}>System Architect</Text>
           <Text style={styles.headerSub}>NODE_VERIFIED_SECURE</Text>
        </View>
        <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
            <Feather name="share-2" size={20} color={UNIVERSITY_RED} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* EXECUTIVE IDENTITY SECTION */}
        <Animatable.View animation="fadeIn" duration={1000} style={styles.headerSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarBorder}>
               <Image source={{ uri: DEVELOPER_DATA.profileImg }} style={styles.avatarImage} />
            </View>
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="check-decagram" size={28} color={ACCENT_BLUE} />
            </View>
          </View>
          <Text style={styles.devName}>{DEVELOPER_DATA.name}</Text>
          <Text style={styles.devRole}>{DEVELOPER_DATA.role}</Text>
          <Text style={styles.devTitle}>{DEVELOPER_DATA.title}</Text>
          
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              
            </View>
            <Text style={styles.locationText}>📍 {DEVELOPER_DATA.location}</Text>
          </View>
        </Animatable.View>

        {/* SECURE COMMS ACTIONS */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryAction} onPress={() => handleLink(DEVELOPER_DATA.website)}>
            <Octicons name="browser" size={18} color="#FFF" />
            <Text style={styles.primaryActionText}>Visit Portfolio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryAction} onPress={() => handleLink(`mailto:${DEVELOPER_DATA.email}`)}>
            <Ionicons name="mail-outline" size={22} color={UNIVERSITY_RED} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryAction} onPress={() => handleLink(`tel:${DEVELOPER_DATA.phone}`)}>
            <Ionicons name="call-outline" size={22} color={UNIVERSITY_RED} />
          </TouchableOpacity>
        </View>

        {/* MISSION LOG */}
        <View style={styles.bioCard}>
          <View style={styles.cardHeader}>
             <MaterialCommunityIcons name="shield-check-outline" size={14} color={UNIVERSITY_RED} />
          </View>
          <Text style={styles.bioText}>{DEVELOPER_DATA.bio}</Text>
        </View>

        {/* TECHNICAL MATRIX */}
        <Text style={styles.sectionHeading}>Technical Core Matrix</Text>
        <View style={styles.expertiseGrid}>
          {DEVELOPER_DATA.stack.map((item, index) => (
            <View key={index} style={styles.expertiseCard}>
              <View style={styles.expertiseIconBg}>
                <MaterialCommunityIcons name={item.icon as any} size={22} color={UNIVERSITY_RED} />
              </View>
              <Text style={styles.expertiseTitle}>{item.skill}</Text>
              <Text style={styles.expertiseDetail}>{item.detail}</Text>
            </View>
          ))}
        </View>

        {/* ENCRYPTED SOCIAL NODES */}
        <Text style={styles.sectionHeading}>Encrypted Social Nodes</Text>
        <View style={styles.socialGrid}>
          {DEVELOPER_DATA.socialNodes.map((node, index) => (
            <TouchableOpacity key={index} style={styles.socialBox} onPress={() => handleLink(node.url)}>
              <View style={[styles.iconCircle, { backgroundColor: node.color }]}>
                <FontAwesome5 name={node.icon} size={16} color="#FFF" />
              </View>
              <View style={styles.socialInfo}>
                  <Text style={styles.socialLabel}>{node.platform}</Text>
                  <Text style={styles.socialSubLabel}>{node.handle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ACTIVE DEPLOYMENTS */}
        <Text style={styles.sectionHeading}>Active Deployments</Text>
        {DEVELOPER_DATA.projects.map((proj, index) => (
          <View key={index} style={styles.projectItem}>
            <View style={styles.projectHeader}>
              <Text style={styles.projectName}>{proj.name}</Text>
              <Text style={styles.projectTech}>{proj.tech}</Text>
            </View>
            <Text style={styles.projectDesc}>{proj.desc}</Text>
          </View>
        ))}

        {/* STRATEGIC MILESTONES */}
        <Text style={styles.sectionHeading}>Strategic Milestones</Text>
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
          <TouchableOpacity onPress={() => handleLink(DEVELOPER_DATA.website)}>
             <Text style={styles.footerSub}>SYSTEM_KERNEL v1.6.0 • {DEVELOPER_DATA.website}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  navbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, height: 70, backgroundColor: "#FFF", borderBottomWidth: 1, borderBottomColor: "#EEE" },
  backBtn: { padding: 8 },
  navInfo: { alignItems: 'center' },
  headerTitle: { fontSize: 13, fontWeight: '900', color: UNIVERSITY_RED, textTransform: 'uppercase' },
  headerSub: { fontSize: 8, color: TEXT_MUTED, fontWeight: '800', letterSpacing: 1 },
  shareBtn: { padding: 8, backgroundColor: "#FDF2F2", borderRadius: 12 },
  container: { padding: 20 },
  headerSection: { alignItems: 'center', marginVertical: 10 },
  avatarWrapper: { marginBottom: 15, position: 'relative' },
  avatarBorder: { 
    width: 110, height: 110, borderRadius: 40, padding: 3, backgroundColor: UNIVERSITY_RED, 
    justifyContent: 'center', alignItems: 'center'
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 37 },
  verifiedBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#FFF', borderRadius: 20, padding: 2 },
  devName: { fontSize: 26, fontWeight: "900", color: DARK_NAVY },
  devRole: { fontSize: 12, color: UNIVERSITY_RED, fontWeight: "800", marginTop: 4, textTransform: 'uppercase' },
  devTitle: { fontSize: 11, color: TEXT_MUTED, fontWeight: "700" },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, marginRight: 10 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E', marginRight: 6 },
  statusText: { fontSize: 8, fontWeight: '900', color: '#475569' },
  locationText: { fontSize: 11, color: TEXT_MUTED, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10, marginVertical: 20 },
  primaryAction: { flex: 2, backgroundColor: DARK_NAVY, flexDirection: 'row', height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  primaryActionText: { color: "#FFF", fontWeight: '800', marginLeft: 10, fontSize: 12, textTransform: 'uppercase' },
  secondaryAction: { flex: 0.6, backgroundColor: "#FFF", height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: BORDER_COLOR },
  bioCard: { backgroundColor: "#FFF", padding: 20, borderRadius: 24, marginBottom: 25, borderLeftWidth: 4, borderLeftColor: UNIVERSITY_RED, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardLabelText: { fontSize: 9, fontWeight: '900', color: TEXT_MUTED },
  bioText: { fontSize: 13, color: "#334155", lineHeight: 22, fontWeight: '500' },
  sectionHeading: { fontSize: 11, fontWeight: "900", color: DARK_NAVY, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  expertiseGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  expertiseCard: { width: '48%', backgroundColor: '#FFF', padding: 15, borderRadius: 22, marginBottom: 12, borderWidth: 1, borderColor: BORDER_COLOR },
  expertiseIconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  expertiseTitle: { fontSize: 13, fontWeight: '800', color: DARK_NAVY },
  expertiseDetail: { fontSize: 9, color: TEXT_MUTED, marginTop: 4, fontWeight: '600', lineHeight: 14 },
  socialGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  socialBox: { width: '48%', backgroundColor: "#FFF", padding: 12, borderRadius: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: BORDER_COLOR },
  iconCircle: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  socialInfo: { marginLeft: 10 },
  socialLabel: { fontSize: 12, fontWeight: '800', color: DARK_NAVY },
  socialSubLabel: { fontSize: 8, color: TEXT_MUTED, fontWeight: '700' },
  projectItem: { backgroundColor: "#FFF", padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: BORDER_COLOR },
  projectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  projectName: { fontSize: 14, fontWeight: '800', color: DARK_NAVY },
  projectTech: { fontSize: 9, fontWeight: '800', color: UNIVERSITY_RED },
  projectDesc: { fontSize: 12, color: TEXT_MUTED, fontWeight: '500' },
  milestoneCard: { backgroundColor: DARK_NAVY, padding: 20, borderRadius: 24 },
  milestoneRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start', gap: 12 },
  milestoneDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: UNIVERSITY_RED, marginTop: 7 },
  milestoneText: { flex: 1, fontSize: 12, color: '#E2E8F0', fontWeight: '500', lineHeight: 18 },
  footer: { marginTop: 30, alignItems: 'center' },
  signatureLine: { width: 30, height: 3, backgroundColor: UNIVERSITY_RED, borderRadius: 2, marginBottom: 10 },
  footerBrand: { fontSize: 9, fontWeight: '900', color: DARK_NAVY, letterSpacing: 1 },
  footerSub: { fontSize: 8, color: TEXT_MUTED, marginTop: 4, fontWeight: '700' }
});