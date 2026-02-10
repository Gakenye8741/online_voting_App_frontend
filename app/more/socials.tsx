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
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5, Octicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const UNIVERSITY_RED = "#D32F2F";
const UNIVERSITY_WHITE = "#FFFFFF";
const PRIMARY_DARK = "#1A1A1A";

const FAQ_DATABASE = [
  { id: 1, cat: "Voting", q: "How do I cast my ballot?", a: "Navigate to the 'Voting Dashboard', select your preferred candidate for each seat, and click 'Cast Vote'. You will be asked for a final biometric or PIN confirmation." },
  { id: 2, cat: "Voting", q: "Can I skip a specific elective seat?", a: "Yes. If you do not wish to vote for a particular post, you can select 'Abstain' or leave it blank, and the system will proceed to the next seat." },
  { id: 3, cat: "Voting", q: "Is there a time limit for voting?", a: "Once you enter the voting booth (the final selection screen), you have 3 minutes to finalize your choices before the session times out for security." },
  { id: 4, cat: "Voting", q: "What if I accidentally vote for the wrong person?", a: "The system provides a 'Review' screen before submission. Once you click 'Confirm Final Ballot', the action is permanent." },
  { id: 5, cat: "Voting", q: "Can I vote using two different phones?", a: "No. Your account is tied to a single active session. Logging into a second device will automatically terminate the first session." },
  { id: 6, cat: "Security", q: "How is my vote kept secret?", a: "We use E2EE (End-to-End Encryption). Your student ID verifies eligibility; the ballot itself is detached and stored anonymously." },
  { id: 7, cat: "Security", q: "What is the 'Digital Fingerprint' at the end?", a: "It is a unique SHA-256 hash. You can use this to verify your vote was counted without revealing your specific choice." },
  { id: 8, cat: "Security", q: "Is the app protected against hackers?", a: "Yes. The platform includes Cloudflare WAF protection, DDoS mitigation, and SQL injection filters for every packet." },
  { id: 9, cat: "Security", q: "What if a candidate asks for my login?", a: "Sharing credentials violates University Statute. If detected, your voting rights will be revoked and disciplinary action taken." },
  { id: 10, cat: "Security", q: "Does the app track my location?", a: "We only verify that your IP address originates from a legitimate network to prevent foreign bot-net interference." },
  { id: 11, cat: "Technical", q: "The app is not loading images.", a: "This usually happens on slow campus Wi-Fi. Try switching to mobile data or clearing your app cache in Settings." },
  { id: 12, cat: "Technical", q: "I didn't receive the MFA OTP code.", a: "Ensure your phone has network. If it fails, use the 'Resend via Email' option for your student inbox." },
  { id: 13, cat: "Technical", q: "Does this app consume much data?", a: "No. The app is optimized for 'Lite' usage. A full session typically consumes less than 2MB." },
  { id: 14, cat: "Technical", q: "Is my phone OS supported?", a: "We support Android 7.0+ and iOS 12+. For older phones, please use the university computer labs." },
  { id: 15, cat: "Technical", q: "I see a '403 Forbidden' error.", a: "This means your student status is currently 'Inactive'. Contact the Registrar to update your semester registration." },
  { id: 16, cat: "Results", q: "Can I see live results?", a: "Live results are disabled to prevent bandwagon effects. Tallies are only visible to UEC Commissioners until polls close." },
  { id: 17, cat: "Results", q: "How long to count votes?", a: "Counting is instantaneous, but UEC performs a 1-hour audit after polls close before the official reveal." },
  { id: 18, cat: "Results", q: "What happens in the event of a tie?", a: "Per UEC guidelines, a tie triggers a 'Run-off' election for that specific seat within 48 hours." },
  { id: 19, cat: "Results", q: "Are the results legally binding?", a: "Yes. These are the official records for the Student Union (LUSA) elections." },
  { id: 20, cat: "Results", q: "How can I dispute a result?", a: "Disputes must be filed with the University Electoral Tribunal within 24 hours of declaration." },
  { id: 21, cat: "Account", q: "I am a First Year, can I vote?", a: "Yes, provided you have been issued a Reg Number and have completed semester registration." },
  { id: 22, cat: "Account", q: "I am on attachment, can I vote?", a: "Absolutely. The system allows off-campus students to exercise their rights remotely." },
  { id: 23, cat: "Account", q: "Can international students vote?", a: "Eligibility is based on 'Active Student' status, regardless of nationality." },
  { id: 24, cat: "Account", q: "My name is misspelled on the portal.", a: "The app pulls data from the ERP. Misspellings don't affect rights as long as the Reg Number is correct." },
  { id: 25, cat: "Account", q: "What if I graduated last month?", a: "Once marked 'Graduated' in the ERP, you are no longer eligible for student elections." },
];

export default function DetailedFAQ() {
  const navigation = useNavigation();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [openId, setOpenId] = useState<number | null>(null);

  const categories = ["All", "Voting", "Security", "Technical", "Results", "Account"];

  const filteredData = useMemo(() => {
    return FAQ_DATABASE.filter(item => {
      const match = item.q.toLowerCase().includes(query.toLowerCase()) || 
                    item.a.toLowerCase().includes(query.toLowerCase());
      return category === "All" ? match : (match && item.cat === category);
    });
  }, [query, category]);

  const toggleFAQ = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId(openId === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={UNIVERSITY_WHITE} />
      
      {/* NAVIGATION HEADER */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={UNIVERSITY_RED} />
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>E-Vote Support</Text>
        <TouchableOpacity onPress={() => Linking.openURL('tel:+254789757457')}>
            <Ionicons name="call-outline" size={24} color={UNIVERSITY_RED} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* EXECUTIVE HEADER */}
        <View style={styles.welcomeHeader}>
          <Text style={styles.greetText}>Knowledge Base</Text>
          <Text style={styles.headerTitle}>How can we help?</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Servers: Operational</Text>
            </View>
          </View>
        </View>

        {/* SEARCH BOX */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput 
            placeholder="Search for answers..." 
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* CATEGORY TICKER */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catTicker}>
          {categories.map((cat, i) => (
            <TouchableOpacity 
              key={i} 
              style={[styles.catTag, category === cat && styles.catTagActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.catTagText, category === cat && styles.catTagTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* FAQ LIST */}
        <View style={styles.faqList}>
          {filteredData.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.faqItem, openId === item.id && styles.faqItemActive]}
              onPress={() => toggleFAQ(item.id)}
              activeOpacity={0.9}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{item.q}</Text>
                <Ionicons 
                  name={openId === item.id ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={UNIVERSITY_RED} 
                />
              </View>
              {openId === item.id && (
                <View style={styles.faqAnswerContainer}>
                  <Text style={styles.faqAnswer}>{item.a}</Text>
                  <View style={styles.catIndicator}>
                    <Text style={styles.catIndicatorText}>#{item.cat}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* HELP CARD */}
        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>Still have questions?</Text>
          <Text style={styles.helpText}>Our technical team is available 24/7 during the election period.</Text>
          <TouchableOpacity 
            style={styles.helpButton} 
            onPress={() => Linking.openURL('mailto:ict@laikipia.ac.ke')}
          >
            <Ionicons name="mail-outline" size={20} color={UNIVERSITY_WHITE} />
            <Text style={styles.helpButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <View style={styles.footerContainer}>
           <Text style={styles.footerBrand}>POWERED BY LAIKIPIA UNIVERSITY ICT</Text>
           <Text style={styles.footerSub}>ENGINEERED BY GAKENYE NDIRITU • 2026</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FDFDFD" },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: UNIVERSITY_WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topNavTitle: { fontSize: 14, fontWeight: "800", color: PRIMARY_DARK, textTransform: 'uppercase', letterSpacing: 1 },
  
  container: { padding: 20, paddingBottom: 40 },
  
  welcomeHeader: { marginBottom: 20 },
  greetText: { fontSize: 14, fontWeight: "700", color: UNIVERSITY_RED, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  headerTitle: { fontSize: 32, fontWeight: "900", color: PRIMARY_DARK },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50', marginRight: 6 },
  statusText: { fontSize: 10, fontWeight: '800', color: '#2E7D32' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 15,
    height: 55,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EEE'
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: PRIMARY_DARK, fontWeight: '500' },

  catTicker: { flexDirection: 'row', marginBottom: 25 },
  catTag: { backgroundColor: '#F0F0F0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  catTagActive: { backgroundColor: UNIVERSITY_RED },
  catTagText: { fontSize: 12, fontWeight: '700', color: '#666' },
  catTagTextActive: { color: UNIVERSITY_WHITE },

  faqList: { marginBottom: 20 },
  faqItem: {
    backgroundColor: UNIVERSITY_WHITE,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  faqItemActive: { borderColor: UNIVERSITY_RED, elevation: 2 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontSize: 15, fontWeight: '700', color: PRIMARY_DARK, flex: 1, marginRight: 10 },
  faqAnswerContainer: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 15 },
  faqAnswer: { fontSize: 14, color: '#555', lineHeight: 22 },
  catIndicator: { alignSelf: 'flex-start', marginTop: 10, backgroundColor: '#FFF5F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  catIndicatorText: { fontSize: 10, fontWeight: '800', color: UNIVERSITY_RED },

  helpCard: {
    backgroundColor: PRIMARY_DARK,
    padding: 25,
    borderRadius: 24,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  helpTitle: { fontSize: 20, fontWeight: '800', color: UNIVERSITY_WHITE, marginBottom: 10 },
  helpText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 20, lineHeight: 20 },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: UNIVERSITY_RED,
    padding: 16,
    borderRadius: 16,
  },
  helpButtonText: { color: UNIVERSITY_WHITE, fontWeight: '800', marginLeft: 10, fontSize: 15 },

  footerContainer: { marginTop: 40, alignItems: 'center' },
  footerBrand: { fontSize: 10, fontWeight: '900', color: '#BBB', letterSpacing: 2 },
  footerSub: { fontSize: 9, color: '#DDD', marginTop: 4 }
});