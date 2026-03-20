import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  Modal,
  Dimensions,
  TextInput,
  Animated
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector, useDispatch } from "react-redux"; 
import { useGetAllElectionsQuery } from "@/src/store/Apis/Election.Api";
import { useGetCandidatesByElectionQuery } from "@/src/store/Apis/Candidates.Api";
import { useCastVoteMutation, useGetMyVotesQuery } from "@/src/store/Apis/Voting.Api"; 
import { useGetDelegateRosterQuery, useCastDelegateVoteMutation, useGetMyDelegateVoteQuery } from "@/src/store/Apis/Delegate.Api";
import { useGetCoalitionsByElectionQuery } from "@/src/store/Apis/Coalition.Api";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RootState } from "@/src/store";
import AsyncStorage from "@react-native-async-storage/async-storage"; 
import * as Haptics from "expo-haptics";
import * as Animatable from "react-native-animatable";
import * as LocalAuthentication from 'expo-local-authentication';
import * as WebBrowser from 'expo-web-browser';
import { setCredentials } from "@/src/store/authSlice";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - 55) / 2; 

const LAIKIPIA_RED = "#c8102e";
const WHITE = "#FFFFFF";

const Toast = ({ visible, message }: { visible: boolean; message: string }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    const toValue = visible ? 20 : -100;
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [visible, slideAnim]);

  return (
    <Animated.View style={[styles.toastContainer, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.toastContent}>
        <Ionicons name="checkmark-circle" size={20} color={LAIKIPIA_RED} />
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

export default function VoteScreen() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrateAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        const storedToken = await AsyncStorage.getItem("token");
        if (storedUser && storedToken && !user) {
          dispatch(setCredentials({ user: JSON.parse(storedUser), token: storedToken }));
        }
      } catch (error) {
        console.error("Hydration Error:", error);
      } finally {
        setTimeout(() => setIsHydrated(true), 500);
      }
    };
    hydrateAuth();
  }, [dispatch, user]);

  const userSchool = user?.school || "";
  const userRole = user?.role || "";
  const voterRegNo = user?.regNo || ""; 
  
  const [positionsMap, setPositionsMap] = useState<Record<string, string>>({});
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>({});
  const [txProgress, setTxProgress] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [electionStatus, setElectionStatus] = useState<"upcoming" | "ongoing" | "completed" | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const { data: electionsData, isLoading: isLoadingElections, refetch: refetchElections } = useGetAllElectionsQuery(undefined, {
    skip: !isHydrated
  });
  
  const activeElection = useMemo(() => {
    if (!electionsData?.elections?.length) return null;
    return [...electionsData.elections].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }, [electionsData]);

  const { data: coalitionsData } = useGetCoalitionsByElectionQuery(activeElection?.id || "", {
    skip: !activeElection
  });

  const coalitionMap = useMemo(() => {
    const map: Record<string, string> = {};
    coalitionsData?.coalitions?.forEach((c: any) => {
      map[c.id] = c.name;
    });
    return map;
  }, [coalitionsData]);

  const { data: rosterData } = useGetDelegateRosterQuery(activeElection?.id || "", { 
    skip: !activeElection || !voterRegNo 
  });

  const currentUserDelegateObject = useMemo(() => {
    if (!rosterData?.delegates || !voterRegNo) return null;
    return rosterData.delegates.find(
      (d: any) => d.reg_no?.toLowerCase().trim() === voterRegNo.toLowerCase().trim()
    );
  }, [rosterData, voterRegNo]);

  const isUserADelegate = !!currentUserDelegateObject;

  // Check if delegate has already voted
  const { data: delegateVoteData, refetch: refetchDelegateVote } = useGetMyDelegateVoteQuery(activeElection?.id || "", {
    skip: !activeElection || !isUserADelegate
  });

  const { data: candidatesData, isLoading: isLoadingCandidates, refetch: refetchCandidates } = 
    useGetCandidatesByElectionQuery(activeElection?.id || "", { skip: !activeElection || !user });

  const { data: myVotesData, isLoading: isLoadingMyVotes, refetch: refetchMyVotes } = 
    useGetMyVotesQuery(activeElection?.id || "", { skip: !activeElection || !user });

  const [castStandardVote] = useCastVoteMutation();
  const [castDelegateVote, { isLoading: isSubmitting }] = useCastDelegateVoteMutation();

  // Unified logic to disable voting if either a standard vote or delegate vote exists
  const hasAlreadyVoted = useMemo(() => {
    if (isUserADelegate) {
        return delegateVoteData?.voted === true;
    }
    const total = myVotesData?.data?.totalCast;
    return total && Number.parseInt(total.toString(), 10) > 0;
  }, [myVotesData, delegateVoteData, isUserADelegate]);

  const votedPositionIds = useMemo(() => {
    return (myVotesData?.data?.votes as any[])?.map((v: any) => v.position_id) || [];
  }, [myVotesData]);

  // Retrieve hash from either source
  const lastTxHash = useMemo(() => {
    if (isUserADelegate && delegateVoteData?.vote?.transaction_hash) {
        return delegateVoteData.vote.transaction_hash;
    }
    return (myVotesData?.data?.votes as any[])?.[0]?.transaction_hash;
  }, [myVotesData, delegateVoteData, isUserADelegate]);

  const calculateTime = useCallback((distance: number, prefix: string) => {
    if (distance < 0) return;
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    setIsUrgent(distance < 3600000 && electionStatus === "ongoing");
    setTimeLeft(`${prefix}${days}d ${hours}h ${minutes}m ${seconds}s`);
  }, [electionStatus]);

  useEffect(() => {
    if (!activeElection) return;
    const timer = setInterval(() => {
      const now = Date.now();
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
  }, [activeElection, calculateTime]);

  useEffect(() => {
    const fetchPositions = async () => {
      if (!activeElection?.id) return;
      try {
        const res = await fetch(`https://online-voting-system-oq4p.onrender.com/api/positions?electionId=${activeElection.id}`);
        const data = await res.json();
        const map: Record<string, string> = {};
        if (data.positions) {
          data.positions.forEach((pos: any) => {
            map[pos.id] = pos.name;
          });
        }
        setPositionsMap(map);
      } catch (err) { console.error(err); }
    };
    fetchPositions();
  }, [activeElection]);

  const coalitionGroups = useMemo(() => {
    if (!candidatesData?.candidates || !isUserADelegate) return {};
    return candidatesData.candidates.reduce((acc: any, cand: any) => {
        const coalName = cand.coalition_id ? (coalitionMap[cand.coalition_id] || "Unknown Coalition") : "Independent";
        if (!acc[coalName]) acc[coalName] = [];
        acc[coalName].push(cand);
        return acc;
    }, {} as Record<string, any[]>);
  }, [candidatesData, isUserADelegate, coalitionMap]);

  const handleOpenExplorer = async () => {
    if (lastTxHash) {
      await WebBrowser.openBrowserAsync(`https://sepolia.etherscan.io/tx/${lastTxHash}`);
    } else {
      Alert.alert("Hash Not Found", "Transaction pending block confirmation.");
    }
  };

  const showSuccessToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const handleCoalitionVote = async (coalitionName: string, candidates: any[]) => {
      const coalitionId = Object.keys(coalitionMap).find(key => coalitionMap[key] === coalitionName) || coalitionName;
      const auth = await LocalAuthentication.authenticateAsync({ promptMessage: `Confirm Slate Vote` });
      if (!auth.success) return;

      try {
          setTxProgress(`Broadcasting Slate...`);
          await castDelegateVote({
              delegate_id: currentUserDelegateObject!.delegate_id,
              election_id: activeElection!.id,
              coalition_id: coalitionId,
              position_id: candidates[0].position_id 
          }).unwrap();
          showSuccessToast(`Slate Vote Recorded!`);
          refetchDelegateVote();
      } catch (error: any) {
          Alert.alert("Blockchain Error", error.data?.error || "Transaction failed.");
      } finally { setTxProgress(""); }
  };

  const processStandardVotes = async (positionsList: string[]) => {
    for (const posName of positionsList) {
      const posId = Object.keys(positionsMap).find(k => positionsMap[k] === posName);
      const candId = selectedVotes[posName];
      if (posId && candId) {
        setTxProgress(`Signing ${posName}...`);
        await castStandardVote({ 
          candidate_id: candId, 
          position_id: posId, 
          election_id: activeElection!.id 
        }).unwrap();
      }
    }
  };

  const handleVoteSubmission = async () => {
    const auth = await LocalAuthentication.authenticateAsync({ promptMessage: 'Authorize Ballot Submission' });
    if (!auth.success) return;
    setReviewModalVisible(false);
    try {
      await processStandardVotes(pendingPositions);
      showSuccessToast("All Votes Secured Successfully!");
      refetchMyVotes();
    } catch (error: any) {
      Alert.alert("Blockchain Error", error.data?.error || "Transaction failed.");
    } finally { setTxProgress(""); }
  };

  const filteredGroupedCandidates = useMemo(() => {
    const canProcess = candidatesData?.candidates && Object.keys(positionsMap).length > 0 && user && !isUserADelegate;
    if (!canProcess) return {};
    const schoolKeyword = userSchool.split(' ')[0].toLowerCase().trim();
    return candidatesData.candidates.reduce((acc: any, candidate: any) => {
      const posName = positionsMap[candidate.position_id] || "Unknown Position";
      const posNameLower = posName.toLowerCase().trim();
      const matchesSearch = candidate.name.toLowerCase().includes(searchQuery.toLowerCase());
      const isSchoolRep = posNameLower.includes("school") && (posNameLower.includes("rep") || posNameLower.includes("representative"));
      const shouldInclude = isSchoolRep && schoolKeyword && posNameLower.includes(schoolKeyword);
      if (shouldInclude && matchesSearch) {
        if (!acc[posName]) acc[posName] = [];
        acc[posName].push(candidate);
      }
      return acc;
    }, {} as Record<string, any[]>);
  }, [candidatesData, userSchool, positionsMap, searchQuery, user, isUserADelegate]);

  const positions = useMemo(() => Object.keys(filteredGroupedCandidates), [filteredGroupedCandidates]);
  const pendingPositions = useMemo(() => positions.filter(p => {
    const id = Object.keys(positionsMap).find(k => positionsMap[k] === p);
    return id && !votedPositionIds.includes(id);
  }), [positions, votedPositionIds, positionsMap]);

  const handleOpenReview = () => {
    if (Object.keys(selectedVotes).length < pendingPositions.length) {
      Alert.alert("Incomplete", `Please select candidates for all ${pendingPositions.length} positions.`);
      return;
    }
    setReviewModalVisible(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchElections(), refetchCandidates(), refetchMyVotes(), refetchDelegateVote()]);
    setRefreshing(false);
  };

  if (!isHydrated || isLoadingElections || isLoadingCandidates || isLoadingMyVotes) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={LAIKIPIA_RED} />
        <Text style={styles.loadingText}>RESTORING SECURE SESSION...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <Toast visible={toastVisible} message={toastMessage} />
      
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
            placeholder="Search leaders or coalitions..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[LAIKIPIA_RED]} />}
      >
        <View style={styles.statsStrip}>
           <Text style={styles.schoolTag}><Ionicons name="school" size={12}/> {userSchool || "University"}</Text>
           {isUserADelegate ? (
             <Animatable.View animation="pulse" iterationCount="infinite" style={styles.delegateBadge}>
                <MaterialCommunityIcons name="shield-check" size={12} color={WHITE} />
                <Text style={styles.delegateBadgeText}>OFFICIAL DELEGATE</Text>
             </Animatable.View>
           ) : (
             <View style={styles.roleTagContainer}>
                <Text style={styles.roleTag}><Ionicons name="ribbon" size={12}/> {userRole.toUpperCase()}</Text>
             </View>
           )}
           <Text style={styles.roleTag}><Ionicons name="person" size={12}/> {voterRegNo}</Text>
        </View>

        {isUserADelegate ? (
          <Animatable.View animation="fadeInDown" style={styles.eligibilityCard}>
            <View style={styles.eligibilityIcon}><MaterialCommunityIcons name="account-check" size={24} color="#166534" /></View>
            <View style={{flex: 1}}>
                <Text style={styles.eligibilityTitle}>Delegate Identity Verified</Text>
                <Text style={styles.eligibilitySub}>Phase 2: Slate voting for <Text style={{fontWeight: '900'}}>Coalition Leaders</Text> enabled.</Text>
            </View>
          </Animatable.View>
        ) : (
          <Animatable.View animation="fadeIn" style={[styles.eligibilityCard, styles.notRegisteredCard]}>
            <View style={[styles.eligibilityIcon, styles.notRegisteredIcon]}><MaterialCommunityIcons name="account-search" size={24} color={LAIKIPIA_RED} /></View>
            <View style={{flex: 1}}>
                <Text style={[styles.eligibilityTitle, {color: LAIKIPIA_RED}]}>Voter Registry Confirmed</Text>
                <Text style={styles.eligibilitySub}>Voting for <Text style={{fontWeight: '900'}}>{userSchool}</Text> Reps.</Text>
            </View>
          </Animatable.View>
        )}

        <Animatable.View animation="fadeIn" style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>ELECTION STATUS</Text>
              <Text style={[styles.statusValue, electionStatus === 'ongoing' && {color: '#166534'}]}>{electionStatus?.toUpperCase() || "PENDING"}</Text>
            </View>
            <Animatable.View animation={isUrgent ? "pulse" : undefined} iterationCount="infinite" style={[styles.timerBadge, isUrgent && styles.timerBadgeUrgent]}>
                <Ionicons name="time" size={14} color={WHITE} />
                <Text style={styles.timerText}>{timeLeft}</Text>
            </Animatable.View>
          </View>
        </Animatable.View>

        {hasAlreadyVoted ? (
          <Animatable.View animation="zoomIn" style={styles.votedContainer}>
            <View style={[styles.successCircle, {backgroundColor: LAIKIPIA_RED}]}><MaterialCommunityIcons name="check-decagram" size={60} color={WHITE} /></View>
            <Text style={styles.votedTitle}>Participation Recorded</Text>
            <Text style={styles.votedSub}>Your {isUserADelegate ? 'Delegate Slate' : 'Ballot'} is transparently recorded on the Sepolia Testnet.</Text>
            <TouchableOpacity style={[styles.explorerBtn, {borderColor: LAIKIPIA_RED}]} onPress={handleOpenExplorer}>
               <MaterialCommunityIcons name="ethereum" size={18} color={LAIKIPIA_RED} />
               <Text style={[styles.explorerBtnText, {color: LAIKIPIA_RED}]}>VERIFY TRANSACTION</Text>
            </TouchableOpacity>
          </Animatable.View>
        ) : electionStatus !== "ongoing" ? (
          <View style={styles.emptyState}><MaterialCommunityIcons name="lock" size={60} color="#E5E7EB" /><Text style={styles.emptyText}>Ballot is currently locked</Text></View>
        ) : isUserADelegate ? (
            <View>
                {Object.keys(coalitionGroups).map((coalitionName, idx) => (
                    <Animatable.View key={coalitionName} animation="fadeInUp" delay={idx * 100} style={styles.coalitionSlateCard}>
                        <LinearGradient colors={[WHITE, "#f9fafb"]} style={styles.coalitionGradient}>
                            <View style={styles.slateHeader}>
                                <View>
                                    <Text style={styles.slateTitle}>{coalitionName}</Text>
                                    <Text style={[styles.slateBadge, {color: LAIKIPIA_RED}]}>OFFICIAL SLATE</Text>
                                </View>
                                <TouchableOpacity 
                                    style={[styles.slateVoteBtn, {backgroundColor: LAIKIPIA_RED}]} 
                                    onPress={() => handleCoalitionVote(coalitionName, coalitionGroups[coalitionName])}
                                    disabled={isSubmitting}
                                >
                                    <Text style={[styles.slateVoteBtnText, {color: WHITE}]}>{txProgress ? "SIGNING..." : "VOTE SLATE"}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.slateMembers}>
                                {coalitionGroups[coalitionName].map((cand: any) => (
                                    <View key={cand.id} style={styles.slateMemberItem}>
                                        <Image source={{ uri: cand.photo_url || 'https://via.placeholder.com/150' }} style={styles.slateMemberPhoto} />
                                        <Text style={styles.slateMemberName} numberOfLines={1}>{cand.name.split(' ')[0]}</Text>
                                        <Text style={styles.slateMemberPos} numberOfLines={1}>{positionsMap[cand.position_id]}</Text>
                                    </View>
                                ))}
                            </View>
                        </LinearGradient>
                    </Animatable.View>
                ))}
            </View>
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
                    {filteredGroupedCandidates[posName].map((cand: any) => {
                      const isSelected = selectedVotes[posName] === cand.id;
                      return (
                        <TouchableOpacity 
                          key={cand.id} 
                          activeOpacity={0.9}
                          style={[styles.candidateCard, isSelected && styles.selectedCard, isAlreadyVoted && styles.disabledCard]}
                          onPress={() => {
                            if (!isAlreadyVoted) {
                                setSelectedVotes(prev => ({...prev, [posName]: cand.id}));
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                          }}
                        >
                          <Image source={{ uri: cand.photo_url || 'https://via.placeholder.com/150' }} style={styles.candImage} />
                          <Text style={styles.candName} numberOfLines={1}>{cand.name}</Text>
                          <View style={[styles.coalitionChip, isSelected && {backgroundColor: LAIKIPIA_RED}]}>
                             <Text style={[styles.coalitionChipText, isSelected && {color: WHITE}]}>
                               {cand.coalition_id ? (coalitionMap[cand.coalition_id] || "...") : "Independent"}
                             </Text>
                          </View>
                          <View style={[styles.checkIndicator, isSelected && {backgroundColor: LAIKIPIA_RED, borderColor: LAIKIPIA_RED}, isAlreadyVoted && styles.checkVoted]}>
                             <Ionicons name={isAlreadyVoted ? "lock-closed" : (isSelected ? "checkmark" : undefined)} size={10} color={WHITE} />
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
              style={[styles.submitButton, {backgroundColor: LAIKIPIA_RED}, (isSubmitting || electionStatus !== "ongoing") && styles.disabledButton]} 
              onPress={handleOpenReview}
              disabled={isSubmitting || electionStatus !== "ongoing"}
            >
              <MaterialCommunityIcons name="fingerprint" size={20} color={WHITE} style={{marginRight: 10}} />
              <Text style={[styles.submitButtonText, {color: WHITE}]}>{txProgress || "SECURE REVIEW"}</Text>
            </TouchableOpacity>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Review Modal */}
      <Modal visible={reviewModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalBg}>
          <View style={styles.modalHeader}>
             <TouchableOpacity onPress={() => setReviewModalVisible(false)} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={LAIKIPIA_RED} /></TouchableOpacity>
             <Text style={[styles.modalTitle, {color: LAIKIPIA_RED}]}>Review Ballot</Text>
          </View>
          <ScrollView style={styles.modalScroll} contentContainerStyle={{ padding: 20 }}>
            {positions.filter(p => selectedVotes[p]).map(posName => {
              const candId = selectedVotes[posName];
              const cand = candidatesData?.candidates.find((c: any) => c.id === candId);
              return (
                <View key={posName} style={styles.reviewCard}>
                   <View style={styles.reviewContent}>
                      <Image source={{ uri: cand?.photo_url || 'https://via.placeholder.com/150' }} style={styles.reviewPhoto} />
                      <View style={{ flex: 1 }}>
                         <Text style={[styles.reviewPos, {color: LAIKIPIA_RED}]}>{posName}</Text>
                         <Text style={styles.reviewName}>{cand?.name || "Candidate"}</Text>
                         <Text style={styles.reviewCoalition}>Coalition: {cand?.coalition_id ? (coalitionMap[cand.coalition_id] || "...") : 'Independent'}</Text>
                      </View>
                   </View>
                </View>
              );
            })}
          </ScrollView>
          <View style={styles.modalFooter}>
             <TouchableOpacity style={[styles.confirmBtn, {backgroundColor: LAIKIPIA_RED}]} onPress={handleVoteSubmission} disabled={isSubmitting}>
                <Text style={[styles.confirmBtnText, {color: WHITE}]}>{txProgress || "AUTHENTICATE & CONFIRM"}</Text>
             </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WHITE },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 15, fontSize: 11, fontWeight: '800', color: '#666' },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  headerLabel: { fontSize: 10, color: "#888", fontWeight: '800', textTransform: 'uppercase' },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#111" },
  pulseContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: LAIKIPIA_RED, marginRight: 6 },
  liveText: { fontSize: 10, fontWeight: '900', color: LAIKIPIA_RED },
  searchSection: { paddingHorizontal: 20, marginTop: 15, marginBottom: 5 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 15, height: 45 },
  searchInput: { flex: 1, paddingHorizontal: 10, fontSize: 14, fontWeight: '600', color: '#111' },
  scrollContent: { paddingHorizontal: 20, backgroundColor: "#F9FAFB" },
  statsStrip: { flexDirection: 'row', gap: 10, marginVertical: 15, flexWrap: 'wrap', alignItems: 'center' },
  schoolTag: { fontSize: 10, backgroundColor: WHITE, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#eee', color: '#666', fontWeight: '700' },
  roleTag: { fontSize: 10, backgroundColor: WHITE, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#eee', color: '#666', fontWeight: '700' },
  roleTagContainer: { flexDirection: 'row', alignItems: 'center' },
  delegateBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: LAIKIPIA_RED, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
  delegateBadgeText: { color: WHITE, fontSize: 10, fontWeight: '900' },
  statusCard: { backgroundColor: WHITE, borderRadius: 24, padding: 20, marginBottom: 20 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusInfo: { flex: 1 },
  statusLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: '800' },
  statusValue: { fontSize: 18, fontWeight: '900', color: '#111' },
  timerBadge: { backgroundColor: LAIKIPIA_RED, flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  timerBadgeUrgent: { backgroundColor: '#ef4444' },
  timerText: { color: WHITE, fontSize: 11, fontWeight: '900', marginLeft: 6 },
  section: { marginBottom: 30 },
  posHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  posTitle: { fontSize: 16, fontWeight: "900", color: "#111" },
  votedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  votedBadgeText: { color: '#166534', fontSize: 10, fontWeight: '900', marginLeft: 4 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  candidateCard: { width: COLUMN_WIDTH, backgroundColor: WHITE, padding: 12, borderRadius: 20, marginBottom: 15, borderWidth: 1.5, borderColor: '#F3F4F6', alignItems: 'center' },
  selectedCard: { borderColor: LAIKIPIA_RED, backgroundColor: "#FEF2F2" },
  disabledCard: { opacity: 0.6 },
  candImage: { width: 60, height: 60, borderRadius: 30, marginBottom: 10 },
  candName: { fontSize: 13, fontWeight: "800", color: "#111", textAlign: 'center' },
  coalitionChip: { marginTop: 6, backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  coalitionChipText: { fontSize: 9, fontWeight: '800', color: '#64748b' },
  checkIndicator: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  checkVoted: { backgroundColor: '#166534', borderColor: '#166534' },
  submitButton: { flexDirection: 'row', padding: 20, borderRadius: 20, alignItems: "center", justifyContent: 'center' },
  disabledButton: { backgroundColor: "#E5E7EB" },
  submitButtonText: { fontWeight: "900", fontSize: 14 },
  votedContainer: { padding: 40, alignItems: 'center', justifyContent: 'center', marginTop: 20, backgroundColor: WHITE, borderRadius: 20, marginHorizontal: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 10 },
  successCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  votedTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 10 },
  votedSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 25 },
  explorerBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1 },
  explorerBtnText: { fontSize: 14, fontWeight: '700', marginLeft: 8 },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyText: { color: "#9CA3AF", fontSize: 14, fontWeight: "700" },
  modalBg: { flex: 1, backgroundColor: '#F9FAFB' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: WHITE },
  backBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 12, marginRight: 15 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  modalScroll: { flex: 1 },
  reviewCard: { backgroundColor: WHITE, borderRadius: 20, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  reviewContent: { flexDirection: 'row', alignItems: 'center' },
  reviewPhoto: { width: 40, height: 40, borderRadius: 10, marginRight: 12 },
  reviewPos: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  reviewName: { fontSize: 15, fontWeight: '900' },
  reviewCoalition: { fontSize: 11, color: '#64748b', fontWeight: '700', marginTop: 2 },
  modalFooter: { padding: 20, backgroundColor: WHITE },
  confirmBtn: { padding: 20, borderRadius: 20, alignItems: 'center' },
  confirmBtnText: { fontWeight: '900' },
  eligibilityCard: { flexDirection: 'row', backgroundColor: WHITE, padding: 15, borderRadius: 20, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: '#166534', alignItems: 'center' },
  eligibilityIcon: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  eligibilityTitle: { fontSize: 14, fontWeight: '900', color: '#111' },
  eligibilitySub: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  notRegisteredCard: { borderLeftColor: LAIKIPIA_RED, backgroundColor: '#FFF5F5' },
  notRegisteredIcon: { backgroundColor: '#FFEBEB' },
  coalitionSlateCard: { marginBottom: 20, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
  coalitionGradient: { padding: 20 },
  slateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  slateTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
  slateBadge: { fontSize: 9, fontWeight: '800', marginTop: 2 },
  slateVoteBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  slateVoteBtnText: { fontSize: 12, fontWeight: '900' },
  slateMembers: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  slateMemberItem: { alignItems: 'center', width: (width - 100) / 3 },
  slateMemberPhoto: { width: 50, height: 50, borderRadius: 15, marginBottom: 8, borderWidth: 2, borderColor: WHITE },
  slateMemberName: { fontSize: 11, fontWeight: '800', color: '#111' },
  slateMemberPos: { fontSize: 8, color: '#6B7280', fontWeight: '700', textAlign: 'center' },
  toastContainer: { position: "absolute", top: 0, left: 20, right: 20, zIndex: 9999 },
  toastContent: { backgroundColor: WHITE, flexDirection: "row", alignItems: "center", padding: 15, borderRadius: 15, borderWidth: 1, borderColor: "#eee", elevation: 10 },
  toastText: { color: "#111", marginLeft: 10, fontWeight: "800", fontSize: 13 },
});