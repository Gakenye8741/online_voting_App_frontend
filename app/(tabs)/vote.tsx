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
  Dimensions,
  TextInput
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useGetAllElectionsQuery } from "@/src/store/Apis/Election.Api";
import { useGetCandidatesByElectionQuery } from "@/src/store/Apis/Candidates.Api";
import { useCastVoteMutation, useGetMyVotesQuery } from "@/src/store/Apis/Voting.Api"; 
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RootState } from "@/src/store";
import * as Haptics from "expo-haptics";
import * as Animatable from "react-native-animatable";
import * as LocalAuthentication from 'expo-local-authentication';
import * as WebBrowser from 'expo-web-browser';

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - 55) / 2; 

export default function VoteScreen() {
  // --- CORE STATE & SELECTORS ---
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Guard state to handle Async Storage hydration delay
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // If user data exists in Redux, hydration is done.
    if (user) {
      setIsHydrated(true);
    } else {
      // Small timeout to allow Redux-Persist/AsyncStorage to populate the store
      const timer = setTimeout(() => setIsHydrated(true), 800);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const userSchool = user?.school || "";
  const userRole = user?.role || "";
  const voterRegNo = user?.reg_no || "";
  
  const [positionsMap, setPositionsMap] = useState<Record<string, string>>({});
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>({});
  const [txProgress, setTxProgress] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [electionStatus, setElectionStatus] = useState<"upcoming" | "ongoing" | "completed" | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  // Skip queries until we are sure the user object has been hydrated from AsyncStorage
  const { data: electionsData, isLoading: isLoadingElections, refetch: refetchElections } = useGetAllElectionsQuery(undefined, {
    skip: !isHydrated
  });
  
  const activeElection = useMemo(() => {
    if (!electionsData?.elections?.length) return null;
    return [...electionsData.elections].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }, [electionsData]);

  const { data: candidatesData, isLoading: isLoadingCandidates, refetch: refetchCandidates } = 
    useGetCandidatesByElectionQuery(activeElection?.id || "", { skip: !activeElection || !user });

  const { data: myVotesData, isLoading: isLoadingMyVotes, refetch: refetchMyVotes } = 
    useGetMyVotesQuery(activeElection?.id || "", { skip: !activeElection || !user });

  const [castVote, { isLoading: isSubmitting }] = useCastVoteMutation();

  const hasAlreadyVoted = useMemo(() => {
    if (userRole.toLowerCase() === "voter") {
      return myVotesData?.data?.totalCast && parseInt(myVotesData.data.totalCast.toString()) > 0;
    }
    return false;
  }, [myVotesData, userRole]);

  const votedPositionIds = useMemo(() => {
    return myVotesData?.data?.votes?.map((v: any) => v.position_id) || [];
  }, [myVotesData]);

  const lastTxHash = useMemo(() => {
    return myVotesData?.data?.votes?.[0]?.transaction_hash;
  }, [myVotesData]);

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
        setIsUrgent(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeElection]);

  const calculateTime = (distance: number, prefix: string) => {
    if (distance < 0) return;
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    setIsUrgent(distance < 3600000 && electionStatus === "ongoing");
    setTimeLeft(`${prefix}${days}d ${hours}h ${minutes}m ${seconds}s`);
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

  const handleOpenExplorer = async () => {
    if (lastTxHash) {
      await WebBrowser.openBrowserAsync(`https://sepolia.etherscan.io/tx/${lastTxHash}`);
    } else {
      Alert.alert("Hash Not Found", "The transaction is still being indexed by the explorer.");
    }
  };

  const handleVoteSubmission = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && isEnrolled) {
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authorize Ballot Submission',
        fallbackLabel: 'Use PIN',
      });
      if (!auth.success) {
        Alert.alert("Authentication Failed", "Identity verification required.");
        return;
      }
    }

    setReviewModalVisible(false);
    try {
      for (const posName of pendingPositions) {
        const posId = Object.keys(positionsMap).find(k => positionsMap[k] === posName);
        if (!posId || !selectedVotes[posName]) continue;
        setTxProgress(`Signing ${posName}...`);
        await castVote({ candidate_id: selectedVotes[posName], position_id: posId, election_id: activeElection!.id }).unwrap();
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTxProgress("");
      refetchMyVotes();
    } catch (error: any) {
      Alert.alert("Blockchain Error", error.data?.error || "Transaction failed.");
      setTxProgress("");
    }
  };

  const filteredGroupedCandidates = useMemo(() => {
    // Ensure we don't calculate groups until user credentials are ready
    if (!candidatesData?.candidates || Object.keys(positionsMap).length === 0 || !user) return {};
    const schoolKeyword = userSchool.split(' ')[0].toLowerCase().trim();
    const role = userRole.toLowerCase().trim();

    return candidatesData.candidates.reduce((acc, candidate) => {
      const posName = positionsMap[candidate.position_id] || "Unknown Position";
      const posNameLower = posName.toLowerCase().trim();
      const matchesSearch = candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) || posNameLower.includes(searchQuery.toLowerCase());
      const isSchoolRep = posNameLower.includes("school") && (posNameLower.includes("rep") || posNameLower.includes("representative"));
      let include = (role === "voter") ? (isSchoolRep && schoolKeyword && posNameLower.includes(schoolKeyword)) : (role === "delegate" ? !isSchoolRep : true);
      if (include && matchesSearch) {
        if (!acc[posName]) acc[posName] = [];
        acc[posName].push(candidate);
      }
      return acc;
    }, {} as Record<string, any[]>);
  }, [candidatesData, userSchool, userRole, positionsMap, searchQuery, user]);

  const positions = Object.keys(filteredGroupedCandidates);
  const pendingPositions = useMemo(() => positions.filter(p => {
    const id = Object.keys(positionsMap).find(k => positionsMap[k] === p);
    return id && !votedPositionIds.includes(id);
  }), [positions, votedPositionIds, positionsMap]);

  const votesFilled = Object.keys(selectedVotes).length;
  const totalToFill = pendingPositions.length;

  const handleOpenReview = () => {
    if (votesFilled < totalToFill) {
      Alert.alert("Incomplete", `Please select candidates for all ${totalToFill} positions.`);
      return;
    }
    setReviewModalVisible(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchElections(), refetchCandidates(), refetchMyVotes()]);
    setRefreshing(false);
  };

  // Show a specialized hydration loader during the reload process
  if (!isHydrated || isLoadingElections || isLoadingCandidates || isLoadingMyVotes) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#c8102e" />
        <Text style={styles.loadingText}>RESTORING SECURE SESSION...</Text>
      </View>
    );
  }

  // If after hydration there is no user, they genuinely need to login
  if (!user) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="lock-alert" size={50} color="#c8102e" />
        <Text style={styles.loadingText}>AUTHENTICATION REQUIRED</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.topHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerLabel}>Digital Ballot</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{activeElection?.name || "Election"}</Text>
        </View>
        <View style={styles.pulseContainer}>
            <Animatable.View animation="pulse" iterationCount="infinite" style={styles.pulseDot} />
            <Text style={styles.liveText}>SECURE LIVE</Text>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#9CA3AF" style={{marginLeft: 15}} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search candidates..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={{marginRight: 10}}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
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
            <Animatable.View 
              animation={isUrgent ? "pulse" : undefined}
              iterationCount="infinite"
              style={[styles.timerBadge, isUrgent && styles.timerBadgeUrgent]}
            >
                <Ionicons name="time" size={14} color="#fff" />
                <Text style={styles.timerText}>{timeLeft}</Text>
            </Animatable.View>
          </View>
          {electionStatus === 'ongoing' && !hasAlreadyVoted && (
            <View style={styles.progressSection}>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${(votesFilled/totalToFill) * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>{votesFilled} of {totalToFill} positions selected</Text>
            </View>
          )}
        </Animatable.View>

        {hasAlreadyVoted ? (
          <Animatable.View animation="zoomIn" style={styles.votedContainer}>
            <View style={styles.successCircle}><MaterialCommunityIcons name="check-decagram" size={60} color="#fff" /></View>
            <Text style={styles.votedTitle}>Participation Recorded</Text>
            <Text style={styles.votedSub}>You have already cast your ballot. Your vote is immutable and transparently recorded on the Sepolia Testnet.</Text>
            
            <TouchableOpacity style={styles.explorerBtn} onPress={handleOpenExplorer}>
               <MaterialCommunityIcons name="ethereum" size={18} color="#111" />
               <Text style={styles.explorerBtnText}>VERIFY ON EXPLORER</Text>
            </TouchableOpacity>
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
                          onLongPress={() => {
                            setSelectedCandidate(cand);
                            Haptics.selectionAsync();
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

      {/* MODALS */}
      <Modal visible={!!selectedCandidate} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animatable.View animation="zoomIn" duration={300} style={styles.dossierCard}>
            <TouchableOpacity style={styles.closeDossier} onPress={() => setSelectedCandidate(null)}>
              <Ionicons name="close" size={24} color="#111" />
            </TouchableOpacity>
            <Image source={{ uri: selectedCandidate?.photo_url }} style={styles.dossierImage} />
            <Text style={styles.dossierName}>{selectedCandidate?.name}</Text>
            <Text style={styles.dossierSchool}>{selectedCandidate?.school}</Text>
            <View style={styles.dossierDivider} />
            <Text style={styles.dossierLabel}>CANDIDATE BIO / MANIFESTO</Text>
            <Text style={styles.dossierBio}>{selectedCandidate?.bio || "Loading candidate profile details from the secure ledger..."}</Text>
            <TouchableOpacity style={styles.dossierCloseBtn} onPress={() => setSelectedCandidate(null)}>
              <Text style={styles.dossierCloseBtnText}>RETURN TO BALLOT</Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </Modal>

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
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  headerLabel: { fontSize: 10, color: "#888", fontWeight: '800', textTransform: 'uppercase' },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#111" },
  pulseContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#c8102e', marginRight: 6 },
  liveText: { fontSize: 10, fontWeight: '900', color: '#c8102e' },
  searchSection: { paddingHorizontal: 20, marginTop: 15, marginBottom: 5 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 15, height: 45 },
  searchInput: { flex: 1, paddingHorizontal: 10, fontSize: 14, fontWeight: '600', color: '#111' },
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
  timerBadgeUrgent: { backgroundColor: '#ef4444' },
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
  candidateCard: { width: COLUMN_WIDTH, backgroundColor: "#fff", padding: 12, borderRadius: 20, marginBottom: 15, borderWidth: 1.5, borderColor: '#F3F4F6', alignItems: 'center' },
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
  votedContainer: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 20 },
  successCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#166534', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  votedTitle: { fontSize: 22, fontWeight: "900", textAlign: 'center' },
  votedSub: { fontSize: 14, color: "#6B7280", textAlign: 'center', marginTop: 10, lineHeight: 20 },
  explorerBtn: { marginTop: 25, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  explorerBtnText: { marginLeft: 10, fontSize: 12, fontWeight: '800', color: '#111' },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyText: { color: "#9CA3AF", fontSize: 14, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dossierCard: { backgroundColor: '#fff', borderRadius: 30, padding: 25, width: '100%', alignItems: 'center' },
  closeDossier: { alignSelf: 'flex-end' },
  dossierImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 15 },
  dossierName: { fontSize: 20, fontWeight: '900', color: '#111' },
  dossierSchool: { fontSize: 12, color: '#6B7280', marginBottom: 15 },
  dossierDivider: { height: 1, width: '100%', backgroundColor: '#F3F4F6', marginBottom: 15 },
  dossierLabel: { alignSelf: 'flex-start', fontSize: 10, fontWeight: '900', color: '#c8102e', marginBottom: 8 },
  dossierBio: { fontSize: 14, color: '#4B5563', lineHeight: 22, textAlign: 'left', width: '100%' },
  dossierCloseBtn: { marginTop: 25, backgroundColor: '#111', paddingVertical: 15, width: '100%', borderRadius: 15, alignItems: 'center' },
  dossierCloseBtnText: { color: '#fff', fontWeight: '900', fontSize: 12 },
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
  modalFooter: { padding: 20, backgroundColor: '#fff' },
  confirmBtn: { backgroundColor: '#111', padding: 20, borderRadius: 20, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '900' }
});