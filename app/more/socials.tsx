import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  StatusBar,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const UNIVERSITY_RED = "#D32F2F";
const UNIVERSITY_WHITE = "#FFFFFF";
const PRIMARY_DARK = "#1A1A1A";
const BG_COLOR = "#F9FAFB";

export default function SocialSupportScreen() {
  const navigation = useNavigation();

  const openSocial = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback to web browser
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error("Link error:", error);
    }
  };

  const SocialCard = ({ icon, name, handle, url, color }: any) => (
    <TouchableOpacity 
      style={styles.socialCard} 
      onPress={() => openSocial(url)}
      activeOpacity={0.8}
    >
      <View style={[styles.iconCircle, { backgroundColor: color + '12' }]}>
        <FontAwesome5 name={icon} size={22} color={color} />
      </View>
      <View style={styles.socialInfo}>
        <Text style={styles.socialLabel}>{name}</Text>
        <Text style={styles.socialHandle}>{handle}</Text>
      </View>
      <View style={styles.chevronWrapper}>
        <Ionicons name="chevron-forward" size={18} color="#BBB" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={UNIVERSITY_WHITE} />
      
      {/* HEADER WITH LOGO & BACK BUTTON */}
      <View style={styles.topNav}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={UNIVERSITY_RED} />
          </TouchableOpacity>
          
          <Image 
            source={require('@/assets/images/Laikipia-logo.png')} 
            style={styles.navLogo} 
          />
          <View>
            <Text style={styles.topNavTitle}>Support Hub</Text>
            <Text style={styles.topNavSubtitle}>Secure Node v1.0.4</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          onPress={() => Linking.openURL('tel:+254789757457')} 
          style={styles.quickCall}
        >
            <Ionicons name="call" size={20} color={UNIVERSITY_RED} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* HERO SECTION */}
        <View style={styles.heroSection}>
          <View style={styles.statusRow}>
              <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>COMMISSION LIVE</Text>
              </View>
          </View>
          <Text style={styles.greetText}>Official Hub</Text>
          <Text style={styles.headerTitle}>Voter Connect</Text>
          <Text style={styles.headerSub}>
            Stay synchronized with the University Electoral Commission for real-time announcements.
          </Text>
        </View>

        {/* SOCIAL LIST */}
        <View style={styles.listContainer}>
          <SocialCard 
            icon="twitter" 
            name="Twitter (X)" 
            handle="@LaikipiaUniUEC" 
            url="https://twitter.com/laikipia_uni" 
            color="#000000" 
          />
          <SocialCard 
            icon="instagram" 
            name="Instagram" 
            handle="@laikipia_university" 
            url="https://instagram.com/laikipia_university" 
            color="#E1306C" 
          />
          <SocialCard 
            icon="facebook" 
            name="Facebook" 
            handle="Laikipia University Official" 
            url="https://facebook.com/LaikipiaUniversity" 
            color="#4267B2" 
          />
          <SocialCard 
            icon="youtube" 
            name="YouTube" 
            handle="Laikipia University TV" 
            url="https://youtube.com/c/LaikipiaUniversity" 
            color="#FF0000" 
          />
          <SocialCard 
            icon="whatsapp" 
            name="WhatsApp Updates" 
            handle="UEC Official Channel" 
            url="https://whatsapp.com" 
            color="#25D366" 
          />
        </View>

        {/* HELP CARD */}
        <View style={styles.helpCard}>
          <View style={styles.helpHeader}>
            <MaterialCommunityIcons name="shield-account" size={28} color={UNIVERSITY_WHITE} />
            <Text style={styles.helpTitle}>Registry Support</Text>
          </View>
          <Text style={styles.helpText}>
            Technical difficulties with your voter ID or biometric verification? Reach out to ICT.
          </Text>
          
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => Linking.openURL('mailto:ict@laikipia.ac.ke')}
            >
              <Ionicons name="mail-unread" size={18} color={PRIMARY_DARK} />
              <Text style={styles.actionBtnText}>Email ICT</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => Linking.openURL('tel:+254789757457')}
            >
              <Ionicons name="call" size={18} color={PRIMARY_DARK} />
              <Text style={styles.actionBtnText}>Call Helpdesk</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
           <Text style={styles.footerBrand}>POWERED BY LAIKIPIA UNIVERSITY ICT</Text>
           <Text style={styles.footerSub}>SYSTEM TERMINAL • SECURE NODE v1.0.4</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG_COLOR },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: UNIVERSITY_WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  navLogo: { width: 34, height: 34, resizeMode: 'contain', marginRight: 12 },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  topNavTitle: { 
    fontSize: 14, 
    fontWeight: "900", 
    color: PRIMARY_DARK, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  topNavSubtitle: { 
    fontSize: 9, 
    fontWeight: "700", 
    color: '#AAA', 
    textTransform: 'uppercase' 
  },
  quickCall: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#FFF5F5' 
  },
  
  container: { padding: 20 },
  
  heroSection: { marginBottom: 30, marginTop: 5 },
  statusRow: { flexDirection: 'row', marginBottom: 15 },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF2F2', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8 
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: UNIVERSITY_RED, marginRight: 6 },
  statusText: { fontSize: 9, fontWeight: '900', color: UNIVERSITY_RED, letterSpacing: 1 },

  greetText: { 
    fontSize: 12, 
    fontWeight: "800", 
    color: UNIVERSITY_RED, 
    textTransform: 'uppercase', 
    letterSpacing: 2, 
    marginBottom: 4 
  },
  headerTitle: { fontSize: 32, fontWeight: "900", color: PRIMARY_DARK, lineHeight: 38 },
  headerSub: { fontSize: 14, color: "#777", marginTop: 10, lineHeight: 22, fontWeight: "500" },

  listContainer: { marginBottom: 25 },
  socialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UNIVERSITY_WHITE,
    padding: 16,
    borderRadius: 22,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconCircle: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  socialInfo: { flex: 1, marginLeft: 16 },
  socialLabel: { fontSize: 15, fontWeight: '800', color: PRIMARY_DARK },
  socialHandle: { fontSize: 11, color: '#999', marginTop: 3, fontWeight: '700' },
  chevronWrapper: { paddingLeft: 10 },

  helpCard: {
    backgroundColor: PRIMARY_DARK,
    padding: 24,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  helpHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  helpTitle: { fontSize: 20, fontWeight: '900', color: UNIVERSITY_WHITE, marginLeft: 12 },
  helpText: { 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.6)', 
    marginBottom: 25, 
    lineHeight: 20, 
    fontWeight: '500' 
  },
  
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: UNIVERSITY_WHITE,
    paddingVertical: 15,
    borderRadius: 15,
  },
  actionBtnText: { marginLeft: 10, fontWeight: '900', color: PRIMARY_DARK, fontSize: 14 },

  footer: { marginTop: 40, alignItems: 'center', marginBottom: 30 },
  footerBrand: { fontSize: 10, fontWeight: '900', color: '#CCC', letterSpacing: 2 },
  footerSub: { fontSize: 9, color: '#DDD', marginTop: 6, fontWeight: '800' }
});