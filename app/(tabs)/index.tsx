import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  FlatList,
  Modal,
  Animated,
  Easing,
} from "react-native";
import { StatusBar } from "expo-status-bar"; 
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Animatable from "react-native-animatable";
import { Ionicons } from "@expo/vector-icons"; 
import { useRouter } from "expo-router"; 

import {
  useGetAllElectionsQuery,
} from "@/src/store/Apis/Election.Api";

import {
  useGetCandidatesByElectionQuery,
  Candidate,
} from "@/src/store/Apis/Candidates.Api";

import { useGetUsersCountQuery } from "@/src/store/Apis/User.Api";
import { useGetElectionResultsQuery } from "@/src/store/Apis/Voting.Api";

// --- CUSTOM TOAST COMPONENT ---
const Toast = ({ visible, message, type = "success" }: { visible: boolean; message: string; type?: "success" | "error" }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 20,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Animated.View style={[styles.toastContainer, { transform: [{ translateY: slideAnim }] }]}>
      <View style={[styles.toastContent, type === "error" && { borderLeftColor: "#ef4444" }]}>
        <Ionicons 
          name={type === "success" ? "checkmark-circle" : "alert-circle"} 
          size={20} 
          color={type === "success" ? "#c8102e" : "#ef4444"} 
        />
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

// --- QUICK STATS COMPONENT ---
const QuickStats = ({ candidateCount, positionCount, daysLeft, remainingElections }: { candidateCount: number, positionCount: number, daysLeft: number, remainingElections: number }) => {
  const stats = [
    { label: "Candidates", value: candidateCount, icon: "people-circle" },
    { label: "Positions", value: positionCount, icon: "list" },
    { label: `Days (${remainingElections} left)`, value: daysLeft > 0 ? daysLeft : 0, icon: "time" },
  ];

  return (
    <View style={styles.statsRow}>
      {stats.map((stat, i) => (
        <Animatable.View key={i} animation="zoomIn" delay={i * 100} style={styles.statCard}>
          <View style={styles.statIconBg}>
            <Ionicons name={stat.icon as any} size={18} color="#c8102e" />
          </View>
          <Text style={stat.label.includes("Days") ? [styles.statValue, {fontSize: 14}] : styles.statValue}>{stat.value}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </Animatable.View>
      ))}
    </View>
  );
};

// --- FAQ COMPONENT ---
const ElectionFAQ = () => {
  const [expanded, setExpanded] = useState<number | null>(null);
  const faqs = [
    { q: "How do I cast my vote online?", a: "Navigate to the 'Vote' tab, choose your candidates for each available seat, and click 'Cast Vote'. Your choice is then encrypted and sent to the blockchain." },
    { q: "Is my vote truly anonymous?", a: "Yes. Using blockchain technology, your identity is verified but your specific vote is decoupled from your personal details to ensure total privacy." },
    { q: "Do I need to pay for transactions (Gas fees)?", a: "No. The system uses a 'Meta-Transaction' model where the University/Admin pays the Ethereum Sepolia gas fees so students can vote for free." },
    { q: "What is Ethereum Sepolia?", a: "It is the blockchain network where all election results are stored. It ensures that once a vote is cast, it can never be deleted or modified by anyone, including the admins." },
    { q: "Can I change my vote later?", a: "No. To maintain election integrity, once a vote is recorded on the blockchain, it cannot be altered or deleted." }
  ];

  return (
    <View style={styles.faqSection}>
      <Text style={styles.sectionTitle}>Help & Support</Text>
      {faqs.map((faq, i) => (
        <TouchableOpacity key={i} style={styles.faqItem} activeOpacity={0.7} onPress={() => setExpanded(expanded === i ? null : i)}>
          <View style={styles.faqHeader}>
            <Text style={styles.faqQuestion}>{faq.q}</Text>
            <Ionicons name={expanded === i ? "chevron-up" : "chevron-down"} size={16} color="#c8102e" />
          </View>
          {expanded === i && (
            <Animatable.Text animation="fadeIn" style={styles.faqAnswer}>{faq.a}</Animatable.Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

// --- Participation Tracker Component ---
const ParticipationTracker = ({ totalVotes, totalVoters }: { totalVotes: number; totalVoters: number }) => {
  const percentage = totalVoters > 0 ? (totalVotes / totalVoters) * 100 : 0;
  return (
    <View style={styles.trackerContainer}>
      <View style={styles.trackerTextRow}>
        <Text style={styles.trackerLabel}>Real-time Turnout</Text>
        <Text style={styles.trackerPercent}>{percentage.toFixed(1)}%</Text>
      </View>
      <View style={styles.progressBackground}>
        <Animatable.View 
          animation="fadeInLeft" 
          duration={1500}
          useNativeDriver={false}
          style={[styles.progressFill, { width: `${percentage}%` }]} 
        />
      </View>
      <Text style={styles.voteCountSubtext}>{totalVotes.toLocaleString()} votes cast out of {totalVoters.toLocaleString()} registered</Text>
    </View>
  );
};

// --- Election Roadmap Component ---
const ElectionRoadmap = ({ status }: { status: string }) => {
  const phases = ["Upcoming", "Ongoing", "Tallying", "Ended"];
  const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  const currentIdx = phases.indexOf(normalizedStatus);

  return (
    <View style={styles.roadmapContainer}>
      <Text style={styles.roadmapTitle}>Election Progress</Text>
      <View style={styles.roadmapRow}>
        {phases.map((phase, index) => (
          <React.Fragment key={phase}>
            <View style={styles.stepWrapper}>
              <View style={[styles.stepCircle, index <= currentIdx && styles.activeStepCircle]}>
                {index < currentIdx ? (
                   <Ionicons name="checkmark" size={14} color="#fff" />
                ) : (
                   <Text style={[styles.stepNumber, index <= currentIdx && styles.activeStepNumber]}>{index + 1}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, index === currentIdx && styles.activeStepLabel]}>{phase}</Text>
            </View>
            {index < phases.length - 1 && <View style={[styles.stepLine, index < currentIdx && styles.activeStepLine]} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

// --- Countdown Component ---
const CountdownTimer = ({ targetDate, label }: { targetDate: string; label: string }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;
      if (distance < 0) {
        setIsPast(true);
        clearInterval(timer);
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          secs: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (isPast) return null;

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <View style={styles.timeUnitContainer}>
      <View style={styles.timeCard}>
        <Text style={styles.timeValue}>{value.toString().padStart(2, '0')}</Text>
      </View>
      <Text style={styles.timeLabel}>{label}</Text>
    </View>
  );

  return (
    <Animatable.View animation="fadeIn" duration={800} style={styles.countdownContainer}>
      <Text style={styles.countdownHeader}>{label}</Text>
      <View style={styles.timerRow}>
        <TimeUnit value={timeLeft.days} label="Days" />
        <Text style={styles.separator}>:</Text>
        <TimeUnit value={timeLeft.hours} label="Hrs" />
        <Text style={styles.separator}>:</Text>
        <TimeUnit value={timeLeft.mins} label="Min" />
        <Text style={styles.separator}>:</Text>
        <TimeUnit value={timeLeft.secs} label="Sec" />
      </View>
    </Animatable.View>
  );
};

interface User {
  name: string;
  school: string;
  role: string;
  reg_no: string;
}

interface Position {
  id: string;
  name: string;
  election_id?: string;
}

export default function Home() {
  const router = useRouter(); 
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [positionsMap, setPositionsMap] = useState<Record<string, string>>({});
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const parsed: User = JSON.parse(userData);
          setUser({
            name: parsed.name || "User",
            school: parsed.school || "",
            role: parsed.role || "Voter",
            reg_no: parsed.reg_no || "",
          });
        }
      } catch (e) {
        console.error("Failed to load user storage", e);
      }
    };
    loadUser();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 21) return "Good evening";
    return "Good night";
  };

  const { data: electionsData, refetch: refetchElections, isLoading: isLoadingElections } = useGetAllElectionsQuery();
  const { data: userCountData, refetch: refetchUserCount } = useGetUsersCountQuery();

  // Find the latest election
  const latestElection = useMemo(() => {
    if (!electionsData?.elections) return null;
    return [...electionsData.elections].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }, [electionsData]);

  const latestElectionId = latestElection?.id || "";

  // REFINED POSITION LOGIC: Fetch and filter positions for the LATEST election only
  useEffect(() => {
    const fetchPositions = async () => {
      if (!latestElectionId) return;
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch("https://online-voting-system-oq4p.onrender.com/api/positions/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: { positions: Position[] } = await res.json();
        const map: Record<string, string> = {};
        if (data.positions) {
          // Filter positions that belong to this specific latest election
          data.positions
            .filter(pos => !pos.election_id || pos.election_id === latestElectionId)
            .forEach((pos) => (map[pos.id] = pos.name));
        }
        setPositionsMap(map);
      } catch (err) {
        console.error("Failed to load positions:", err);
      }
    };
    fetchPositions();
  }, [latestElectionId]);

  const roadmapStatus = useMemo(() => {
    if (!latestElection) return "upcoming";
    const now = new Date().getTime();
    if (now < new Date(latestElection.start_date).getTime()) return "upcoming";
    if (now < new Date(latestElection.end_date).getTime()) return "ongoing";
    if (now < new Date(latestElection.delegate_end_date).getTime()) return "tallying";
    return "ended";
  }, [latestElection]);

  const remainingElectionsCount = useMemo(() => {
    const now = new Date().getTime();
    return (electionsData?.elections || []).filter(e => new Date(e.start_date).getTime() > now).length;
  }, [electionsData]);

  const { data: allCandidatesData, isLoading: isLoadingAll } = useGetCandidatesByElectionQuery(latestElectionId, { skip: !latestElectionId });
  const { data: resultsData, refetch: refetchResults, isLoading: isLoadingResults } = useGetElectionResultsQuery(latestElectionId, { skip: !latestElectionId });

  const { totalVotes } = useMemo(() => {
    const rawResults = (resultsData?.data || []) as any[];
    const total = rawResults.reduce((acc, curr) => acc + Number(curr.votes_count || 0), 0);
    return { totalVotes: total };
  }, [resultsData]);

  const candidates = useMemo(() => {
    let list = allCandidatesData?.candidates || [];
    if (latestElectionId) {
      list = list.filter(c => c.election_id === latestElectionId);
    }
    if (search) {
      list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    }
    return list;
  }, [allCandidatesData, search, latestElectionId]);

  const onRefresh = async () => {
    setRefreshing(true);
    try { 
      await Promise.all([refetchElections(), refetchUserCount(), refetchResults()]);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 3000); 
    } catch(e) {
      console.error(e);
    } finally { 
      setRefreshing(false); 
    }
  };

  const getInitials = (name: string) => {
    const words = name.split(" ");
    return words.length >= 2 ? `${words[0][0]}${words[1][0]}` : name.substring(0, 2);
  };

  const getDaysDiff = (date: string) => {
    const diff = new Date(date).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      <Toast visible={toastVisible} message="Content refreshed successfully" />

      <View style={styles.topHeader}>
        <Animatable.View animation="fadeInLeft" style={styles.headerLeft}>
          <Image source={require('@/assets/images/Laikipia-logo.png')} style={styles.logo} />
          <View>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.userNameText}>{user?.name || "User"}</Text>
          </View>
        </Animatable.View>
        <TouchableOpacity 
          style={styles.notifBell} 
          onPress={() => router.push("/more/notifications" as any)}
        >
          <Ionicons name="notifications-outline" size={26} color="#c8102e" />
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#c8102e"]} />}
      >
        <Animatable.View animation="fadeIn" duration={1000} style={styles.mottoSection}>
            <Text style={styles.mottoText}>Empowering Students Through Transparent Tech.</Text>
        </Animatable.View>

        <View style={styles.statsStrip}>
           <Text style={styles.schoolTag}><Ionicons name="school" size={12}/> {user?.school || "-"}</Text>
           <Text style={styles.roleTag}><Ionicons name="ribbon" size={12}/> {user?.role || "-"}</Text>
        </View>

        <QuickStats 
           candidateCount={candidates.length} 
           positionCount={Object.keys(positionsMap).length}
           daysLeft={latestElection ? getDaysDiff(latestElection.start_date) : 0}
           remainingElections={remainingElectionsCount}
        />

       <Animatable.View animation="fadeInUp" duration={1000} style={styles.electionCard}>
          <View style={styles.cardHeader}>
            <View>
                <Text style={styles.cardTitle}>
                {latestElection?.name || "No election available"}
                </Text>
                {/* NEW: Election Category Detail */}
                <Text style={{ fontSize: 12, color: '#c8102e', fontWeight: '600' }}>
                   {latestElection?.name.toUpperCase() || "UNIVERSITY"} ELECTION
                </Text>
            </View>
            {latestElection?.status === 'ongoing' ? (
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
            ) : (
              <View style={[styles.liveBadge, { backgroundColor: '#666' }]}>
                <Text style={styles.liveBadgeText}>
                  {latestElection?.status?.toUpperCase() || "UPCOMING"}
                </Text>
              </View>
            )}
          </View>
  
          {isLoadingElections || isLoadingResults ? (
            <ActivityIndicator size="small" color="#c8102e" />
          ) : latestElection ? (
            <>
              {new Date(latestElection.start_date).getTime() > new Date().getTime() ? (
                <CountdownTimer 
                  targetDate={latestElection.start_date} 
                  label="Polls Open In:" 
                />
              ) : new Date(latestElection.end_date).getTime() > new Date().getTime() ? (
                <View>
                  <CountdownTimer 
                    targetDate={latestElection.end_date} 
                    label="Polls Close In:" 
                  />
                  <ParticipationTracker 
                    totalVotes={totalVotes} 
                    totalVoters={userCountData?.count || 0} 
                  />
                </View>
              ) : new Date(latestElection.delegate_end_date).getTime() > new Date().getTime() ? (
                <View>
                  <View style={styles.delegateInfoBox}>
                    <Text style={styles.delegateLabel}>Delegate Voting Period Active</Text>
                    <Text style={styles.delegateTime}>
                      Main polls closed. Verification by delegates ongoing.
                    </Text>
                  </View>
                  <CountdownTimer 
                    targetDate={latestElection.delegate_end_date} 
                    label="Delegate Voting Ends In:" 
                  />
                </View>
              ) : (
                <View style={styles.endedTag}>
                  <Text style={styles.statusEnded}>Election & Delegate Period Closed</Text>
                </View>
              )}
              
              {/* NEW: Display Start/End Dates for clarity */}
              <View style={{ marginTop: 15, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 }}>
                  <Text style={{ fontSize: 11, color: '#777' }}>
                    <Ionicons name="calendar-outline" size={10} /> Main Voting: {new Date(latestElection.start_date).toLocaleDateString()} - {new Date(latestElection.end_date).toLocaleDateString()}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#777', marginTop: 3 }}>
                    <Ionicons name="medal-outline" size={10} /> Tallying Ends: {new Date(latestElection.delegate_end_date).toLocaleDateString()}
                  </Text>
              </View>

              <Text style={{ fontSize: 10, color: '#999', marginTop: 10, textAlign: 'center' }}>
                Blockchain Node: Ethereum Sepolia | Ref: {latestElection.id.substring(0, 8)}...
              </Text>
            </>
          ) : null}
        </Animatable.View>

        <View style={styles.trustCard}>
           <View style={styles.trustIconBg}><Ionicons name="shield-checkmark" size={24} color="#fff" /></View>
           <View style={styles.trustTextContent}>
              <Text style={styles.trustLabel}>Secured by Blockchain</Text>
              <Text style={styles.trustDesc}>Your vote is immutable and transparently recorded online.</Text>
           </View>
        </View>

        {latestElection && (
          <Animatable.View animation="fadeInUp" duration={1000} delay={100}>
            <ElectionRoadmap status={roadmapStatus} />
          </Animatable.View>
        )}

        <View style={styles.candidatesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Candidates</Text>
            <TouchableOpacity onPress={() => router.push("/Candidate" as any)}>
                <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.filtersWrapper}>
            <View style={styles.searchBar}>
               <Ionicons name="search" size={16} color="#999" />
               <TextInput style={styles.searchBarInput} placeholder="Quick search candidates..." value={search} onChangeText={setSearch} />
            </View>
          </View>

          {isLoadingAll ? <ActivityIndicator size="large" color="#c8102e" style={{ marginTop: 20 }} /> :
              <FlatList
                data={candidates}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 10 }}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.candidateCard}
                    activeOpacity={0.9}
                    onPress={() => { setSelectedCandidate(item); setModalVisible(true); }}
                  >
                    {item.photo_url ? <Image source={{ uri: item.photo_url }} style={styles.candidatePhoto} /> :
                      <View style={styles.initialsCircle}><Text style={styles.initialsText}>{getInitials(item.name)}</Text></View>}
                    <Text numberOfLines={1} style={styles.candidateName}>{item.name}</Text>
                    <Text numberOfLines={1} style={styles.candidatePosition}>{positionsMap[item.position_id] || "Candidate"}</Text>
                    <View style={styles.detailsTag}>
                      <Text style={styles.detailsTagText}>Manifesto</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />}
        </View>

        <ElectionFAQ />

        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <Animatable.View animation="zoomIn" duration={300} style={styles.modalCard}>
              {selectedCandidate && (
                <>
                  <View style={styles.modalHeader}>
                     <View style={{ flex: 1 }}>
                        <Text style={styles.modalName}>{selectedCandidate.name}</Text>
                        <Text style={styles.modalPosition}>{positionsMap[selectedCandidate.position_id] || "Position"}</Text>
                        
                     </View>
                     <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeModalBtn}>
                        <Ionicons name="close" size={24} color="#333" />
                     </TouchableOpacity>
                  </View>
                  <View style={styles.manifestoContainer}>
                     <Text style={styles.manifestoTitle}>My Manifesto Preview</Text>
                     <Text style={styles.modalManifesto} numberOfLines={4}>
                        {selectedCandidate.manifesto|| "Check the candidate's page for the latest manifesto updates and platform details.."}
                     </Text>
                  </View>
                </>
              )}
            </Animatable.View>
          </View>
        </Modal>
        
        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  // New Toast Styles
  toastContainer: {
    position: 'absolute',
    top: 50, 
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastContent: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#c8102e',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    width: '100%',
  },
  toastText: {
    color: '#111',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 10,
  },
  
  // Existing Styles
  safeArea: { flex: 1, backgroundColor: "#fff" },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, backgroundColor: '#fff', paddingBottom: 15 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 45, height: 45, marginRight: 12, borderRadius: 12 },
  greetingText: { fontSize: 13, color: "#888", fontWeight: '500' },
  userNameText: { fontSize: 18, fontWeight: "800", color: "#111" },
  notifBell: { padding: 10, backgroundColor: '#FEF2F2', borderRadius: 12 },
  bellDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', borderWidth: 2, borderColor: '#fff' },
  
  container: { padding: 20, flexGrow: 1, backgroundColor: "#F9FAFB" },
  mottoSection: { marginBottom: 15, paddingHorizontal: 5 },
  mottoText: { fontSize: 13, fontStyle: 'italic', color: '#666', fontWeight: '600' },
  statsStrip: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  schoolTag: { fontSize: 11, backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#eee', color: '#666' },
  roleTag: { fontSize: 11, backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#eee', color: '#666' },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#fff', marginHorizontal: 4, padding: 12, borderRadius: 20, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  statIconBg: { backgroundColor: '#FEF2F2', padding: 8, borderRadius: 12, marginBottom: 5 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#111' },
  statLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', marginTop: 2 },

  trustCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 15, borderRadius: 20, marginBottom: 25, elevation: 4 },
  trustIconBg: { backgroundColor: '#c8102e', padding: 10, borderRadius: 12, marginRight: 15 },
  trustTextContent: { flex: 1 },
  trustLabel: { fontSize: 12, color: '#fff', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  trustDesc: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

  electionCard: { backgroundColor: "#fff", borderRadius: 24, padding: 20, elevation: 8, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 15, marginBottom: 25 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 20, fontWeight: "900", color: "#111", flex: 1 },
  liveBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  liveBadgeText: { color: '#166534', fontSize: 10, fontWeight: '900' },
  
  countdownContainer: {
    backgroundColor: "#c8102e",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    marginVertical: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  countdownHeader: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  timeUnitContainer: {
    alignItems: "center",
    width: 60,
  },
  timeCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingVertical: 8,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  timeValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  timeLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 6,
    textTransform: "uppercase",
  },
  separator: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 20,
    fontWeight: "900",
    marginHorizontal: 2,
    marginTop: -20,
  },

  timerRow: { flexDirection: "row", alignItems: "center", marginTop: 4, justifyContent: "center" },
  endedTag: { backgroundColor: '#F3F4F6', padding: 10, borderRadius: 12, alignItems: 'center' },
  statusEnded: { color: "#999", fontSize: 14, fontWeight: "800" },
  
  trackerContainer: { marginVertical: 10 },
  trackerTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  trackerLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
  trackerPercent: { fontSize: 14, fontWeight: '900', color: '#c8102e' },
  progressBackground: { height: 10, backgroundColor: '#F3F4F6', borderRadius: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#c8102e', borderRadius: 10 },
  voteCountSubtext: { fontSize: 10, color: '#9CA3AF', marginTop: 6, textAlign: 'center', fontWeight: '600' },

  roadmapContainer: { marginBottom: 30, backgroundColor: '#fff', padding: 20, borderRadius: 24, elevation: 2 },
  roadmapTitle: { fontSize: 16, fontWeight: "900", color: "#111", marginBottom: 20 },
  roadmapRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepWrapper: { alignItems: 'center', flex: 1 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', zIndex: 2, borderWidth: 2, borderColor: '#fff' },
  activeStepCircle: { backgroundColor: '#c8102e' },
  stepNumber: { fontSize: 12, fontWeight: 'bold', color: '#9CA3AF' },
  activeStepNumber: { color: '#fff' },
  stepLabel: { fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 8, fontWeight: '700' },
  activeStepLabel: { color: '#c8102e' },
  stepLine: { height: 4, flex: 1, backgroundColor: '#F3F4F6', marginHorizontal: -15, marginTop: -18, zIndex: 1 },
  activeStepLine: { backgroundColor: '#c8102e' },

  candidatesSection: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: "900", color: "#111" },
  viewAllText: { color: '#c8102e', fontWeight: '700', fontSize: 13 },
  filtersWrapper: { marginBottom: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 12, height: 48, borderWidth: 1, borderColor: '#E5E7EB' },
  searchBarInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#111' },
  
  candidateCard: { width: 165, backgroundColor: "#fff", borderRadius: 24, padding: 10, marginRight: 15, elevation: 6, shadowColor: '#000', shadowOpacity: 0.08, alignItems: "center", borderWidth: 1, borderColor: '#F3F4F6' },
  candidatePhoto: { width: 85, height: 85, borderRadius: 20, marginBottom: 12 },
  initialsCircle: { width: 85, height: 85, borderRadius: 20, backgroundColor: "#c8102e", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  initialsText: { color: "#fff", fontSize: 30, fontWeight: "900" },
  candidateName: { fontSize: 14, fontWeight: "900", color: '#111' },
  candidatePosition: { fontSize: 11, color: "#9CA3AF", fontWeight: '700', marginBottom: 12 },
  detailsTag: { backgroundColor: '#111', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  detailsTagText: { color: '#fff', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },

  newsSection: { marginBottom: 30 },
  tickerContainer: { flexDirection: 'row', backgroundColor: '#FEF2F2', borderRadius: 16, overflow: 'hidden', alignItems: 'center', height: 48 },
  tickerBadge: { backgroundColor: '#c8102e', paddingHorizontal: 15, height: '100%', justifyContent: 'center' },
  tickerBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  tickerWrapper: { flexDirection: 'row', alignItems: 'center' },
  tickerText: { fontSize: 13, fontWeight: '700', color: '#c8102e', paddingLeft: 10 },

  faqSection: { marginBottom: 30 },
  faqItem: { backgroundColor: '#fff', padding: 18, borderRadius: 20, marginBottom: 12, elevation: 1, borderWidth: 1, borderColor: '#F3F4F6' },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontSize: 13, fontWeight: '800', color: '#111', flex: 1, paddingRight: 10 },
  faqAnswer: { fontSize: 13, color: '#6B7280', marginTop: 12, lineHeight: 20, fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" },
  modalCard: { width: "90%", backgroundColor: "#fff", borderRadius: 30, padding: 25, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalName: { fontSize: 24, fontWeight: "900", color: "#111" },
  modalPosition: { fontSize: 14, color: "#c8102e", fontWeight: '800', marginTop: 2 },
  closeModalBtn: { padding: 5, backgroundColor: '#f3f4f6', borderRadius: 10 },
  manifestoContainer: { marginVertical: 20, padding: 15, backgroundColor: '#f9fafb', borderRadius: 20, borderWidth: 1, borderColor: '#eee' },
  manifestoTitle: { fontSize: 12, fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 1 },
  modalManifesto: { fontSize: 15, color: "#4B5563", lineHeight: 24, fontWeight: '500' },
  closeButton: { backgroundColor: "#111", borderRadius: 18, paddingVertical: 16, alignItems: "center", marginTop: 10, elevation: 4 },
  closeButtonText: { color: "#fff", fontSize: 14, fontWeight: "900", textTransform: 'uppercase', letterSpacing: 1 },
  footerSpace: { height: 40 },
  delegateInfoBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#fee2e2",
    alignItems: "center",
  },
  delegateLabel: {
    color: "#c8102e",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  delegateTime: {
    color: "#4b5563",
    fontSize: 13,
    fontWeight: "500",
  },
  

});