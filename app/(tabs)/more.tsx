import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Animated,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// LAIKIPIA UNIVERSITY THEME COLORS
const UNIVERSITY_RED = "#D32F2F";
const UNIVERSITY_WHITE = "#FFFFFF";
const DARK_NAVY = "#1A237E";
const SOFT_BG = "#F8F9FB";

export default function MoreScreen() {
  const router = useRouter();

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
        { title: "Application Progress", icon: " gavel-outline", path: "/more/ApplicationProgress", type: 'material' },
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

  const fadeAnims = useRef(sections.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      80,
      fadeAnims.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        })
      )
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.mainTitle}>Settings</Text>
          <Text style={styles.subHeader}>Configure your e-voting experience</Text>
        </View>

        {sections.map((section, sIndex) => (
          <Animated.View
            key={sIndex}
            style={{
              opacity: fadeAnims[sIndex],
              transform: [
                {
                  translateY: fadeAnims[sIndex].interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            }}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              
              <View style={styles.cardGroup}>
                {section.items.map((item, index) => (
                  <View key={index}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.item,
                        pressed && { backgroundColor: "#F5F5F5" },
                      ]}
                      onPress={() => router.push(item.path as any)}
                    >
                      <View style={styles.itemContent}>
                        <View style={styles.iconCircle}>
                          {item.type === 'material' ? (
                            <MaterialCommunityIcons name={item.icon as any} size={22} color={UNIVERSITY_RED} />
                          ) : (
                            <Ionicons name={item.icon as any} size={22} color={UNIVERSITY_RED} />
                          )}
                        </View>
                        <Text style={styles.itemText}>{item.title}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#BDBDBD" />
                    </Pressable>
                    {index < section.items.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        ))}

        <Pressable 
          style={styles.logoutBtn}
          onPress={() => router.push("/more/logout" as any)}
        >
          <Ionicons name="log-out-outline" size={20} color={UNIVERSITY_RED} />
          <Text style={styles.logoutText}>Sign Out of System</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>LAIKIPIA UNIVERSITY E-VOTING PORTAL</Text>
          <Text style={styles.devTag}>Developed by Gakenye Ndiritu • v1.0.4</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SOFT_BG,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 10,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: DARK_NAVY,
  },
  subHeader: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
    fontWeight: "500",
  },
  section: {
    marginTop: 28,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#616161",
    marginBottom: 10,
    marginLeft: 8,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  cardGroup: {
    backgroundColor: UNIVERSITY_WHITE,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E8EAF6",
    // Premium Shadow
    shadowColor: "#1A237E",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 15,
    elevation: 2,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFF5F5", 
    justifyContent: "center",
    alignItems: "center",
  },
  itemText: {
    marginLeft: 15,
    fontSize: 15,
    color: "#212121",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#F5F5F5",
    marginHorizontal: 20,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FFEBEB'
  },
  logoutText: {
    color: UNIVERSITY_RED,
    fontWeight: '800',
    fontSize: 15,
    marginLeft: 10
  },
  footer: {
    marginTop: 50,
    alignItems: "center",
  },
  footerText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#9E9E9E",
    letterSpacing: 1.5,
  },
  devTag: {
    fontSize: 10,
    color: "#BDBDBD",
    marginTop: 6,
    fontWeight: "600"
  }
});