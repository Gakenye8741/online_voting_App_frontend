import React, { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Modal, StyleSheet, TouchableOpacity, Text, View, Alert, Platform } from "react-native";
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

// Import API to allow foreground cache invalidation and token registration
import { notificationApi, useRegisterPushTokenMutation } from "@/src/store/Apis/Notification.Api";

// --- CONFIGURATION ---
const INACTIVITY_LIMIT_MS = 30 * 1000; 

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
  
  // Get current user and mutation
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

    // 1. REGISTER FOR PUSH & SYNC WITH BACKEND
    const setupNotifications = async () => {
      const token = await registerForPushNotificationsAsync();
      
      // If we have a token and a logged-in user, sync to PostgreSQL
      if (token && user?.id) {
        try {
          await registerPushToken({ 
            userId: user.id, 
            pushToken: token 
          }).unwrap();
          console.log("✅ Push Token successfully synced to Backend");
        } catch (err) {
          console.error("❌ Backend token registration failed:", err);
        }
      }
    };

    setupNotifications();

    // 2. FOREGROUND LISTENER (Real-time UI Update)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Invalidate tags so the "More" tab red dot or notification list updates automatically
      dispatch(notificationApi.util.invalidateTags(['Notifications']));
    });

    // 3. RESPONSE LISTENER (User taps notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as { electionId?: string };
      
      if (data?.electionId) {
        router.push({
          pathname: "/(tabs)/results",
          params: { id: data.electionId }
        });
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
  }, [isOverlayVisible, user?.id]); // Re-run if user logs in to register token correctly

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
      setIsLocked(true); 
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {children}
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
              <Text style={lockStyles.subtitle}>Verify identity to resume your secure voting session.</Text>
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
    if (finalStatus !== 'granted') {
      console.warn("Permission for notifications was not granted");
      return;
    }
    
    // Explicitly using the Project ID from your app.json
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } else {
    console.warn("Must use physical device for Push Notifications");
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
  inner: { alignItems: "center", width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: 30, borderRadius: 25, elevation: 20 },
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