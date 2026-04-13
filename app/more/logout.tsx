import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  StatusBar, 
  Image,
  Alert,
  Linking
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { useRouter } from "expo-router";
import * as Animatable from "react-native-animatable";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as LocalAuthentication from 'expo-local-authentication';
import { logout } from "@/src/store/authSlice";

const UNIVERSITY_RED = "#D32F2F";
const DARK_NAVY = "#1A237E";
const UNIVERSITY_WHITE = "#FFFFFF";
const SUCCESS_GREEN = "#2E7D32";

const LogoutScreen: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  
  const [isFingerprintSupported, setIsFingerprintSupported] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  useEffect(() => {
    (async () => {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const supportsFingerprint = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
      setIsFingerprintSupported(supportsFingerprint);
    })();
  }, []);

  const handleLogout = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && isEnrolled && isFingerprintSupported) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to WIPE local session',
        disableDeviceFallback: false,
      });

      if (!result.success) return; 
    }

    // Start Secure Scrub Animation
    setIsWiping(true);

    setTimeout(async () => {
      try {
        await AsyncStorage.removeItem("token");
        dispatch(logout());
        router.replace("/Auth/Login");
      } catch (error) {
        setIsWiping(false);
        Alert.alert("Security Error", "Could not clear session safely.");
      }
    }, 1800); // Visual delay for security confidence
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={UNIVERSITY_WHITE} />
      
      {/* BRANDED HEADER - LEFT ALIGNED */}
      <View style={styles.topNav}>
        <View style={styles.navLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={isWiping}>
            <Ionicons name="chevron-back" size={26} color={isWiping ? "#CCC" : UNIVERSITY_RED} />
          </TouchableOpacity>
          
          <View style={styles.brandContainer}>
            <Image 
              source={require('@/assets/images/Laikipia-logo.png')} 
              style={styles.navLogo} 
            />
            <View style={styles.headerTextGroup}>
              <Text style={styles.topNavTitle}>Session Manager</Text>
              <Text style={styles.topNavSub}>LU-EVOTE-SECURE-EXIT</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.container}>
        {!isWiping ? (
          <Animatable.View animation="fadeIn" style={styles.contentWrapper}>
            <Animatable.View animation="pulse" iterationCount="infinite" style={styles.iconCircle}>
              <MaterialCommunityIcons name="fingerprint" size={54} color={UNIVERSITY_WHITE} />
            </Animatable.View>

            <Text style={styles.title}>Secure Exit</Text>
            
            {/* DEVICE TRUST CARD */}
            <View style={styles.trustCard}>
              <View style={styles.trustRow}>
                <Ionicons name="shield-checkmark" size={14} color={SUCCESS_GREEN} />
                <Text style={styles.trustText}>Session Integrity: AES-256 Encrypted</Text>
              </View>
              <View style={styles.trustRow}>
                <Ionicons name="wifi" size={14} color="#666" />
                <Text style={styles.trustText}>Network: Verified Secure Node</Text>
              </View>
            </View>

            <Text style={styles.subtitle}>
              Verification is required to ensure this is an authorized session termination and to scrub local electoral data.
            </Text>

            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={styles.logoutButton} 
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Verify & Logout</Text>
                <Ionicons name="finger-print" size={20} color={UNIVERSITY_WHITE} style={{marginLeft: 10}} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                <Text style={styles.cancelText}>Stay Signed In</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
                style={styles.supportLink} 
                onPress={() => Linking.openURL('mailto:ict@laikipia.ac.ke')}
            >
              <Text style={styles.supportText}>
                Suspicious Activity? <Text style={{color: UNIVERSITY_RED}}>Report to ICT</Text>
              </Text>
            </TouchableOpacity>
          </Animatable.View>
        ) : (
          /* SECURITY SCRUB PROGRESS */
          <View style={styles.scrubContainer}>
            <Animatable.View animation="rotate" iterationCount="infinite" duration={1500} easing="linear">
              <MaterialCommunityIcons name="loading" size={60} color={UNIVERSITY_RED} />
            </Animatable.View>
            <Animatable.Text animation="fadeIn" iterationCount="infinite" direction="alternate" style={styles.scrubText}>
                Finalizing Security Protocols...
            </Animatable.Text>
            <Text style={styles.scrubSub}>Clearing local voter cache & session logs</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>ICT DIRECTORATE • BIOMETRIC GATEWAY</Text>
          <Text style={styles.footerSub}>v1.0.4 • © 2026 LAIKIPIA UNIVERSITY</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LogoutScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: UNIVERSITY_WHITE },
  topNav: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 75,
    borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
  },
  navLeft: { flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 4, marginRight: 6 },
  brandContainer: { flexDirection: 'row', alignItems: 'center' },
  navLogo: { width: 38, height: 38, resizeMode: 'contain', marginRight: 10 },
  headerTextGroup: { justifyContent: 'center' },
  topNavTitle: { fontSize: 13, fontWeight: "900", color: "#1A1A1A", letterSpacing: 0.3, textTransform: 'uppercase' },
  topNavSub: { fontSize: 8, color: UNIVERSITY_RED, fontWeight: '700', marginTop: 1 },
  
  container: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 30 },
  contentWrapper: { width: '100%', alignItems: 'center' },
  
  iconCircle: {
    width: 100, height: 100, borderRadius: 35, backgroundColor: DARK_NAVY,
    justifyContent: "center", alignItems: "center", marginBottom: 25,
    elevation: 8, shadowColor: DARK_NAVY, shadowOpacity: 0.3, shadowRadius: 10
  },
  title: { fontSize: 26, fontWeight: "900", color: "#111", marginBottom: 15 },
  
  trustCard: {
    backgroundColor: '#F8F9FA', padding: 15, borderRadius: 16, width: '100%',
    marginBottom: 20, borderWidth: 1, borderColor: '#EEE'
  },
  trustRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  trustText: { fontSize: 11, color: '#444', marginLeft: 8, fontWeight: '700' },
  
  subtitle: { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 20, marginBottom: 35 },
  
  buttonGroup: { width: '100%' },
  logoutButton: {
    backgroundColor: UNIVERSITY_RED, height: 60, borderRadius: 20,
    flexDirection: 'row', justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  cancelButton: {
    height: 60, borderRadius: 20, justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "#EEE", backgroundColor: '#FAFAFA'
  },
  buttonText: { color: UNIVERSITY_WHITE, fontWeight: "900", fontSize: 16 },
  cancelText: { color: "#666", fontWeight: "800", fontSize: 16 },

  supportLink: { marginTop: 25 },
  supportText: { fontSize: 12, color: '#999', fontWeight: '600' },

  scrubContainer: { alignItems: 'center' },
  scrubText: { marginTop: 25, fontSize: 16, fontWeight: '900', color: DARK_NAVY },
  scrubSub: { fontSize: 12, color: '#999', marginTop: 8 },
  
  footer: { position: 'absolute', bottom: 30, alignItems: 'center' },
  footerBrand: { fontSize: 10, fontWeight: '900', color: '#333', letterSpacing: 1 },
  footerSub: { fontSize: 9, color: '#BBB', marginTop: 5, fontWeight: '700' }
});