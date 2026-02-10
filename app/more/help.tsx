import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  StatusBar,
  TextInput,
  Platform,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const UNIVERSITY_RED = "#D32F2F";
const UNIVERSITY_WHITE = "#FFFFFF";
const PRIMARY_DARK = "#1A1A1A";
const BORDER_COLOR = "#F0F0F0";
const ACCENT_RED_LIGHT = "#FFF5F5";

const FAQ_DATABASE = [
  { id: 1, cat: "Voting", q: "How do I cast my ballot?", a: "Navigate to the 'Voting Dashboard', select your preferred candidate for each seat, and click 'Cast Vote'. You will be asked for a final biometric or PIN confirmation." },
  { id: 2, cat: "Voting", q: "Can I skip a specific elective seat?", a: "Yes. If you do not wish to vote for a particular post, you can select 'Abstain' or leave it blank, and the system will proceed to the next seat." },
  { id: 3, cat: "Voting", q: "Is there a time limit for voting?", a: "Once you enter the voting booth (the final selection screen), you have 3 minutes to finalize your choices before the session times out for security." },
  { id: 4, cat: "Voting", q: "What if I accidentally vote for the wrong person?", a: "The system provides a 'Review' screen before submission. Once you click 'Confirm Final Ballot', the action is permanent." },
  { id: 5, cat: "Voting", q: "Can I vote using two different phones?", a: "No. Your account is tied to a single active session. Logging into a second device will automatically terminate the first session." },
  { id: 6, cat: "Security", q: "How is my vote kept secret?", a: "We use E2EE (End-to-End Encryption). Your student ID verifies eligibility; the ballot itself is detached and stored anonymously in the digital urn." },
  { id: 7, cat: "Security", q: "What is the 'Digital Fingerprint'?", a: "It is a unique SHA-256 hash generated post-vote. You can use this to verify your vote was counted without revealing your choice." },
  { id: 8, cat: "Security", q: "Is the app protected against hackers?", a: "Yes. The platform includes Cloudflare WAF protection, DDoS mitigation, and SQL injection filters for every packet." },
  { id: 9, cat: "Security", q: "What if a candidate asks for my login?", a: "Sharing credentials violates University Statutes. Your voting rights will be revoked and disciplinary action taken." },
  { id: 10, cat: "Security", q: "Does the app track my location?", a: "We only verify that your IP address originates from a legitimate network to prevent foreign bot-net interference." },
  { id: 11, cat: "Technical", q: "The app is not loading images.", a: "This usually happens on slow campus Wi-Fi. Try switching to mobile data or clearing your app cache in Settings." },
  { id: 12, cat: "Technical", q: "I didn't receive the MFA OTP code.", a: "Ensure your phone has network. If it fails, use the 'Resend via Email' option for your student inbox." },
  { id: 13, cat: "Technical", q: "Does this app consume much data?", a: "No. The app is optimized for 'Lite' usage. A full session typically consumes less than 2MB." },
  { id: 14, cat: "Technical", q: "Is my phone OS supported?", a: "We support Android 7.0+ and iOS 12+. For older phones, please use the university computer labs." },
  { id: 15, cat: "Technical", q: "I see a '403 Forbidden' error.", a: "This means your student status is currently 'Inactive'. Contact the Registrar to update your registration." },
  { id: 16, cat: "Results", q: "Can I see live results?", a: "Live results are disabled to prevent bandwagon effects. Tallies are only visible to UEC Commissioners until polls close." },
  { id: 17, cat: "Results", q: "How long to count votes?", a: "Counting is instantaneous, but UEC performs a 1-hour audit after polls close before the official reveal." },
  { id: 18, cat: "Results", q: "What happens in the event of a tie?", a: "Per UEC guidelines, a tie triggers a 'Run-off' election for that specific seat within 48 hours." },
  { id: 19, cat: "Results", q: "Are the results legally binding?", a: "Yes. These are the official records for the Student Union (LUSA) elections." },
  { id: 20, cat: "Results", q: "How can I dispute a result?", a: "Disputes must be filed with the University Electoral Tribunal within 24 hours of declaration." },
  { id: 21, cat: "Account", q: "I am a First Year, can I vote?", a: "Yes, provided you have been issued a Reg Number and have completed semester registration." },
  { id: 22, cat: "Account", q: "I am on attachment, can I vote?", a: "Absolutely. The system allows off-campus students to exercise their rights remotely." },
  { id: 23, cat: "Account", q: "Can international students vote?", a: "Eligibility is based on 'Active Student' status, regardless of nationality." },
  { id: 24, cat: "Account", q: "My name is misspelled on the portal.", a: "The app pulls data from the ERP. Misspellings don't affect rights if the Reg Number is correct." },
  { id: 25, cat: "Account", q: "What if I graduated last month?", a: "Once marked 'Graduated' in the ERP, you are no longer eligible for student elections." },
];

export default function AnimatedFAQ() {
  const navigation = useNavigation();
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const categories = ["All", "Voting", "Security", "Technical", "Results", "Account"];

  const filteredFaqs = useMemo(() => {
    return FAQ_DATABASE.filter(item => {
      const matchSearch = item.q.toLowerCase().includes(query.toLowerCase()) || 
                          item.a.toLowerCase().includes(query.toLowerCase());
      const matchCat = activeCat === "All" || item.cat === activeCat;
      return matchSearch && matchCat;
    });
  }, [query, activeCat]);

  // CUSTOM SPRING ANIMATION
  const toggleAccordion = (id: number) => {
    LayoutAnimation.configureNext({
      duration: 400,
      create: { type: 'spring', property: 'opacity', springDamping: 0.7 },
      update: { type: 'spring', springDamping: 0.8 },
      delete: { type: 'spring', property: 'opacity', springDamping: 0.7 },
    });
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={UNIVERSITY_WHITE} />
      
      {/* HEADER NAVIGATION */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={24} color={UNIVERSITY_RED} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>E-Voter Support</Text>
        <TouchableOpacity onPress={() => Linking.openURL('tel:+254789757457')}>
          <MaterialCommunityIcons name="headset" size={24} color={UNIVERSITY_RED} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        
        {/* HERO BRANDING */}
        <View style={styles.heroSection}>
          <Text style={styles.heroSub}>Laikipia University</Text>
          <Text style={styles.heroTitle}>Smart FAQ Center</Text>
          <View style={styles.healthContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Secure Server Active</Text>
          </View>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#999" />
          <TextInput 
            placeholder="Search for security, results, etc..." 
            placeholderTextColor="#999"
            style={styles.searchInput}
            value={query}
            onChangeText={(text) => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setQuery(text);
            }}
          />
        </View>

        {/* HORIZONTAL FILTERS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
          {categories.map((c) => (
            <TouchableOpacity 
              key={c} 
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setActiveCat(c);
              }}
              style={[styles.filterBtn, activeCat === c && styles.filterBtnActive]}
            >
              <Text style={[styles.filterBtnText, activeCat === c && styles.filterBtnTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* FAQ LIST WITH ANIMATED DROPDOWNS */}
        <View style={styles.listContainer}>
          {filteredFaqs.map((faq) => (
            <View 
                key={faq.id} 
                style={[
                    styles.faqCard, 
                    expandedId === faq.id && styles.faqCardActive
                ]}
            >
                <TouchableOpacity 
                    onPress={() => toggleAccordion(faq.id)}
                    activeOpacity={0.7}
                    style={styles.faqHeader}
                >
                    <View style={styles.qBox}>
                        <Text style={styles.qText}>Q</Text>
                    </View>
                    <Text style={styles.questionText}>{faq.q}</Text>
                    <Ionicons 
                        name={expandedId === faq.id ? "chevron-up-circle" : "chevron-down-circle-outline"} 
                        size={22} 
                        color={expandedId === faq.id ? UNIVERSITY_RED : "#CCC"} 
                    />
                </TouchableOpacity>

                {expandedId === faq.id && (
                    <View style={styles.answerContainer}>
                        <View style={styles.divider} />
                        <Text style={styles.answerText}>{faq.a}</Text>
                        <View style={styles.metaRow}>
                            <View style={styles.tagPill}>
                                <Text style={styles.tagPillText}>{faq.cat}</Text>
                            </View>
                            <TouchableOpacity style={styles.copyBtn}>
                                <Feather name="copy" size={14} color={UNIVERSITY_RED} />
                                <Text style={styles.copyBtnText}>Copy Info</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
          ))}
        </View>

        {/* SUPPORT ESCALATION */}
        <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>Couldn't find an answer?</Text>
            <Text style={styles.contactDesc}>Our student helpdesk is live 24/7 during the election period.</Text>
            <TouchableOpacity 
                style={styles.ctaButton}
                onPress={() => Linking.openURL('https://wa.me/254789757457')}
            >
                <Ionicons name="logo-whatsapp" size={20} color={UNIVERSITY_WHITE} />
                <Text style={styles.ctaButtonText}>Message UEC Helpdesk</Text>
            </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
            <Octicons name="shield-check" size={16} color={UNIVERSITY_RED} />
            <Text style={styles.footerText}>SECURED BY LUSA ELECTORAL COMMISSION</Text>
            <Text style={styles.devText}>PRODUCED BY GAKENYE NDIRITU • 2026</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: UNIVERSITY_WHITE },
  topNav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: BORDER_COLOR
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT_RED_LIGHT, justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 13, fontWeight: "900", color: PRIMARY_DARK, textTransform: 'uppercase', letterSpacing: 1 },
  
  scrollBody: { padding: 20 },

  heroSection: { marginBottom: 25 },
  heroSub: { fontSize: 13, fontWeight: '800', color: UNIVERSITY_RED, textTransform: 'uppercase', letterSpacing: 2 },
  heroTitle: { fontSize: 32, fontWeight: '900', color: PRIMARY_DARK, marginTop: 4 },
  healthContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginRight: 8 },
  statusText: { fontSize: 11, fontWeight: '700', color: '#666', textTransform: 'uppercase' },

  searchBox: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', 
    height: 55, borderRadius: 18, paddingHorizontal: 15, borderWidth: 1, borderColor: '#EEE', marginBottom: 20
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '600', color: PRIMARY_DARK },

  filterBar: { marginBottom: 25 },
  filterBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, backgroundColor: '#F8F9FA', marginRight: 10, borderWidth: 1, borderColor: '#EEE' },
  filterBtnActive: { backgroundColor: UNIVERSITY_RED, borderColor: UNIVERSITY_RED },
  filterBtnText: { fontSize: 12, fontWeight: '800', color: '#888' },
  filterBtnTextActive: { color: UNIVERSITY_WHITE },

  listContainer: { marginBottom: 30 },
  faqCard: { backgroundColor: UNIVERSITY_WHITE, borderRadius: 24, marginBottom: 15, borderWidth: 1, borderColor: BORDER_COLOR, overflow: 'hidden' },
  faqCardActive: { borderColor: UNIVERSITY_RED, elevation: 4, shadowColor: UNIVERSITY_RED, shadowOpacity: 0.1, shadowRadius: 10 },
  faqHeader: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  qBox: { width: 30, height: 30, borderRadius: 10, backgroundColor: ACCENT_RED_LIGHT, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  qText: { color: UNIVERSITY_RED, fontWeight: '900', fontSize: 14 },
  questionText: { flex: 1, fontSize: 15, fontWeight: '800', color: PRIMARY_DARK, lineHeight: 22 },
  
  answerContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  divider: { height: 1, backgroundColor: '#F5F5F5', marginBottom: 15 },
  answerText: { fontSize: 14, color: '#555', lineHeight: 24, fontWeight: '500' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  tagPill: { backgroundColor: '#F0F0F0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagPillText: { fontSize: 9, fontWeight: '900', color: '#AAA', textTransform: 'uppercase' },
  copyBtn: { flexDirection: 'row', alignItems: 'center' },
  copyBtnText: { fontSize: 11, fontWeight: '800', color: UNIVERSITY_RED, marginLeft: 5 },

  contactSection: { backgroundColor: PRIMARY_DARK, padding: 30, borderRadius: 32, alignItems: 'center' },
  contactTitle: { color: UNIVERSITY_WHITE, fontSize: 18, fontWeight: '900' },
  contactDesc: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontSize: 13, marginTop: 8, lineHeight: 20 },
  ctaButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: UNIVERSITY_RED, paddingHorizontal: 25, paddingVertical: 16, borderRadius: 20, marginTop: 25 },
  ctaButtonText: { color: UNIVERSITY_WHITE, fontWeight: '900', marginLeft: 10, fontSize: 14 },

  footer: { marginTop: 40, alignItems: 'center', paddingBottom: 30 },
  footerText: { fontSize: 9, fontWeight: '900', color: '#BBB', letterSpacing: 1.5, marginTop: 10 },
  devText: { fontSize: 8, color: '#DDD', marginTop: 4, fontWeight: '700' }
});