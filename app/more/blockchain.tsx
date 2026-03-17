import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Linking, 
  Clipboard,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const UNIVERSITY_RED = '#c8102e';
const ETH_PURPLE = '#627EEA';

// Replace with your actual deployed contract address
const CONTRACT_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"; 

export default function BlockchainScreen() {
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsSyncing(false), 2000);
  }, []);

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copied", "Address copied to clipboard");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Network Status Header */}
        <Animatable.View animation="fadeInDown" style={styles.statusHeader}>
          <View style={styles.networkBadge}>
            <View style={[styles.pulseDot, { backgroundColor: isSyncing ? '#F59E0B' : '#10B981' }]} />
            <Text style={styles.networkText}>{isSyncing ? "SYNCING NODE..." : "ETHEREUM SEPOLIA LIVE"}</Text>
          </View>
          <Text style={styles.mainTitle}>Ledger Transparency</Text>
          <Text style={styles.subtitle}>Verify the immutability of the student council election.</Text>
        </Animatable.View>

        {/* Contract Identity Card */}
        <Animatable.View animation="fadeInUp" delay={200} style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="file-certificate-outline" size={24} color={UNIVERSITY_RED} />
            <Text style={styles.cardTitle}>Smart Contract</Text>
          </View>
          <Text style={styles.addressLabel}>CONTRACT ADDRESS</Text>
          <TouchableOpacity 
            style={styles.addressBox} 
            onPress={() => copyToClipboard(CONTRACT_ADDRESS)}
          >
            <Text numberOfLines={1} style={styles.addressText}>{CONTRACT_ADDRESS}</Text>
            <Ionicons name="copy-outline" size={18} color={UNIVERSITY_RED} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.etherscanBtn}
            onPress={() => Linking.openURL(`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`)}
          >
            <Text style={styles.etherscanBtnText}>View on Etherscan</Text>
            <Ionicons name="open-outline" size={16} color="#fff" />
          </TouchableOpacity>
        </Animatable.View>

        {/* Transparency Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HOW IT WORKS</Text>
          
          <Animatable.View animation="fadeInLeft" delay={400} style={styles.featureRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={20} color={UNIVERSITY_RED} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Zero Manipulation</Text>
              <Text style={styles.featureDesc}>Once a vote is cast, it is cryptographically sealed. Even system admins cannot edit it.</Text>
            </View>
          </Animatable.View>

          <Animatable.View animation="fadeInLeft" delay={600} style={styles.featureRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="eye-outline" size={20} color={UNIVERSITY_RED} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Public Audit</Text>
              <Text style={styles.featureDesc}>Anyone with the contract address can verify the total tally directly on the blockchain.</Text>
            </View>
          </Animatable.View>

          <Animatable.View animation="fadeInLeft" delay={800} style={styles.featureRow}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="incognito" size={20} color={UNIVERSITY_RED} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Voter Anonymity</Text>
              <Text style={styles.featureDesc}>Your identity is hashed. The ledger shows a vote was cast, but not by whom.</Text>
            </View>
          </Animatable.View>
        </View>

        {/* Technical Stack Footer */}
        <View style={styles.techStack}>
          <Text style={styles.techTitle}>Powered By</Text>
          <View style={styles.techIcons}>
            <MaterialCommunityIcons name="ethereum" size={30} color="#627EEA" />
            <MaterialCommunityIcons name="react" size={30} color="#61DAFB" />
            <MaterialCommunityIcons name="nodejs" size={30} color="#339933" />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 20 },
  statusHeader: { marginBottom: 30, alignItems: 'center' },
  networkBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 15
  },
  pulseDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  networkText: { fontSize: 10, fontWeight: '900', color: '#4B5563', letterSpacing: 1 },
  mainTitle: { fontSize: 28, fontWeight: '900', color: '#111', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 5, paddingHorizontal: 20 },
  
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
  addressLabel: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', marginBottom: 8 },
  addressBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F9FAFB', 
    padding: 15, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  addressText: { flex: 1, fontSize: 13, color: '#4B5563', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  etherscanBtn: { 
    backgroundColor: '#111', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 15, 
    borderRadius: 15, 
    gap: 10 
  },
  etherscanBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  section: { marginTop: 40 },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 20 },
  featureRow: { flexDirection: 'row', marginBottom: 25, gap: 15 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#c8102e10', justifyContent: 'center', alignItems: 'center' },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 4 },
  featureDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18 },

  techStack: { marginTop: 40, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 30 },
  techTitle: { fontSize: 12, fontWeight: '800', color: '#9CA3AF', marginBottom: 15 },
  techIcons: { flexDirection: 'row', gap: 25, opacity: 0.6 }
});