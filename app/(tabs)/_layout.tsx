import React, { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Modal, StyleSheet, TouchableOpacity, Text, View, Alert } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/src/store";
import { logout } from "@/src/store/authSlice";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AppLayout from "@/src/components/AppLayout";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as LocalAuthentication from 'expo-local-authentication';
import * as Animatable from "react-native-animatable";
import * as ScreenCapture from 'expo-screen-capture';
import { BlurView } from 'expo-blur'; 

// --- CONFIGURATION ---
const INACTIVITY_LIMIT_MS = 30 * 1000; // 30 Seconds

function LockGuard({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number | null>(null);
  
  const [isLocked, setIsLocked] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  useEffect(() => {
    // Android: Prevents screenshots and masks content in recent apps
    ScreenCapture.preventScreenCaptureAsync();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // INSTANT BLUR: Triggered as soon as the app loses focus (swipe up/minimize)
      if (nextAppState === "inactive" || nextAppState === "background") {
        if (!isOverlayVisible) {
          backgroundTime.current = Date.now();
          setIsOverlayVisible(true);
          setIsLocked(true);
        }
      }
      
      // On Return: Check if we need a full login or just biometrics
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        checkSessionTimeout();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [isOverlayVisible]);

  const checkSessionTimeout = () => {
    if (backgroundTime.current) {
      const elapsed = Date.now() - backgroundTime.current;

      if (elapsed > INACTIVITY_LIMIT_MS) {
        handleFullLogout();
      } else {
        authenticate();
      }
    }
  };

  const handleFullLogout = () => {
    setIsLocked(false);
    setIsOverlayVisible(false);
    dispatch(logout()); 
    router.replace("/Auth/Login"); 
    Alert.alert("Security Timeout", "Session expired. Please log in again.");
  };

  const authenticate = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && isEnrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to resume session",
        fallbackLabel: "Use PIN",
      });

      if (result.success) {
        setIsLocked(false);
        setIsOverlayVisible(false);
      }
    } else {
      // If no biometrics, we force them to see the resume button
      setIsLocked(true); 
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {children}
      
      {/* This Modal stays hidden until the user swipes away. 
          The 'fade' animation and 'BlurView' create the M-PESA effect.
      */}
      <Modal visible={isLocked || isOverlayVisible} animationType="fade" transparent={true}>
        <BlurView intensity={95} tint="light" style={StyleSheet.absoluteFill}>
          <View style={lockStyles.container}>
            <Animatable.View animation="fadeInUp" duration={400} style={lockStyles.inner}>
              
              <View style={lockStyles.brandSection}>
                  <View style={lockStyles.iconCircle}>
                    <MaterialCommunityIcons name="shield-lock" size={40} color="#fff" />
                  </View>
                  <Text style={lockStyles.uniName}>LAIKIPIA UNIVERSITY</Text>
                  <View style={lockStyles.lineDivider} />
              </View>

              <Text style={lockStyles.title}>App Locked</Text>
              <Text style={lockStyles.subtitle}>
                Verify identity to resume your secure voting session.
              </Text>
              
              <TouchableOpacity activeOpacity={0.9} style={lockStyles.btn} onPress={authenticate}>
                <Ionicons name="finger-print" size={22} color="#fff" style={{marginRight: 10}} />
                <Text style={lockStyles.btnText}>RESUME BALLOT</Text>
              </TouchableOpacity>

              <TouchableOpacity style={lockStyles.secondaryBtn} onPress={handleFullLogout}>
                  <Text style={lockStyles.secondaryBtnText}>Logout</Text>
              </TouchableOpacity>
            </Animatable.View>
            
            <Text style={lockStyles.footerText}>LAIKIPIA E-VOTE • SECURED</Text>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}

export default function TabsLayout() {
  const theme = useSelector((state: RootState) => state.theme.mode);
  const accent = useSelector((state: RootState) => state.theme.accent);
  const insets = useSafeAreaInsets();

  const inactiveColor = theme === "dark" ? "#aaa" : "#444";
  const backgroundColor = theme === "dark" ? "#1c1c1c" : "#fff";

  return (
    <AppLayout>
      <LockGuard>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: accent,
            tabBarInactiveTintColor: inactiveColor,
            tabBarStyle: {
              backgroundColor,
              borderTopWidth: 0.4,
              borderTopColor: "#ddd",
              height: 60 + insets.bottom,
              paddingBottom: insets.bottom,
            },
            tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
          }}
        >
          <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> }} />
          <Tabs.Screen name="Candidate" options={{ title: "Candidates", tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account-group" size={26} color={color} /> }} />
          <Tabs.Screen name="vote" options={{ title: "Vote", tabBarIcon: ({ color }) => <MaterialCommunityIcons name="vote" size={26} color={color} /> }} />
          <Tabs.Screen name="results" options={{ title: "Results", tabBarIcon: ({ color }) => <Ionicons name="bar-chart" size={25} color={color} /> }} />
          <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: ({ color }) => <Ionicons name="ellipsis-horizontal" size={25} color={color} /> }} />
        </Tabs>
      </LockGuard>
    </AppLayout>
  );
}

const lockStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 25 },
  inner: { 
    alignItems: "center", 
    width: '100%', 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    padding: 30, 
    borderRadius: 25,
    elevation: 20
  },
  brandSection: { alignItems: 'center', marginBottom: 25 },
  uniName: { fontSize: 12, fontWeight: '900', color: '#c8102e', letterSpacing: 1, marginTop: 10 },
  lineDivider: { height: 2, width: 30, backgroundColor: '#c8102e', marginTop: 5 },
  iconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#c8102e", justifyContent: "center", alignItems: "center" },
  title: { color: "#111", fontSize: 22, fontWeight: "900", marginBottom: 5 },
  subtitle: { color: "#4B5563", fontSize: 14, textAlign: "center", marginBottom: 30 },
  btn: { flexDirection: 'row', backgroundColor: "#c8102e", paddingVertical: 15, borderRadius: 12, width: '100%', justifyContent: 'center' },
  btnText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  secondaryBtn: { marginTop: 15 },
  secondaryBtnText: { color: '#c8102e', fontSize: 14, fontWeight: '700' },
  footerText: { position: 'absolute', bottom: 40, color: '#9CA3AF', fontSize: 10, fontWeight: '800', letterSpacing: 2 }
});