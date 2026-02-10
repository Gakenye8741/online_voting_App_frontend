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
import { Ionicons } from "@expo/vector-icons";

// LAIKIPIA UNIVERSITY THEME COLORS
const UNIVERSITY_RED = "#D32F2F";
const UNIVERSITY_WHITE = "#FFFFFF";
const SOFT_BG = "#F9F9F9";

export default function MoreScreen() {
  const router = useRouter();

  const sections = [
    {
      title: "Account",
      items: [
        { title: "Manage Account", icon: "person-circle-outline", path: "/more/manage" },
        { title: "Change Password", icon: "key-outline", path: "/more/password" },
        { title: "Logout", icon: "log-out-outline", path: "/more/logout" },
      ],
    },
    {
      title: "Voting",
      items: [
        { title: "Apply for Position", icon: "create-outline", path: "/more/apply" },
        { title: "Application Progress", icon: "create-outline", path: "/more/ApplicationProgress" },
        { title: "Voting Guidelines", icon: "document-text-outline", path: "/more/guidelines" },
        { title: "Election Notifications", icon: "notifications-outline", path: "/more/notifications" },
        { title: "Past Elections", icon: "calendar-outline", path: "/more/past-elections" },
      ],
    },
    {
      title: "Support & Legal",
      items: [
        { title: "Help / FAQ", icon: "help-circle-outline", path: "/more/help" },
        { title: "Privacy Policy", icon: "shield-checkmark-outline", path: "/more/privacy" },
        { title: "Terms of Service", icon: "document-text-outline", path: "/more/terms" }
      ],
    },
    {
      title: "Personalization",
      items: [
        { title: "Theme & Appearance", icon: "color-palette-outline", path: "/more/theme" },
      ],
    },
    {
      title: "App & Developer",
      items: [
        { title: "Developer Info", icon: "person-outline", path: "/more/developer" },
        { title: "Socials", icon: "logo-twitter", path: "/more/socials" }
      ],
    },
    {
      title: "About",
      items: [
        { title: "About Laikipia E-Vote", icon: "information-circle-outline", path: "/more/about" },
        { title: "Version 1.0.0", icon: "ellipse-outline", path: "/more/version" },
      ],
    },
  ];

  const fadeAnims = useRef(sections.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Using Spring for a more "Senior Engineer" premium feel
    Animated.stagger(
      100,
      fadeAnims.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        })
      )
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.mainTitle}>More Options</Text>
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
                    outputRange: [20, 0],
                  }),
                },
                {
                  scale: fadeAnims[sIndex].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.97, 1],
                  }),
                },
              ],
            }}
          >
            <View style={styles.section}>
              {section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}
              
              <View style={styles.cardGroup}>
                {section.items.map((item, index) => (
                  <View key={index}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.item,
                        pressed && { backgroundColor: "#F9F9F9" },
                      ]}
                      onPress={() => router.push(item.path as any)}
                    >
                      <View style={styles.itemContent}>
                        <View style={styles.iconCircle}>
                          <Ionicons name={item.icon as any} size={22} color={UNIVERSITY_RED} />
                        </View>
                        <Text style={styles.itemText}>{item.title}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#CCC" />
                    </Pressable>
                    {/* Only show divider if it's not the last item in the section */}
                    {index < section.items.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>LAIKIPIA UNIVERSITY E-VOTING</Text>
          <Text style={styles.devTag}>Engineered by Gakenye Ndiritu</Text>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1A1A1A",
  },
  section: {
    marginTop: 25,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#888",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  cardGroup: {
    backgroundColor: UNIVERSITY_WHITE,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EFEFEF",
    // Modern Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF2F2", // Very light red tint
    justifyContent: "center",
    alignItems: "center",
  },
  itemText: {
    marginLeft: 14,
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F1F1",
    marginHorizontal: 16,
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#BBB",
    letterSpacing: 2,
  },
  devTag: {
    fontSize: 9,
    color: "#DDD",
    marginTop: 4,
  }
});