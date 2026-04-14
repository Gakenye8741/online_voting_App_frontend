import React, { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Modal, StyleSheet, TouchableOpacity, Text, View, Alert, Platform, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/src/store";
import { logout } from "@/src/store/authSlice";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AppLayout from "@/src/components/AppLayout";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as LocalAuthentication from 'expo-local-authentication';
import * as Animatable from "react-native-animatable";
import { BlurView } from 'expo-blur'; 
import * as Haptics from 'expo-haptics';
import PagerView from 'react-native-pager-view';

// Notification Imports
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Import API 
import { notificationApi, useRegisterPushTokenMutation } from "@/src/store/Apis/Notification.Api";

// Screen Imports - Ensure these paths match your project structure
import IndexScreen from "./index";
import CandidateScreen from "./Candidate";
import VoteScreen from "./vote";
import ResultsScreen from "./results";
import MoreScreen from "./more";

const { width } = Dimensions.get("window");
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

// --- LOCK GUARD COMPONENT ---
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
      disableDeviceFallback: false,
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

// --- MAIN LAYOUT WITH SWIPE ---
export default function TabsLayout() {
  const theme = useSelector((state: RootState) => state.theme.mode);
  const accent = useSelector((state: RootState) => state.theme.accent);
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  const inactiveColor = theme === "dark" ? "#aaa" : "#444";
  const backgroundColor = theme === "dark" ? "#1c1c1c" : "#fff";

  const onTabPress = (index: number) => {
    setActiveTab(index);
    pagerRef.current?.setPage(index);
    Haptics.selectionAsync();
  };

  return (
    <AppLayout>
      <LockGuard>
        <View style={{ flex: 1, backgroundColor }}>
          {/* THE SWIPABLE CONTENT AREA */}
          <PagerView
            ref={pagerRef}
            style={{ flex: 1 }}
            initialPage={0}
            onPageSelected={(e) => setActiveTab(e.nativeEvent.position)}
          >
            <View key="1"><IndexScreen /></View>
            <View key="2"><CandidateScreen /></View>
            <View key="3"><VoteScreen /></View>
            <View key="4"><ResultsScreen /></View>
            <View key="5"><MoreScreen /></View>
          </PagerView>

          {/* CUSTOM TAB BAR REPLACING THE STANDARD <Tabs /> */}
          <View style={[styles.tabBar, { 
            backgroundColor, 
            paddingBottom: insets.bottom + 10,
            borderTopColor: theme === "dark" ? "#333" : "#e5e7eb" 
          }]}>
            <TabButton 
              label="Home" icon="home" type="Ionicons" 
              active={activeTab === 0} accent={accent} inactive={inactiveColor} 
              onPress={() => onTabPress(0)} 
            />
            <TabButton 
              label="Candidates" icon="account-group" type="Material" 
              active={activeTab === 1} accent={accent} inactive={inactiveColor} 
              onPress={() => onTabPress(1)} 
            />
            <TabButton 
              label="Vote" icon="vote" type="Material" 
              active={activeTab === 2} accent={accent} inactive={inactiveColor} 
              onPress={() => onTabPress(2)} 
            />
            <TabButton 
              label="Results" icon="bar-chart" type="Ionicons" 
              active={activeTab === 3} accent={accent} inactive={inactiveColor} 
              onPress={() => onTabPress(3)} 
            />
            <TabButton 
              label="More" icon="ellipsis-horizontal" type="Ionicons" 
              active={activeTab === 4} accent={accent} inactive={inactiveColor} 
              onPress={() => onTabPress(4)} 
            />
          </View>
        </View>
      </LockGuard>
    </AppLayout>
  );
}

// --- HELPER COMPONENT FOR TAB BUTTONS ---
function TabButton({ label, icon, type, active, accent, inactive, onPress }: any) {
  const color = active ? accent : inactive;
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress}>
      {type === "Ionicons" ? (
        <Ionicons name={active ? icon : `${icon}-outline`} size={24} color={color} />
      ) : (
        <MaterialCommunityIcons name={active ? icon : `${icon}-outline`} size={26} color={color} />
      )}
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 70,
    borderTopWidth: 0.5,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  }
});

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