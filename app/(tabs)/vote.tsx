import React, { useState, useEffect, useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert, 
  RefreshControl,
  Platform,
  Modal,
  Dimensions
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useGetAllElectionsQuery } from "@/src/store/Apis/Election.Api";
import { useGetCandidatesByElectionQuery } from "@/src/store/Apis/Candidates.Api";
import { useCastVoteMutation } from "@/src/store/Apis/Voting.Api";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RootState } from "@/src/store";
import * as Haptics from "expo-haptics";
import * as Animatable from "react-native-animatable";
import * as LocalAuthentication from 'expo-local-authentication';

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - 55) / 2; 

export default function VoteScreen() {
  // --- CORE STATE & SELECTORS ---
  const user = useSelector((state: RootState) => state.auth.user);
  const userSchool = user?.school || "";
  const userRole = user?.role || "";
  const userName = user?.name || "Voter";
  const voterRegNo = user?.reg_no || "";
  
  const [positionsMap, setPositionsMap] = useState<Record<string, string>>({});
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>({});
  const [txProgress, setTxProgress] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [votedPositionIds, setVotedPositionIds] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState("");
  const [electionStatus, setElectionStatus] = useState<"upcoming" | "ongoing" | "completed" | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  const { data: electionsData, isLoading: isLoadingElections, refetch: refetchElections } = useGetAllElectionsQuery();
  
  const activeElection = useMemo(() => {
    if (!electionsData?.elections?.length) return null;
    return [...electionsData.elections].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }, [electionsData]);

  const { data: candidatesData, isLoading: isLoadingCandidates, refetch: refetchCandidates } = 
    useGetCandidatesByElectionQuery(activeElection?.id || "", { skip: !activeElection });

  const [castVote, { isLoading: isSubmitting }] = useCastVoteMutation();

  const fetchUserVotes = async () => {
    if (!activeElection?.id || !voterRegNo) return;
    try {
      const res = await fetch(`https://online-voting-system-oq4p.onrender.com/api/votes/my-votes?electionId=${activeElection.id}&voterId=${voterRegNo}`);
      const data = await res.json();
      if (data.votes) setVotedPositionIds(data.votes.map((v: any) => v.position_id));
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchUserVotes(); }, [activeElection, voterRegNo]);

  useEffect(() => {
    if (!activeElection) return;
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(activeElection.start_date).getTime();
      const end = new Date(activeElection.end_date).getTime();
      if (now < start) {
        setElectionStatus("upcoming");
        calculateTime(start - now, "Starts In: ");
      } else if (now >= start && now <= end) {
        setElectionStatus("ongoing");
        calculateTime(end - now, "");
      } else {
        setElectionStatus("completed");
        setTimeLeft("ELECTION CLOSED");
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeElection]);

  const calculateTime = (distance: number, prefix: string) => {
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    setTimeLeft(`${prefix}${hours}h ${minutes}m ${seconds}s`);
  };

  useEffect(() => {
    const fetchPositions = async () => {
      if (!activeElection?.id) return;
      try {
        const res = await fetch(`https://online-voting-system-oq4p.onrender.com/api/positions?electionId=${activeElection.id}`);
        const data = await res.json();
        const map: Record<string, string> = {};
        if (data.positions) data.positions.forEach((pos: any) => (map[pos.id] = pos.name));
        setPositionsMap(map);
      } catch (err) { console.error(err); }
    };
    fetchPositions();
  }, [activeElection]);

  const filteredGroupedCandidates = useMemo(() => {
    if (!candidatesData?.candidates || Object.keys(positionsMap).length === 0) return {};
    const schoolKeyword = userSchool.split(' ')[0].toLowerCase().trim();
    const role = userRole.toLowerCase().trim();

    return candidatesData.candidates.reduce((acc, candidate) => {
      const posName = positionsMap[candidate.position_id] || "Unknown Position";
      const posNameLower = posName.toLowerCase().trim();
      const isSchoolRep = posNameLower.includes("school") && (posNameLower.includes("rep") || posNameLower.includes("representative"));
      
      let include = (role === "voter") ? (isSchoolRep && schoolKeyword && posNameLower.includes(schoolKeyword)) : (role === "delegate" ? !isSchoolRep : true);
      if (include) {
        if (!acc[posName]) acc[posName] = [];
        acc[posName].push(candidate);
      }
      return acc;
    }, {} as Record<string, any[]>);
  }, [candidatesData, userSchool, userRole, positionsMap]);

  const positions = Object.keys(filteredGroupedCandidates);
  
  // STATS: For Progress Bar
  const pendingPositions = useMemo(() => positions.filter(p => {
    const id = Object.keys(positionsMap).find(k => positionsMap[k] === p);
    return id && !votedPositionIds.includes(id);
  }), [positions, votedPositionIds, positionsMap]);

  const votesFilled = Object.keys(selectedVotes).length;
  const totalToFill = pendingPositions.length;

  const allVoted = useMemo(() => positions.length > 0 && positions.every(p => {
    const id = Object.keys(positionsMap).find(k => positionsMap[k] === p);
    return id && votedPositionIds.includes(id);
  }), [positions, votedPositionIds, positionsMap]);

  // --- SUBMISSION WITH BIOMETRICS ---
  const handleVoteSubmission = async () => {
    // 1. Biometric Security Check
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && isEnrolled) {
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authorize Ballot Submission',
        fallbackLabel: 'Use PIN',
      });

      if (!auth.success) {
        Alert.alert("Authentication Failed", "Identity verification required to anchor vote.");
        return;
      }
    }

    setReviewModalVisible(false);
    try {
      for (const posName of pendingPositions) {
        const posId = Object.keys(positionsMap).find(k => positionsMap[k] === posName);
        if (!posId) continue;
        setTxProgress(`Signing ${posName}...`);
        await castVote({ candidate_id: selectedVotes[posName], position_id: posId, election_id: activeElection!.id }).unwrap();
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setHasVoted(true);
      setTxProgress("");
      fetchUserVotes();
    } catch (error: any) {
      Alert.alert("Blockchain Error", error.data?.error || "Transaction failed.");
      setTxProgress("");
    }
  };

  const handleOpenReview = () => {
    if (votesFilled < totalToFill) {
      Alert.alert("Incomplete", `Please select candidates for all ${totalToFill} positions.`);
      return;
    }
    setReviewModalVisible(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchElections(), refetchCandidates(), fetchUserVotes()]);
    setRefreshing(false);
  };

  if (isLoadingElections || isLoadingCandidates) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#c8102e" /><Text style={styles.loadingText}>SYNCING LEDGER...</Text></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.headerLabel}>Digital Ballot</Text>
          <Text style={styles.headerTitle}>{activeElection?.name || "Election"} VOTING SCREEN</Text>
        </View>
        <View style={styles.pulseContainer}>
            <Animatable.View 
              animation={{ from: { opacity: 0.3 }, to: { opacity: 1 } }} 
              iterationCount="infinite" 
              direction="alternate" 
              style={styles.pulseDot} 
            />
            <Text style={styles.liveText}>SECURE LIVE</Text>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#c8102e"]} />}
      >
        <View style={styles.statsStrip}>
           <Text style={styles.schoolTag}><Ionicons name="school" size={12}/> {userSchool || "University"}</Text>
           <Text style={styles.roleTag}><Ionicons name="ribbon" size={12}/> {userRole.toUpperCase()}</Text>
        </View>

        <Animatable.View animation="fadeIn" style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>ELECTION STATUS</Text>
              <Text style={[styles.statusValue, electionStatus === 'ongoing' && {color: '#166534'}]}>{electionStatus?.toUpperCase() || "PENDING"}</Text>
            </View>
            <View style={styles.timerBadge}><Ionicons name="time" size={14} color="#fff" /><Text style={styles.timerText}>{timeLeft}</Text></View>
          </View>
          {electionStatus === 'ongoing' && !allVoted && (
            <View style={styles.progressSection}>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${(votesFilled/totalToFill) * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>{votesFilled} of {totalToFill} positions selected</Text>
            </View>
          )}
        </Animatable.View>

        {(hasVoted || allVoted) ? (
          <Animatable.View animation="zoomIn" style={styles.votedContainer}>
            <View style={styles.successCircle}><MaterialCommunityIcons name="check-decagram" size={60} color="#fff" /></View>
            <Text style={styles.votedTitle}>Ballot Confirmed</Text>
            <Text style={styles.votedSub}>Your vote is immutable and transparently recorded on the Sepolia Testnet.</Text>
          </Animatable.View>
        ) : electionStatus !== "ongoing" ? (
          <View style={styles.emptyState}><MaterialCommunityIcons name="lock" size={60} color="#E5E7EB" /><Text style={styles.emptyText}>Ballot is currently locked</Text></View>
        ) : (
          <>
            {positions.map((posName) => {
              const posId = Object.keys(positionsMap).find(k => positionsMap[k] === posName);
              const isAlreadyVoted = posId && votedPositionIds.includes(posId);
              return (
                <View key={posName} style={styles.section}>
                  <View style={styles.posHeader}>
                    <Text style={styles.posTitle}>{posName}</Text>
                    {isAlreadyVoted && <View style={styles.votedBadge}><Ionicons name="checkmark-circle" size={12} color="#166534" /><Text style={styles.votedBadgeText}>SECURED</Text></View>}
                  </View>
                  
                  <View style={styles.gridContainer}>
                    {filteredGroupedCandidates[posName].map((cand) => {
                      const isSelected = selectedVotes[posName] === cand.id;
                      return (
                        <TouchableOpacity 
                          key={cand.id} 
                          activeOpacity={0.9}
                          style={[styles.candidateCard, isSelected && styles.selectedCard, (isAlreadyVoted || isSubmitting) && styles.disabledCard]}
                          onPress={() => {
                            if (!isAlreadyVoted) {
                                setSelectedVotes(prev => {
                                    const next = {...prev};
                                    if (isSelected) delete next[posName];
                                    else next[posName] = cand.id;
                                    return next;
                                });
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                          }}
                          disabled={isAlreadyVoted || isSubmitting}
                        >
                          <Image source={{ uri: cand.photo_url || 'https://via.placeholder.com/150' }} style={styles.candImage} />
                          <Text style={styles.candName} numberOfLines={1}>{cand.name}</Text>
                          <Text style={styles.candSub} numberOfLines={1}>{cand.school}</Text>
                          
                          <View style={[styles.checkIndicator, isSelected && styles.checkActive, isAlreadyVoted && styles.checkVoted]}>
                             <Ionicons name={isAlreadyVoted ? "lock-closed" : (isSelected ? "checkmark" : undefined)} size={10} color="#fff" />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.submitButton, (isSubmitting || electionStatus !== "ongoing") && styles.disabledButton]} 
              onPress={handleOpenReview}
              disabled={isSubmitting || electionStatus !== "ongoing"}
            >
              <MaterialCommunityIcons name="fingerprint" size={20} color="#fff" style={{marginRight: 10}} />
              <Text style={styles.submitButtonText}>SECURE REVIEW</Text>
            </TouchableOpacity>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={reviewModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalBg}>
          <View style={styles.modalHeader}>
             <TouchableOpacity onPress={() => setReviewModalVisible(false)} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#111" />
             </TouchableOpacity>
             <Text style={styles.modalTitle}>Review Ballot</Text>
          </View>
          <ScrollView style={styles.modalScroll} contentContainerStyle={{ padding: 20 }}>
            {positions.filter(p => selectedVotes[p]).map(posName => {
              const candId = selectedVotes[posName];
              const cand = candidatesData?.candidates.find(c => c.id === candId);
              return (
                <View key={posName} style={styles.reviewCard}>
                   <View style={styles.reviewContent}>
                      <Image source={{ uri: cand?.photo_url || 'https://via.placeholder.com/150' }} style={styles.reviewPhoto} />
                      <View style={{ flex: 1 }}>
                         <Text style={styles.reviewPos}>{posName}</Text>
                         <Text style={styles.reviewName}>{cand?.name}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.removeBtn} 
                        onPress={() => {
                            setSelectedVotes(prev => {
                                const next = {...prev};
                                delete next[posName];
                                return next;
                            });
                        }}
                      >
                         <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                   </View>
                </View>
              );
            })}
          </ScrollView>
          <View style={styles.modalFooter}>
             <TouchableOpacity style={styles.confirmBtn} onPress={handleVoteSubmission} disabled={isSubmitting}>
                <Text style={styles.confirmBtnText}>{txProgress || "AUTHENTICATE & CONFIRM"}</Text>
             </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 15, fontSize: 11, fontWeight: '800', color: '#666' },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  headerLabel: { fontSize: 10, color: "#888", fontWeight: '800', textTransform: 'uppercase' },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#111" },
  pulseContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#c8102e', marginRight: 6 },
  liveText: { fontSize: 10, fontWeight: '900', color: '#c8102e' },
  scrollContent: { paddingHorizontal: 20, backgroundColor: "#F9FAFB" },
  statsStrip: { flexDirection: 'row', gap: 10, marginVertical: 15 },
  schoolTag: { fontSize: 10, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#eee', color: '#666', fontWeight: '700' },
  roleTag: { fontSize: 10, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#eee', color: '#666', fontWeight: '700' },
  statusCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusInfo: { flex: 1 },
  statusLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: '800' },
  statusValue: { fontSize: 18, fontWeight: '900', color: '#111' },
  timerBadge: { backgroundColor: '#111', flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  timerText: { color: '#fff', fontSize: 11, fontWeight: '900', marginLeft: 6 },
  progressSection: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 15 },
  progressBarBg: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#c8102e', borderRadius: 3 },
  progressText: { fontSize: 10, color: '#6B7280', marginTop: 8, fontWeight: '700' },
  section: { marginBottom: 30 },
  posHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  posTitle: { fontSize: 16, fontWeight: "900", color: "#111" },
  votedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  votedBadgeText: { color: '#166534', fontSize: 10, fontWeight: '900', marginLeft: 4 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  candidateCard: { 
    width: COLUMN_WIDTH, 
    backgroundColor: "#fff", 
    padding: 12, 
    borderRadius: 20, 
    marginBottom: 15, 
    borderWidth: 1.5, 
    borderColor: '#F3F4F6',
    alignItems: 'center'
  },
  selectedCard: { borderColor: "#c8102e", backgroundColor: "#FEF2F2" },
  disabledCard: { opacity: 0.6 },
  candImage: { width: 60, height: 60, borderRadius: 30, marginBottom: 10 },
  candName: { fontSize: 13, fontWeight: "800", color: "#111", textAlign: 'center' },
  candSub: { fontSize: 9, color: "#9CA3AF", textAlign: 'center' },
  checkIndicator: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  checkActive: { backgroundColor: '#c8102e', borderColor: '#c8102e' },
  checkVoted: { backgroundColor: '#166534', borderColor: '#166534' },
  submitButton: { flexDirection: 'row', backgroundColor: "#c8102e", padding: 20, borderRadius: 20, alignItems: "center", justifyContent: 'center' },
  disabledButton: { backgroundColor: "#E5E7EB" },
  submitButtonText: { color: "#fff", fontWeight: "900", fontSize: 14 },
  votedContainer: { alignItems: "center", paddingVertical: 60 },
  successCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#166534', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  votedTitle: { fontSize: 22, fontWeight: "900" },
  votedSub: { fontSize: 14, color: "#6B7280", textAlign: 'center', marginTop: 10 },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyText: { color: "#9CA3AF", fontSize: 14, fontWeight: "700" },
  modalBg: { flex: 1, backgroundColor: '#F9FAFB' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  backBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 12, marginRight: 15 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  modalScroll: { flex: 1 },
  reviewCard: { backgroundColor: '#fff', borderRadius: 20, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  reviewContent: { flexDirection: 'row', alignItems: 'center' },
  reviewPhoto: { width: 40, height: 40, borderRadius: 10, marginRight: 12 },
  reviewPos: { fontSize: 9, fontWeight: '800', color: '#c8102e', textTransform: 'uppercase' },
  reviewName: { fontSize: 15, fontWeight: '900' },
  removeBtn: { padding: 8, backgroundColor: '#FEF2F2', borderRadius: 8 },
  modalFooter: { padding: 20, backgroundColor: '#fff' },
  confirmBtn: { backgroundColor: '#111', padding: 20, borderRadius: 20, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '900' }
});