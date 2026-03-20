import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity, 
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from 'expo-linking';

const UNIVERSITY_RED = '#c8102e';
const SOFT_BG = "#F9FAFB";

interface MenuItem {
  title: string;
  icon: string;
  path: string;
  type?: 'material' | 'ionicons';
  isExternal?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function MoreScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem("user");
      if (userData) setUser(JSON.parse(userData));
    };
    loadUser();
  }, []);

  const sections: MenuSection[] = [
    {
      title: "User Control Center",
      items: [
        { title: "Manage Account", icon: "person-circle-outline", path: "/more/manage", type: 'ionicons' },
        { title: "Security & Password", icon: "lock-closed-outline", path: "/more/password", type: 'ionicons' },
        { title: "Notifications", icon: "notifications-outline", path: "/more/notifications", type: 'ionicons' },
      ],
    },
    {
      title: "Election Portal",
      items: [
        { title: "Apply for Position", icon: "badge-account-outline", path: "/more/apply", type: 'material' },
        { title: "Application Progress", icon: "pulse", path: "/more/ApplicationProgress", type: 'material' },
        { title: "Coalition Hub", icon: "account-group-outline", path: "/more/Coalition", type: 'material' },
        { title: "Past Elections", icon: "history", path: "/more/past-elections", type: 'material' },
        { title: "Voting Guidelines", icon: "book-outline", path: "/more/guidlines", type: 'ionicons' },
      ],
    },
    {
      title: "System Architecture",
      items: [
        { title: "Blockchain Ledger", icon: "link-variant", path: "/more/blockchain", type: 'material' },
        { title: "About E-Vote", icon: "information-outline", path: "/more/about", type: 'ionicons' },
        // { title: "Developer Terminal", icon: "console", path: "/more/logs", type: 'material' }, // 'terminal' is 'console' in Material
        { title: "Architect Portfolio", icon: "code-braces", path: "/more/developer", type: 'material' },
      ],
    },
    {
      title: "Support & Social",
      items: [
        { title: "Technical Help", icon: "help-buoy-outline", path: "/more/help", type: 'ionicons' },
        { title: "Social Platforms", icon: "share-social-outline", path: "/more/socials", type: 'ionicons' },
        { title: "System Version", icon: "git-network-outline", path: "/more/version", type: 'ionicons' },
      ],
    },
    {
      title: "Legal & Ethics",
      items: [
        { title: "Privacy Protocol", icon: "shield-check-outline", path: "/more/privacy", type: 'material' },
        { title: "Terms of Service", icon: "file-document-outline", path: "/more/terms", type: 'material' },
      ],
    },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const handlePress = (item: MenuItem) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    item.isExternal ? Linking.openURL(item.path) : router.push(item.path as any);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      <View style={styles.topHeader}>
        <Animatable.View animation="fadeInLeft" style={styles.headerLeft}>
          <Image source={require('@/assets/images/Laikipia-logo.png')} style={styles.logo} />
          <View>
            <Text style={styles.greetingText}>System Navigator</Text>
            <Text style={styles.userNameText}>{user?.name || "Student Dashboard"}</Text>
          </View>
        </Animatable.View>
        <View style={styles.headerRightGroup}>
            <View style={styles.statusIndicator}>
                <View style={styles.pulseDot} />
                <Text style={styles.statusText}>ENCRYPTED</Text>
            </View>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={UNIVERSITY_RED} />}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          
          <Animatable.View animation="fadeInUp" style={styles.infoCard}>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Laikipia E-Vote</Text>
                <Text style={styles.infoDesc}>Decentralized governance powered by Ethereum Sepolia.</Text>
              </View>
              <View style={styles.badgeRow}>
                  <View style={styles.trustBadge}>
                      <Ionicons name="shield-checkmark" size={12} color="#fff" />
                      <Text style={styles.trustText}>SECURE NODE</Text>
                  </View>
              </View>
          </Animatable.View>

          {sections.map((section, sIndex) => (
            <Animatable.View 
                key={sIndex} 
                animation="fadeInUp" 
                delay={sIndex * 50} 
                style={styles.sectionWrapper}
            >
              <Text style={section.title === "System Architecture" ? [styles.sectionTitle, {color: UNIVERSITY_RED}] : styles.sectionTitle}>
                {section.title}
              </Text>
              <View style={styles.cardGroup}>
                {section.items.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.item, index === section.items.length - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => handlePress(item)}
                  >
                    <View style={styles.itemLeft}>
                      <View style={styles.iconBg}>
                        {item.type === 'material' ? (
                          <MaterialCommunityIcons name={item.icon as any} size={18} color={UNIVERSITY_RED} />
                        ) : (
                          <Ionicons name={item.icon as any} size={18} color={UNIVERSITY_RED} />
                        )}
                      </View>
                      <Text style={styles.itemText}>{item.title}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
                  </TouchableOpacity>
                ))}
              </View>
            </Animatable.View>
          ))}

          <Animatable.View animation="fadeInUp" delay={400} style={styles.devCard}>
            <View style={styles.devIconBg}>
                <MaterialCommunityIcons name="xml" size={24} color="#fff" />
            </View>
            <View style={styles.devTextContent}>
                <Text style={styles.devLabel}>Architect</Text>
                <Text style={styles.devName}>Gakenye Ndiritu</Text>
                <Text style={styles.devSub}>Full-Stack Engineer</Text>
            </View>
          </Animatable.View>

          <TouchableOpacity 
              style={styles.terminateBtn} 
              onPress={() => router.push("/more/logout" as any)}
          >
              <Ionicons name="power" size={20} color="#fff" />
              <Text style={styles.terminateText}>LOGOUT SESSION</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
              <Text style={styles.footerText}>LAIKIPIA UNIVERSITY SECURITY PROTOCOL</Text>
              <Text style={styles.copyrightText}>Project Build V1.0.4 • 2026</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, backgroundColor: '#fff', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 38, height: 38, marginRight: 12, borderRadius: 8 },
  greetingText: { fontSize: 10, color: "#9CA3AF", fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  userNameText: { fontSize: 16, fontWeight: "900", color: "#111" },
  headerRightGroup: { flexDirection: 'row', alignItems: 'center' },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E', marginRight: 6 },
  statusText: { fontSize: 9, fontWeight: '900', color: '#166534' },
  scrollContent: { backgroundColor: SOFT_BG, paddingBottom: 40 },
  container: { padding: 20 },
  infoCard: { backgroundColor: '#111', borderRadius: 20, padding: 20, marginBottom: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoTextContainer: { flex: 1 },
  infoTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
  infoDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  badgeRow: { marginLeft: 10 },
  trustBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: UNIVERSITY_RED, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  trustText: { fontSize: 8, fontWeight: '900', color: '#fff' },
  sectionWrapper: { marginBottom: 25 },
  sectionTitle: { fontSize: 11, fontWeight: "900", color: "#6B7280", marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1.2 },
  cardGroup: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
  item: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  itemLeft: { flexDirection: "row", alignItems: "center" },
  iconBg: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#FEF2F2', justifyContent: "center", alignItems: "center" },
  itemText: { marginLeft: 12, fontSize: 14, color: "#374151", fontWeight: "600" },
  devCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 20, borderRadius: 20, marginBottom: 20 },
  devIconBg: { backgroundColor: UNIVERSITY_RED, width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  devTextContent: { marginLeft: 15 },
  devLabel: { fontSize: 9, color: '#fff', fontWeight: '900', textTransform: 'uppercase' },
  devName: { fontSize: 15, color: '#fff', fontWeight: '900' },
  devSub: { fontSize: 11, color: 'gray', marginTop: 2 },
  terminateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, backgroundColor: '#111', gap: 10 },
  terminateText: { color: "#fff", fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  footer: { marginTop: 30, alignItems: "center" },
  footerText: { fontSize: 9, fontWeight: "900", color: "#9CA3AF", letterSpacing: 1 },
  copyrightText: { fontSize: 8, color: "#D1D5DB", marginTop: 4, fontWeight: "600" },
});