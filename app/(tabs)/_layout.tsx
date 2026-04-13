import React, { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Modal, StyleSheet, TouchableOpacity, Text, View, Alert, Platform, Dimensions } from "react-native";
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
import * as Haptics from 'expo-haptics';

// Notification Imports
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Import API 
import { notificationApi, useRegisterPushTokenMutation } from "@/src/store/Apis/Notification.Api";

const { width } = Dimensions.get("window");

// --- CONFIGURATION ---
// Changed to 5 Minutes (5 * 60 * 1000ms)
const INACTIVITY_LIMIT_MS = 5 * 60 * 1000; 

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, 
    shouldShowList: true,   
  }),
});

function LockGuard({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const router = useRouter();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const [registerPushToken] = useRegisterPushTokenMutation();

  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number | null>(null);
  
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  
  const [isLocked, setIsLocked] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync();

    const setupNotifications = async () => {
      const token = await registerForPushNotificationsAsync();
      if (token && user?.userId) {
        try {
          await registerPushToken({ userId: user.userId, pushToken: token }).unwrap();
        } catch (err) {
          console.error("❌ Backend token registration failed:", err);
        }
      }
    };

    setupNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      dispatch(notificationApi.util.invalidateTags(['Notifications']));
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as { electionId?: string };
      if (data?.electionId) {
        router.push({ pathname: "/(tabs)/results", params: { id: data.electionId } });
      } else {
        router.push("/more/notifications"); 
      }
    });

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "inactive" || nextAppState === "background") {
        if (!isOverlayVisible) {
          backgroundTime.current = Date.now();
          setIsOverlayVisible(true);
          setIsLocked(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
      
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        checkSessionTimeout();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    
    return () => {
      subscription.remove();
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, [isOverlayVisible, user?.userId]);

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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert("Security Timeout", "Session expired due to 5 minutes of inactivity.");
  };

  const authenticate = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to resume session",
      fallbackLabel: "Use Device Passcode",
      disableDeviceFallback: false, // Allows Phone Password/PIN/Pattern
    });

    if (result.success) {
      setIsLocked(false);
      setIsOverlayVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {children}
      <Modal visible={isLocked || isOverlayVisible} animationType="fade" transparent={true}>
        <BlurView intensity={120} tint="light" style={StyleSheet.absoluteFill}>
          <View style={lockStyles.container}>
            <Animatable.View animation="zoomIn" duration={500} style={lockStyles.inner}>
              <View style={lockStyles.brandSection}>
                  <View style={lockStyles.iconCircle}>
                    <MaterialCommunityIcons name="shield-lock" size={42} color="#fff" />
                  </View>
                  <Text style={lockStyles.uniName}>LAIKIPIA UNIVERSITY</Text>
                  <View style={lockStyles.lineDivider} />
              </View>

              <Text style={lockStyles.title}>App Secured</Text>
              <Text style={lockStyles.subtitle}>Your progress is encrypted. Verify your identity to continue your secure session.</Text>
              
              <View style={lockStyles.buttonWrapper}>
                <TouchableOpacity activeOpacity={0.8} style={lockStyles.btn} onPress={authenticate}>
                  <Ionicons name="finger-print" size={24} color="#fff" style={{marginRight: 12}} />
                  <Text style={lockStyles.btnText}>RESUME SESSION</Text>
                </TouchableOpacity>

                <TouchableOpacity style={lockStyles.secondaryBtn} onPress={handleFullLogout}>
                    <Text style={lockStyles.secondaryBtnText}>Logout & Exit</Text>
                </TouchableOpacity>
              </View>
            </Animatable.View>
            
            <View style={lockStyles.footerContainer}>
                <MaterialCommunityIcons name="shield-check" size={14} color="#9CA3AF" />
                <Text style={lockStyles.footerText}>AES-256 BLOCKCHAIN PROTECTED</Text>
            </View>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#c8102e',
    });
  }
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  }
  return token;
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
              borderTopWidth: 0.5,
              borderTopColor: theme === "dark" ? "#333" : "#e5e7eb",
              height: 65 + insets.bottom,
              paddingBottom: insets.bottom + 10,
              paddingTop: 10,
              elevation: 0,
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginTop: 2 },
          }}
        >
          <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} /> }} />
          <Tabs.Screen name="Candidate" options={{ title: "Candidates", tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account-group-outline" size={26} color={color} /> }} />
          <Tabs.Screen name="vote" options={{ title: "Vote", tabBarIcon: ({ color }) => <MaterialCommunityIcons name="vote-outline" size={26} color={color} /> }} />
          <Tabs.Screen name="results" options={{ title: "Results", tabBarIcon: ({ color }) => <Ionicons name="bar-chart-outline" size={24} color={color} /> }} />
          <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={22} color={color} /> }} />
        </Tabs>
      </LockGuard>
    </AppLayout>
  );
}

const lockStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  inner: { 
    alignItems: "center", 
    width: '100%', 
    backgroundColor: 'rgba(255, 255, 255, 0.96)', 
    padding: 35, 
    borderRadius: 35, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10 
  },
  brandSection: { alignItems: 'center', marginBottom: 20 },
  uniName: { fontSize: 13, fontWeight: '900', color: '#c8102e', letterSpacing: 2, marginTop: 12 },
  lineDivider: { height: 2, width: 40, backgroundColor: '#c8102e', marginTop: 6 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#c8102e", justifyContent: "center", alignItems: "center" },
  
  title: { color: "#111827", fontSize: 26, fontWeight: "900", marginBottom: 8 },
  subtitle: { color: "#6B7280", fontSize: 14, textAlign: "center", marginBottom: 35, lineHeight: 20, paddingHorizontal: 10 },
  
  buttonWrapper: { width: '100%', gap: 12 },
  btn: { 
    flexDirection: 'row', 
    backgroundColor: "#111827", 
    paddingVertical: 18, 
    borderRadius: 20, 
    width: '100%', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 0.5 },
  
  secondaryBtn: { paddingVertical: 10, alignItems: 'center' },
  secondaryBtnText: { color: '#c8102e', fontSize: 14, fontWeight: '800' },
  
  footerContainer: { position: 'absolute', bottom: 50, flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { color: '#9CA3AF', fontSize: 10, fontWeight: '900', letterSpacing: 2 }
});