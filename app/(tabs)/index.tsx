import React, { useState, useEffect, useRef } from "react";
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
  Pressable,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Animatable from "react-native-animatable";

import {
  useGetAllElectionsQuery,
  Election,
} from "@/src/store/Apis/Election.Api";

import {
  useGetCandidatesByElectionQuery,
  useGetCandidatesByNameQuery,
  useGetCandidatesByPositionQuery,
  useGetCandidatesBySchoolQuery,
  Candidate,
} from "@/src/store/Apis/Candidates.Api";

// --- News & Announcements Component ---
const Announcements = () => {
  const news = [
    "📢 OFFICIAL: Election venue is the University Business Center (UBC).",
    "🗳️ Reminder: Carry your student ID for verification at the polling station.",
  ];

  const scrollX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);

  useEffect(() => {
    if (textWidth > 0 && containerWidth > 0) {
      const fullDistance = textWidth + containerWidth;
      Animated.loop(
        Animated.timing(scrollX, {
          toValue: -textWidth,
          duration: fullDistance * 70,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [textWidth, containerWidth]);

  return (
    <View style={styles.newsSection}>
      <Text style={styles.sectionTitle}>Latest Updates</Text>
      <View style={styles.tickerContainer} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
        <View style={styles.tickerBadge}>
          <Text style={styles.tickerBadgeText}>URGENT</Text>
        </View>
        <Animated.View style={[styles.tickerWrapper, { transform: [{ translateX: scrollX }] }]}>
          <Text style={styles.tickerText} onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}>
            {news.join("      •      ")}
          </Text>
        </Animated.View>
      </View>
      <View style={styles.newsFeed}>
        {news.map((item, index) => (
          <View key={index} style={styles.newsItem}>
            <View style={styles.newsDot} />
            <Text style={styles.newsItemText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// --- Participation Tracker Component ---
const ParticipationTracker = ({ totalVotes, totalVoters }: { totalVotes: number; totalVoters: number }) => {
  const percentage = totalVoters > 0 ? (totalVotes / totalVoters) * 100 : 0;
  return (
    <View style={styles.trackerContainer}>
      <div style={styles.trackerTextRow}>
        <Text style={styles.trackerLabel}>Voter Participation</Text>
        <Text style={styles.trackerPercent}>{percentage.toFixed(1)}%</Text>
      </div>
      <View style={styles.progressBackground}>
        <Animatable.View 
          animation="stretchX" 
          duration={1500}
          style={[styles.progressFill, { width: `${percentage}%` }]} 
        />
      </View>
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
      <Text style={styles.roadmapTitle}>Election Journey</Text>
      <View style={styles.roadmapRow}>
        {phases.map((phase, index) => (
          <React.Fragment key={phase}>
            <View style={styles.stepWrapper}>
              <View style={[styles.stepCircle, index <= currentIdx && styles.activeStepCircle]}>
                <Text style={[styles.stepNumber, index <= currentIdx && styles.activeStepNumber]}>{index + 1}</Text>
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

  return (
    <View style={styles.countdownBox}>
      <Text style={styles.countdownLabel}>{label}</Text>
      <View style={styles.timerRow}>
        <Text style={styles.timerText}>{timeLeft.days}d : {timeLeft.hours}h : {timeLeft.mins}m : {timeLeft.secs}s</Text>
      </View>
    </View>
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
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState<string | null>(null);
  const [schoolFilter, setSchoolFilter] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [positionsMap, setPositionsMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadUser = async () => {
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

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch("https://online-voting-system-oq4p.onrender.com/api/positions/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: { positions: Position[] } = await res.json();
        const map: Record<string, string> = {};
        data.positions.forEach((pos) => (map[pos.id] = pos.name));
        setPositionsMap(map);
      } catch (err) {
        console.error("Failed to load positions:", err);
      }
    };
    fetchPositions();
  }, []);

  const { data: electionsData, refetch: refetchElections, isLoading: isLoadingElections, error: electionsError } = useGetAllElectionsQuery();

  const latestElection: Election | undefined = electionsData?.elections
    ? [...electionsData.elections].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : undefined;

  const latestElectionId = latestElection?.id || "";
  const roadmapStatus = latestElection?.status ?? "upcoming";

  const { data: allCandidatesData, isLoading: isLoadingAll } = useGetCandidatesByElectionQuery(latestElectionId, { skip: !latestElectionId });
  const { data: searchData } = useGetCandidatesByNameQuery(search, { skip: !search });
  const { data: positionData } = useGetCandidatesByPositionQuery(positionFilter || "", { skip: !positionFilter });
  const { data: schoolData } = useGetCandidatesBySchoolQuery(schoolFilter || "", { skip: !schoolFilter });

  let candidates: Candidate[] = [];
  if (search) candidates = searchData?.candidates || [];
  else if (positionFilter) candidates = positionData?.candidates || [];
  else if (schoolFilter) candidates = schoolData?.candidates || [];
  else candidates = allCandidatesData?.candidates || [];

  const onRefresh = async () => {
    setRefreshing(true);
    try { await refetchElections(); } finally { setRefreshing(false); }
  };

  const getInitials = (name: string) => {
    const words = name.split(" ");
    return words.length >= 2 ? `${words[0][0]}${words[1][0]}` : name.substring(0, 2);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#c8102e"]} />}
      >
        <Animatable.View animation="fadeInDown" duration={1200} style={styles.header}>
          <Image source={require('@/assets/images/Laikipia-logo.png')} style={styles.logo} />
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>{getGreeting()}, {user?.name || "User"}!</Text>
            <Text style={styles.schoolText}>School: {user?.school || "-"}</Text>
            <Text style={styles.roleText}>Role: {user?.role || "-"}</Text>
          </View>
        </Animatable.View>

        <Animatable.Text animation="fadeInDown" duration={1200} delay={200} style={styles.quote}>
          “Your vote is your voice – make it count!”
        </Animatable.Text>

        <Animatable.View animation="fadeInUp" duration={1200} delay={400} style={styles.electionCard}>
          <Text style={styles.cardTitle}>{latestElection?.name || "No election available"}</Text>
          {isLoadingElections ? (
            <ActivityIndicator size="small" color="#c8102e" />
          ) : electionsError ? (
            <Text style={styles.cardText}>Failed to load election</Text>
          ) : latestElection ? (
            <>
              {new Date(latestElection.start_date).getTime() > new Date().getTime() ? (
                <CountdownTimer targetDate={latestElection.start_date} label="Election Starts In:" />
              ) : new Date(latestElection.end_date).getTime() > new Date().getTime() ? (
                <CountdownTimer targetDate={latestElection.end_date} label="Election Ends In:" />
              ) : (
                <Text style={styles.statusEnded}>Election has Ended</Text>
              )}
              {latestElection.status === 'ongoing' && <ParticipationTracker totalVotes={650} totalVoters={1200} />}
              <Text style={styles.cardText}>Start: {new Date(latestElection.start_date).toLocaleString()}</Text>
              <Text style={styles.cardText}>End: {new Date(latestElection.end_date).toLocaleString()}</Text>
              <Text style={[styles.statusBadge, { color: latestElection.status === 'ongoing' ? '#2e7d32' : '#c8102e' }]}>
                Status: {(latestElection.status ?? "UNKNOWN").toUpperCase()}
              </Text>
            </>
          ) : (
            <Text style={styles.cardText}>No elections available</Text>
          )}
        </Animatable.View>

        {latestElection && (
          <Animatable.View animation="fadeInUp" duration={1200} delay={500}>
            <ElectionRoadmap status={roadmapStatus} />
          </Animatable.View>
        )}

        <Animatable.View animation="fadeInUp" duration={1200} delay={600}>
          <Text style={styles.sectionTitle}>Candidates for {latestElection?.name || "this election"}</Text>
          <View style={styles.filtersContainer}>
            <TextInput style={styles.filterInput} placeholder="Search name..." value={search} onChangeText={setSearch} />
            <TextInput style={styles.filterInput} placeholder="Position..." value={positionFilter || ""} onChangeText={setPositionFilter} />
            <TextInput style={styles.filterInput} placeholder="School..." value={schoolFilter || ""} onChangeText={setSchoolFilter} />
            <TouchableOpacity style={styles.clearButton} onPress={() => { setSearch(""); setPositionFilter(null); setSchoolFilter(null); }}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>

          {isLoadingAll ? <ActivityIndicator size="large" color="#c8102e" style={{ marginTop: 20 }} /> :
            candidates.length === 0 ? <Text style={styles.cardText}>No candidates found.</Text> :
              <FlatList
                data={candidates}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <Animatable.View animation="fadeInUp" style={styles.candidateCard}>
                    {item.photo_url ? <Image source={{ uri: item.photo_url }} style={styles.candidatePhoto} /> :
                      <View style={styles.initialsCircle}><Text style={styles.initialsText}>{getInitials(item.name)}</Text></View>}
                    <Text style={styles.candidateName}>{item.name}</Text>
                    <Text style={styles.candidatePosition}>{positionsMap[item.position_id] || "Unknown"}</Text>
                    <TouchableOpacity style={styles.detailsButton} onPress={() => { setSelectedCandidate(item); setModalVisible(true); }}>
                      <Text style={styles.detailsButtonText}>Details</Text>
                    </TouchableOpacity>
                  </Animatable.View>
                )}
              />}
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={1200} delay={550}>
          <Announcements />
        </Animatable.View>

        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <Animatable.View animation="fadeInUp" style={styles.modalCard}>
              {selectedCandidate && <>
                <Text style={styles.modalName}>{selectedCandidate.name}</Text>
                <Text style={styles.modalPosition}>{positionsMap[selectedCandidate.position_id] || "Unknown"}</Text>
                <Text style={styles.modalManifesto}>{selectedCandidate.manifesto || "No manifesto provided."}</Text>
              </>}
              <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>✕ Close</Text>
              </Pressable>
            </Animatable.View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 20, flexGrow: 1 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  logo: { width: 60, height: 60, marginRight: 15 },
  greetingContainer: { flex: 1 },
  greetingText: { fontSize: 22, fontWeight: "700", color: "#c8102e" },
  schoolText: { fontSize: 16, color: "#444" },
  roleText: { fontSize: 16, color: "#444" },
  quote: { fontSize: 16, fontStyle: "italic", color: "#666", marginBottom: 20 },
  electionCard: { backgroundColor: "#fff", borderRadius: 12, padding: 20, borderWidth: 1, borderColor: "#eee", elevation: 3, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#c8102e", marginBottom: 10 },
  cardText: { fontSize: 14, color: "#555", marginBottom: 4 },
  countdownBox: { backgroundColor: "#c8102e", borderRadius: 8, padding: 12, marginBottom: 15, alignItems: "center" },
  countdownLabel: { color: "#fff", fontSize: 12, fontWeight: "600" },
  timerRow: { flexDirection: "row", alignItems: "center" },
  timerText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  statusEnded: { color: "#666", fontSize: 16, fontWeight: "700", textAlign: "center" },
  statusBadge: { fontSize: 14, fontWeight: "700", marginTop: 5 },
  trackerContainer: { marginVertical: 12 },
  trackerTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  trackerLabel: { fontSize: 13, fontWeight: '600' },
  trackerPercent: { fontSize: 13, fontWeight: '700', color: '#c8102e' },
  progressBackground: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#c8102e' },
  roadmapContainer: { marginBottom: 25 },
  roadmapTitle: { fontSize: 18, fontWeight: "700", color: "#c8102e", marginBottom: 15 },
  roadmapRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepWrapper: { alignItems: 'center', flex: 1 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  activeStepCircle: { backgroundColor: '#c8102e' },
  stepNumber: { fontSize: 12, fontWeight: 'bold', color: '#aaa' },
  activeStepNumber: { color: '#fff' },
  stepLabel: { fontSize: 10, color: '#888', textAlign: 'center', marginTop: 4 },
  activeStepLabel: { color: '#c8102e', fontWeight: 'bold' },
  stepLine: { height: 2, flex: 1, backgroundColor: '#f0f0f0', marginHorizontal: -10, marginTop: -20 },
  activeStepLine: { backgroundColor: '#c8102e' },
  newsSection: { marginBottom: 25 },
  tickerContainer: { flexDirection: 'row', backgroundColor: '#fff1f0', borderWidth: 1, borderColor: '#ffa39e', borderRadius: 8, overflow: 'hidden', alignItems: 'center', height: 40, marginBottom: 15 },
  tickerBadge: { backgroundColor: '#c8102e', paddingHorizontal: 10, height: '100%', justifyContent: 'center', zIndex: 2 },
  tickerBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  tickerWrapper: { flexDirection: 'row', alignItems: 'center' },
  tickerText: { fontSize: 14, fontWeight: '600', color: '#c8102e', paddingLeft: 10 },
  newsFeed: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 15 },
  newsItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  newsDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#c8102e', marginTop: 6, marginRight: 10 },
  newsItemText: { flex: 1, fontSize: 14, color: '#333' },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#c8102e", marginBottom: 12 },
  candidateCard: { width: 160, backgroundColor: "#fff", borderRadius: 12, padding: 12, marginRight: 12, elevation: 3, alignItems: "center" },
  candidatePhoto: { width: 80, height: 80, borderRadius: 40, marginBottom: 8 },
  initialsCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#c8102e", justifyContent: "center", alignItems: "center", marginBottom: 8 },
  initialsText: { color: "#fff", fontSize: 24, fontWeight: "700" },
  candidateName: { fontSize: 14, fontWeight: "700", textAlign: "center" },
  candidatePosition: { fontSize: 12, color: "#555", textAlign: "center" },
  filtersContainer: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  filterInput: { flex: 1, minWidth: 90, borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 8, marginRight: 8, marginBottom: 6 },
  clearButton: { backgroundColor: "#c8102e", padding: 10, borderRadius: 10 },
  clearButtonText: { color: "#fff", fontWeight: "700" },
  detailsButton: { backgroundColor: "#c8102e", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginTop: 8 },
  detailsButtonText: { color: "#fff", fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalCard: { width: "90%", backgroundColor: "#fff", borderRadius: 16, padding: 20 },
  modalName: { fontSize: 20, fontWeight: "700", color: "#c8102e" },
  modalPosition: { fontSize: 16, marginBottom: 10 },
  modalManifesto: { fontSize: 14, color: "#555", marginBottom: 20 },
  closeButton: { backgroundColor: "#c8102e", padding: 12, borderRadius: 12, alignItems: "center" },
  closeButtonText: { color: "#fff", fontWeight: "700" },
});