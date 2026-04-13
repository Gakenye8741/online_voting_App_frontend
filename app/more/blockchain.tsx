import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Linking, 
  Alert,
  Platform,
  Image,
  Clipboard,
  Animated,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const UNIVERSITY_RED = '#D32F2F';
const DARK_NAVY = '#1A237E';
const CONTRACT_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"; 

export default function BlockchainScreen() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Simulate initial node sync
    setTimeout(() => setIsSyncing(false), 2500);

    // Continuous pulse animation for the "Live" indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Hash Copied", "Contract address copied to clipboard.");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      
      {/* NAVBAR */}
      <View style={styles.navbar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backChevron}>
             <Ionicons name="chevron-back" size={26} color={UNIVERSITY_RED} />
          </TouchableOpacity>
          <Image source={require('@/assets/images/Laikipia-logo.png')} style={styles.logo} />
          <View>
            <Text style={styles.headerTitle}>Ledger Audit</Text>
            <Text style={styles.headerSub}>TRANSPARENCY PORTAL</Text>
          </View>
        </View>
        <View style={styles.networkBadge}>
            <Animated.View style={[styles.pulseDot, { transform: [{ scale: pulseAnim }], backgroundColor: isSyncing ? '#FFA000' : '#4CAF50' }]} />
            <Text style={styles.networkText}>{isSyncing ? "SYNCING" : "SEPOLIA"}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Verification Header */}
        <Animatable.View animation="fadeIn" style={styles.heroSection}>
          <MaterialCommunityIcons name="database-check" size={40} color={DARK_NAVY} />
          <Text style={styles.mainTitle}>Trust through Code</Text>
          <Text style={styles.subtitle}>
            The Laikipia E-Vote system uses Ethereum Smart Contracts to ensure every ballot is permanent and tamper-proof.
          </Text>
        </Animatable.View>

        {/* Contract Identity Card */}
        <Animatable.View animation="zoomIn" duration={800} style={styles.card}>
          <LinearGradient colors={['#fff', '#F8FAFC']} style={styles.cardInternal}>
            <View style={styles.cardHeader}>
              <View style={styles.contractIconCircle}>
                <MaterialCommunityIcons name="file-sign" size={20} color={UNIVERSITY_RED} />
              </View>
              <View>
                <Text style={styles.cardTitle}>Verified Smart Contract</Text>
                <Text style={styles.cardTag}>V-CORE ENGINE v2.1</Text>
              </View>
            </View>

            <View style={styles.addressContainer}>
                <Text style={styles.addressLabel}>DEPLOYED ADDRESS (SEPOLIA)</Text>
                <TouchableOpacity 
                    style={styles.addressBox} 
                    onPress={() => copyToClipboard(CONTRACT_ADDRESS)}
                    activeOpacity={0.7}
                >
                    <Text numberOfLines={1} style={styles.addressText}>{CONTRACT_ADDRESS}</Text>
                    <Ionicons name="copy-outline" size={16} color={UNIVERSITY_RED} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity 
                style={styles.etherscanBtn}
                onPress={() => Linking.openURL(`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`)}
            >
                <LinearGradient colors={[DARK_NAVY, '#000051']} style={styles.btnGradient} start={{x:0, y:0}} end={{x:1, y:0}}>
                    <Text style={styles.etherscanBtnText}>Explore on Etherscan</Text>
                    <Ionicons name="rocket-outline" size={16} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animatable.View>

        {/* Audit Sections */}
        <View style={styles.auditSection}>
          <Text style={styles.sectionHeading}>DECENTRALIZED GUARANTEES</Text>
          
          <Animatable.View animation="fadeInUp" delay={400} style={styles.auditRow}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons name="link-variant-plus" size={22} color={UNIVERSITY_RED} />
            </View>
            <View style={styles.auditContent}>
              <Text style={styles.auditTitle}>Cryptographic Sealing</Text>
              <Text style={styles.auditDesc}>Once your vote enters the block, it is hashed with the previous record, making alteration computationally impossible.</Text>
            </View>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={600} style={styles.auditRow}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons name="account-group-outline" size={22} color={UNIVERSITY_RED} />
            </View>
            <View style={styles.auditContent}>
              <Text style={styles.auditTitle}>Consensus Verification</Text>
              <Text style={styles.auditDesc}>The final count is determined by nodes on the network, not by any central authority at the University.</Text>
            </View>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={800} style={styles.auditRow}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons name="incognito" size={22} color={UNIVERSITY_RED} />
            </View>
            <View style={styles.auditContent}>
              <Text style={styles.auditTitle}>Privacy-First Ledger</Text>
              <Text style={styles.auditDesc}>We use zero-knowledge proofs to verify you are a student without revealing which candidate you selected.</Text>
            </View>
          </Animatable.View>
        </View>

        {/* Footer Tech Info */}
        <View style={styles.techFooter}>
          <Text style={styles.techLabel}>SYSTEM ARCHITECTURE</Text>
          <View style={styles.iconRow}>
            <MaterialCommunityIcons name="ethereum" size={24} color="#627EEA" />
            <View style={styles.verticalDivider} />
            <MaterialCommunityIcons name="react" size={24} color="#61DAFB" />
            <View style={styles.verticalDivider} />
            <MaterialCommunityIcons name="nodejs" size={24} color="#339933" />
            <View style={styles.verticalDivider} />
            <MaterialCommunityIcons name="shield-lock-outline" size={24} color={UNIVERSITY_RED} />
          </View>
          <Text style={styles.versionText}>POWERED BY LAIKIPIA COMPUTING SOCIETY • © 2026</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  
  // NAVBAR
  navbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, height: 75, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee", elevation: 2 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backChevron: { marginRight: 8, padding: 4 },
  logo: { width: 40, height: 40, resizeMode: 'contain', marginRight: 10 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: UNIVERSITY_RED, textTransform: 'uppercase' },
  headerSub: { fontSize: 9, color: '#999', fontWeight: 'bold' },
  networkBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pulseDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 8 },
  networkText: { fontSize: 10, fontWeight: '900', color: '#475569', letterSpacing: 0.5 },

  scroll: { padding: 20 },
  
  heroSection: { alignItems: 'center', marginVertical: 20 },
  mainTitle: { fontSize: 24, fontWeight: '900', color: DARK_NAVY, marginTop: 10 },
  subtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 8, lineHeight: 20, paddingHorizontal: 10 },
  
  // CONTRACT CARD
  card: { borderRadius: 24, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, marginBottom: 30 },
  cardInternal: { padding: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  contractIconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  cardTag: { fontSize: 9, fontWeight: '900', color: UNIVERSITY_RED, letterSpacing: 1 },
  
  addressContainer: { marginBottom: 20 },
  addressLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', marginBottom: 8, letterSpacing: 0.5 },
  addressBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'space-between' },
  addressText: { flex: 1, fontSize: 12, color: '#475569', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '600' },
  
  etherscanBtn: { borderRadius: 16, overflow: 'hidden' },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  etherscanBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // AUDIT LIST
  auditSection: { marginTop: 10 },
  sectionHeading: { fontSize: 11, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5, marginBottom: 20 },
  auditRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', elevation: 1 },
  auditContent: { flex: 1 },
  auditTitle: { fontSize: 15, fontWeight: '800', color: DARK_NAVY, marginBottom: 4 },
  auditDesc: { fontSize: 13, color: '#64748B', lineHeight: 19 },

  // TECH FOOTER
  techFooter: { marginTop: 20, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 30 },
  techLabel: { fontSize: 10, fontWeight: '900', color: '#CBD5E1', letterSpacing: 1, marginBottom: 15 },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 15, opacity: 0.5 },
  verticalDivider: { width: 1, height: 15, backgroundColor: '#CBD5E1' },
  versionText: { fontSize: 9, fontWeight: '700', color: '#CBD5E1', marginTop: 15 },
});