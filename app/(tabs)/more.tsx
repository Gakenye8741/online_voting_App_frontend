import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  StatusBar,
  Platform,
  Pressable,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Animatable from "react-native-animatable";
import * as Haptics from "expo-haptics";

// LAIKIPIA UNIVERSITY THEME COLORS (Synced with Candidates Screen)
const UNIVERSITY_RED = "#c8102e";
const UNIVERSITY_WHITE = "#FFFFFF";
const SOFT_BG = "#f8f9fa";

export default function MoreScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  const sections = [
    {
      title: "Profile & Security",
      items: [
        { title: "Manage Account", icon: "person-outline", path: "/more/manage" },
        { title: "Security & Password", icon: "shield-lock-outline", path: "/more/password", type: 'material' },
        { title: "Notifications", icon: "notifications-outline", path: "/more/notifications" },
      ],
    },
    {
      title: "Candidate Portal",
      items: [
        { title: "Apply for Position", icon: "badge-account-horizontal-outline", path: "/more/apply", type: 'material' },
        { title: "Application Progress", icon: "gavel-outline", path: "/more/ApplicationProgress", type: 'material' },
        { title: "Coalition Management", icon: "account-group-outline", path: "/more/Coalition", type: 'material' },
      ],
    },
    {
      title: "Election Center",
      items: [
        { title: "Voting Guidelines", icon: "book-outline", path: "/more/guidelines" },
        { title: "Election Calendar", icon: "calendar-clear-outline", path: "/more/calendar" },
        { title: "Past Election Results", icon: "archive-outline", path: "/more/past-elections" },
      ],
    },
    {
      title: "Preferences",
      items: [
        { title: "Theme & Appearance", icon: "color-palette-outline", path: "/more/theme" },
        { title: "Help & Support", icon: "help-buoy-outline", path: "/more/help" },
      ],
    },
    {
      title: "Legal & About",
      items: [
        { title: "Privacy Policy", icon: "document-lock-outline", path: "/more/privacy", type: 'material' },
        { title: "Terms of Service", icon: "document-text-outline", path: "/more/terms" },
        { title: "About E-Vote", icon: "information-circle-outline", path: "/more/about" },
      ],
    },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const handlePress = (path: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    router.push(path as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={UNIVERSITY_RED} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[UNIVERSITY_RED]} />}
      >
        {/* Sync with CandidatesScreen Header Syntax */}
        <LinearGradient colors={[UNIVERSITY_RED, "#8e0b20"]} style={styles.headerGradient}>
          <Animatable.View animation="fadeIn" duration={800} style={styles.headerContent}>
             <View style={styles.headerTopRow}>
                <Text style={styles.headerLabel}>User Dashboard</Text>
                <View style={styles.statusBadge}><Text style={styles.statusText}>AUTHORIZED</Text></View>
             </View>
             <Text style={styles.headerTitle}>Account Settings</Text>
             <Text style={styles.headerSubtitle}>Personalize your student voting profile</Text>
          </Animatable.View>
          <MaterialCommunityIcons name="cog-refresh" size={140} color="rgba(255,255,255,0.08)" style={styles.headerIconBg} />
        </LinearGradient>

        <View style={styles.mainContainer}>
          {sections.map((section, sIndex) => (
            <Animatable.View 
                key={sIndex} 
                animation="fadeInUp" 
                delay={sIndex * 100} 
                style={styles.sectionContainer}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleBox}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                <View style={styles.divider} />
              </View>

              <View style={styles.cardGroup}>
                {section.items.map((item, index) => (
                  <View key={index}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.item,
                        pressed && { backgroundColor: "#f0f0f0" },
                      ]}
                      onPress={() => handlePress(item.path)}
                    >
                      <View style={styles.itemLeft}>
                        <View style={styles.iconContainer}>
                          {item.type === 'material' ? (
                            <MaterialCommunityIcons name={item.icon as any} size={20} color={UNIVERSITY_RED} />
                          ) : (
                            <Ionicons name={item.icon as any} size={20} color={UNIVERSITY_RED} />
                          )}
                        </View>
                        <Text style={styles.itemText}>{item.title}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#D1D1D6" />
                    </Pressable>
                    {index < section.items.length - 1 && <View style={styles.itemSeparator} />}
                  </View>
                ))}
              </View>
            </Animatable.View>
          ))}

          <Animatable.View animation="fadeInUp" delay={600}>
            <TouchableOpacity 
                style={styles.logoutBtn} 
                activeOpacity={0.8}
                onPress={() => {
                    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    router.push("/more/logout" as any);
                }}
            >
                <Ionicons name="log-out" size={20} color="#fff" />
                <Text style={styles.logoutText}>Terminate Session</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>LAIKIPIA UNIVERSITY</Text>
                <Text style={styles.devTag}>System Architect: Brian Gakenye • v1.0.4</Text>
            </View>
          </Animatable.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: SOFT_BG },
  scrollContent: { paddingBottom: 30 },
  headerGradient: { paddingTop: 40, paddingBottom: 60, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  headerContent: { zIndex: 2 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 8 },
  headerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  statusBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  headerTitle: { fontSize: 32, fontWeight: "900", color: "#fff" },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  headerIconBg: { position: 'absolute', right: -30, bottom: -30, zIndex: 1 },
  
  mainContainer: { padding: 16, marginTop: -25, borderTopLeftRadius: 25, borderTopRightRadius: 25, backgroundColor: SOFT_BG },
  sectionContainer: { marginBottom: 25 },
  sectionHeader: { marginBottom: 12, marginLeft: 8 },
  sectionTitleBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 5 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: 1 },
  divider: { height: 3, width: 30, backgroundColor: UNIVERSITY_RED, borderRadius: 2 },
  
  cardGroup: { backgroundColor: '#fff', borderRadius: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, overflow: 'hidden' },
  item: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, paddingHorizontal: 16 },
  itemLeft: { flexDirection: "row", alignItems: "center" },
  iconContainer: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#c8102e10', justifyContent: "center", alignItems: "center" },
  itemText: { marginLeft: 14, fontSize: 15, color: "#1a1a1a", fontWeight: "700" },
  itemSeparator: { height: 1, backgroundColor: "#f5f5f5", marginLeft: 68 },
  
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, marginHorizontal: 4, paddingVertical: 18, borderRadius: 20, backgroundColor: '#1a1a1a', gap: 10, elevation: 4 },
  logoutText: { color: "#fff", fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
  
  footer: { marginTop: 40, alignItems: "center", paddingBottom: 20 },
  footerText: { fontSize: 11, fontWeight: "900", color: "#AEAEB2", letterSpacing: 2 },
  devTag: { fontSize: 10, color: "#C7C7CC", marginTop: 6, fontWeight: "600" },
});