import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, RefreshControl, TouchableOpacity, Dimensions, Modal, TextInput, Alert, Linking } from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Animatable from 'react-native-animatable';
import * as LocalAuthentication from 'expo-local-authentication';
import { RootState } from '@/src/store';
import { electionsApi } from '@/src/store/Apis/Election.Api';
import { delegatesApi } from '@/src/store/Apis/Delegate.Api';
import { positionApi } from '@/src/store/Apis/Positions.Api';
import { candidatesApi } from '@/src/store/Apis/Candidates.Api';
import { useCastVoteMutation, useGetMyVotesQuery } from '@/src/store/Apis/Voting.Api';
// --- Integrated Coalition Apis ---
import { useGetCoalitionsByElectionQuery, useGetCoalitionFullSlateQuery } from '@/src/store/Apis/Coalition.Api';

const { width, height } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 50) / 2;

const LAIKIPIA_RED = '#c8102e';
const DELEGATE_BLUE = '#c8102e';
const SUCCESS_GREEN = '#10b981';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1F2937';
const WARNING_GOLD = '#c8102e';

const VoteScreen = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [timeLeft, setTimeLeft] = useState("00h 00m 00s");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [secretCode, setSecretCode] = useState("");
  const [showSecretCode, setShowSecretCode] = useState(false);
  const [votingStatus, setVotingStatus] = useState("Anchor Vote to Blockchain");

  // --- API Hooks ---
  const { data: electionData, isLoading: loadingElections, refetch: refetchElections } = electionsApi.useGetAllElectionsQuery();
  
  const latestElection = useMemo(() => {
    if (!electionData?.elections || !Array.isArray(electionData.elections)) return null;
    return [...electionData.elections].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }, [electionData]);

  const { data: myVotesData, refetch: refetchMyVotes } = useGetMyVotesQuery(latestElection?.id ?? '', { skip: !latestElection?.id });
  
  // Standard Voting Mutation
  const [castStandardVote, { isLoading: isStandardVoting }] = useCastVoteMutation();
  // Delegate Voting Mutation (Ensure this is defined in your delegatesApi)
  const [castDelegateVote, { isLoading: isDelegateVoting }] = delegatesApi.useCastDelegateVoteMutation();

  const isVoting = isStandardVoting || isDelegateVoting;

  const hasVoted = useMemo(() => {
    return !!(myVotesData?.data && myVotesData.data.totalCast > 0);
  }, [myVotesData]);

  const existingVote = useMemo(() => {
    return hasVoted ? myVotesData?.data.votes[0] : null;
  }, [hasVoted, myVotesData]);

  const { data: rosterData, refetch: refetchRoster } = delegatesApi.useGetDelegateRosterQuery(
    latestElection?.id ?? '', 
    { skip: !latestElection?.id }
  );

  // Identify the specific delegate record for the logged-in user
  const currentDelegateRecord = useMemo(() => {
    const delegates = rosterData?.data;
    if (!delegates || !user?.regNo) return null;
    return delegates.find((d: any) => d.reg_no?.toLowerCase() === user.regNo?.toLowerCase());
  }, [rosterData, user]);

  const isDelegate = !!currentDelegateRecord;

  const { data: positionsData, refetch: refetchPositions } = positionApi.useGetPositionsByElectionQuery(
    latestElection?.id ?? null, 
    { skip: !latestElection?.id }
  );

  const activePositionId = useMemo(() => {
    if (!positionsData?.positions) return null;
    if (isDelegate) {
      return positionsData.positions.find(p => p.tier === 'university')?.id || null;
    } else {
      return positionsData.positions.find(
        p => p.tier === 'school' && p.school?.toLowerCase() === user?.school?.toLowerCase()
      )?.id || null;
    }
  }, [positionsData, user, isDelegate]);

  const activePositionName = useMemo(() => {
    if (!positionsData?.positions || !activePositionId) return "Position";
    const pos = positionsData.positions.find(p => p.id === activePositionId);
    return pos?.name || "Candidate";
  }, [positionsData, activePositionId]);

  const isElectionClosed = timeLeft === "CLOSED";

  // --- Standard Candidate Data ---
  const { data: candidateData, isLoading: loadingCandidates, refetch: refetchCandidates } = candidatesApi.useGetCandidatesByPositionQuery(
    activePositionId ?? '',
    { skip: !activePositionId || isDelegate || hasVoted } 
  );

  // --- Delegate Coalition Data ---
  const { data: coalitionsData, isLoading: loadingCoalitions, refetch: refetchCoalitions } = useGetCoalitionsByElectionQuery(
    latestElection?.id ?? '',
    { skip: !latestElection?.id || !isDelegate || hasVoted }
  );

  // --- Selected Coalition Slate Members ---
  const { data: slateData, isLoading: loadingSlate } = useGetCoalitionFullSlateQuery(
    selectedCandidate?.id ?? '',
    { skip: !isDelegate || !selectedCandidate?.id }
  );

  const isProcessLocked = isVoting || (isElectionClosed && !isDelegate);

  const handleCastVote = async () => {
    if (isElectionClosed && !isDelegate) {
        Alert.alert("Polls Closed", "The standard voting period has ended.");
        return;
    }

    if (!latestElection?.id || !selectedCandidate?.id || !activePositionId) {
      Alert.alert("Error", "Election details are missing. Please refresh.");
      return;
    }

    if (!secretCode || secretCode.length < 4) {
      Alert.alert("Invalid Code", "Please enter your secret code.");
      return;
    }

    setVotingStatus("Authenticating...");
    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirm Identity to Anchor Ballot',
    });
    
    if (!auth.success) {
      setVotingStatus("Anchor Vote to Blockchain");
      return;
    }

    try {
      setVotingStatus("Anchoring to Sepolia...");

      if (isDelegate) {
        // --- DELEGATE VOTE PAYLOAD ---
        const payload = {
          delegate_id: currentDelegateRecord?.delegate_id,
          election_id: latestElection.id,
          coalition_id: selectedCandidate.id,
          position_id: activePositionId,
          secret_code: secretCode
        };
        await castDelegateVote(payload).unwrap();
      } else {
        // --- STANDARD VOTE PAYLOAD ---
        const payload = {
          election_id: latestElection.id,
          candidate_id: selectedCandidate.id,
          position_id: activePositionId,
          secret_code: secretCode
        };
        await castStandardVote(payload).unwrap();
      }
      
      setSecretCode("");
      setSelectedCandidate(null);
      refetchMyVotes();
      Alert.alert("Success", "Ballot successfully anchored to the Sepolia blockchain ledger.");
    } catch (error: any) {
      Alert.alert("Voting Failed", error.data?.message || "Check your secret code or ledger connection.");
    } finally {
      setVotingStatus("Anchor Vote to Blockchain");
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchElections();
      if (latestElection?.id) {
        await Promise.all([refetchRoster(), refetchPositions(), refetchMyVotes()]);
        if (isDelegate) await refetchCoalitions();
      }
      if (activePositionId && !isDelegate) await refetchCandidates();
    } finally {
      setRefreshing(false);
    }
  }, [latestElection, activePositionId, isDelegate, refetchElections, refetchRoster, refetchPositions, refetchMyVotes, refetchCandidates, refetchCoalitions]);

  useEffect(() => {
    if (!latestElection?.end_date) return;
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const targetDate = Date.parse(latestElection.end_date);
      const distance = targetDate - now;

      if (distance < 0) {
        setTimeLeft("CLOSED");
        clearInterval(timer);
      } else {
        const h = Math.floor(distance / 3600000);
        const m = Math.floor((distance % 3600000) / 60000);
        const s = Math.floor((distance % 60000) / 1000);
        const pad = (n: number) => n < 10 ? `0${n}` : n;
        setTimeLeft(`${pad(h)}h ${pad(m)}m ${pad(s)}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [latestElection]);

  const themeColor = isDelegate ? DELEGATE_BLUE : LAIKIPIA_RED;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Image source={require('@/assets/images/Laikipia-logo.png')} style={styles.logo} />
          <View>
            <Text style={styles.greetingText}>Blockchain Voting Portal</Text>
            <Text style={styles.electionNameText} numberOfLines={1}>
              {latestElection?.name || "LUSA General Elections"}
            </Text>
          </View>
        </View>
        <View style={[styles.liveBadge, { borderColor: isElectionClosed ? WARNING_GOLD : themeColor + '30' }]}>
          <View style={[styles.liveDot, { backgroundColor: isElectionClosed ? WARNING_GOLD : themeColor }]} />
          <Text style={[styles.liveBadgeText, { color: isElectionClosed ? WARNING_GOLD : themeColor }]}>
            {isElectionClosed ? 'POLLS CLOSED' : 'LIVE'}
          </Text>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[themeColor]} />}
      >
        <Animatable.View animation="fadeInDown" style={styles.profileSummary}>
          <View style={[styles.avatarBox, { backgroundColor: themeColor }]}>
            <MaterialCommunityIcons name={isDelegate ? "shield-star" : "account-check"} size={22} color={WHITE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{user?.name || "Student Voter"}</Text>
            <Text style={styles.profileInfo}>{user?.regNo} • {user?.school}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: themeColor + '15' }]}>
            <Text style={[styles.statusPillText, { color: themeColor }]}>
              {isDelegate ? 'OFFICIAL DELEGATE' : 'STANDARD VOTER'}
            </Text>
          </View>
        </Animatable.View>

        {hasVoted ? (
          /* --- VERIFICATION / SUCCESS SCREEN --- */
          <Animatable.View animation="zoomIn" style={styles.successContainer}>
            <View style={[styles.successIconCircle, { backgroundColor: SUCCESS_GREEN + '15' }]}>
              <MaterialCommunityIcons name="shield-check" size={70} color={SUCCESS_GREEN} />
            </View>
            <Text style={styles.successTitle}>Ballot Verified</Text>
            <Text style={styles.successSubtitle}>Your selection is now permanently anchored to the Sepolia Blockchain ledger for the {latestElection?.name} </Text>
            
            <View style={styles.receiptCard}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>BLOCKCHAIN RECEIPT</Text>
                <View style={styles.verifiedTag}>
                  <Ionicons name="checkmark-circle" size={14} color={SUCCESS_GREEN} />
                  <Text style={styles.verifiedTagText}>VERIFIED</Text>
                </View>
              </View>
              
              <Text style={styles.receiptLabelSmall}>TRANSACTION HASH</Text>
              <Text style={styles.hashText}>{existingVote?.transaction_hash || "Syncing with ledger..."}</Text>
              
              <View style={[styles.divider, { marginVertical: 15 }]} />
              
              <View style={styles.receiptMetaRow}>
                <View>
                  <Text style={styles.receiptLabelSmall}>TIMESTAMP</Text>
                  <Text style={styles.receiptValueSmall}>{new Date(existingVote?.createdAt || Date.now()).toLocaleString()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.receiptLabelSmall}>NETWORK</Text>
                  <Text style={styles.receiptValueSmall}>Ethereum Sepolia</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.verifyButton, { backgroundColor: themeColor }]}
                onPress={() => Linking.openURL(`https://sepolia.etherscan.io/tx/${existingVote?.transaction_hash}`)}
              >
                <MaterialCommunityIcons name="open-in-new" size={20} color={WHITE} />
                <Text style={styles.verifyButtonText}>Explore Transaction on Ledger</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        ) : (
          <>
            <View style={[styles.responsibilityCard, { borderLeftColor: isElectionClosed && !isDelegate ? WARNING_GOLD : themeColor }]}>
              <View style={styles.responsibilityHeader}>
                <Ionicons 
                    name={isDelegate ? "briefcase" : (isElectionClosed ? "lock-closed" : "school")} 
                    size={20} 
                    color={isElectionClosed && !isDelegate ? WARNING_GOLD : themeColor} 
                />
                <Text style={[styles.responsibilityTitle, { color: isElectionClosed && !isDelegate ? WARNING_GOLD : themeColor }]}>
                  {isDelegate ? "Delegate Power: Executive Election" : "School Representative Ballot"}
                </Text>
              </View>
              <Text style={styles.responsibilityText}>
                {isDelegate 
                  ? "Standard polls have closed. As an elected delegate, you now hold the mandate to vote for the Executive Coalition slate." 
                  : (isElectionClosed 
                      ? "General voting has concluded. The system is currently locked as we prepare for the final delegate tally." 
                      : `Cast your vote for the School of ${user?.school} representative.`)}
              </Text>
            </View>

            <View style={styles.mainContainer}>
              <View style={styles.row}>
                <Text style={styles.sectionLabel}>
                  {isDelegate ? "EXECUTIVE COALITION CANDIDATES" : (isElectionClosed ? "POLLING CONCLUDED" : `CANDIDATES: ${user?.school?.toUpperCase()}`)}
                </Text>
                <View style={[styles.timerTag, isElectionClosed && { borderColor: WARNING_GOLD + '40' }]}>
                  <Ionicons name="time-outline" size={12} color={isElectionClosed ? WARNING_GOLD : themeColor} />
                  <Text style={[styles.timerValue, { color: isElectionClosed ? WARNING_GOLD : themeColor }]}>{timeLeft}</Text>
                </View>
              </View>

              {loadingCandidates || loadingElections || loadingCoalitions ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color={themeColor} size="large" />
                  <Text style={styles.loadingText}>Verifying Blockchain Ledger...</Text>
                </View>
              ) : (
                <View style={styles.gridContainer}>
                  {(!isDelegate && isElectionClosed) ? (
                    <Animatable.View animation="fadeInUp" style={styles.closedStateContainer}>
                         <MaterialCommunityIcons name="shield-lock-outline" size={64} color="#CBD5E1" />
                         <Text style={styles.closedStateTitle}>Polls are Closed</Text>
                         <Text style={styles.closedStateSubtitle}>
                            The School Representative election for {user?.school} has ended. You will be notified once the final results are anchored to the blockchain.
                         </Text>
                         <View style={styles.divider} />
                         <Text style={styles.delegateNotice}>
                            Delegate-only voting for the Executive Coalition is currently in progress.
                         </Text>
                    </Animatable.View>
                  ) : (
                    isDelegate ? (
                        /* --- DELEGATE VIEW: COALITION CARDS --- */
                        coalitionsData?.coalitions?.map((coalition: any) => (
                          <TouchableOpacity 
                            key={coalition.id} 
                            disabled={isVoting}
                            onPress={() => setSelectedCandidate(coalition)}
                            style={[
                                styles.candidateCard, 
                                selectedCandidate?.id === coalition.id && { borderColor: themeColor, borderWidth: 2 }
                            ]}
                          >
                             <View style={[styles.coalitionLogoPlaceholder, { backgroundColor: coalition.color_code || DELEGATE_BLUE }]}>
                               {coalition.logo_url ? (
                                   <Image source={{ uri: coalition.logo_url }} style={styles.fullImage} />
                               ) : (
                                   <MaterialCommunityIcons name="shield-account" size={48} color={WHITE} />
                               )}
                            </View>
                            <View style={styles.cardBottom}>
                              <Text style={styles.candidateName} numberOfLines={1}>{coalition.name}</Text>
                              <Text style={styles.candidateSchool} numberOfLines={1}>
                                  {coalition.acronym || "Executive Slate"}
                              </Text>
                            </View>
                            <View style={styles.delegateBadge}><Text style={styles.delegateBadgeText}>COALITION</Text></View>
                          </TouchableOpacity>
                        ))
                    ) : (
                        /* --- STANDARD VIEW: INDIVIDUAL CARDS --- */
                        candidateData?.candidates?.map((candidate: any) => (
                            <TouchableOpacity 
                              key={candidate.id} 
                              disabled={isProcessLocked}
                              onPress={() => setSelectedCandidate(candidate)}
                              style={[
                                  styles.candidateCard, 
                                  selectedCandidate?.id === candidate.id && { borderColor: themeColor, borderWidth: 2 },
                                  isProcessLocked && { opacity: 0.9 }
                              ]}
                            >
                              <Image source={{ uri: candidate.photo_url }} style={styles.candidatePhoto} />
                              <View style={styles.cardBottom}>
                                <Text style={styles.candidateName} numberOfLines={1}>{candidate.name}</Text>
                                <Text style={styles.candidateSchool} numberOfLines={1}>
                                    {candidate.school}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          ))
                    )
                  )}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* --- CONFIRMATION MODAL --- */}
      <Modal visible={!!selectedCandidate && !hasVoted} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Animatable.View animation="fadeInUp" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isDelegate ? "Review Slate" : "Confirm Ballot"}</Text>
              <TouchableOpacity disabled={isVoting} onPress={() => { setSelectedCandidate(null); setSecretCode(""); setShowSecretCode(false); }}>
                <Ionicons name="close" size={24} color={isVoting ? "#CBD5E1" : TEXT_DARK} />
              </TouchableOpacity>
            </View>

            {isDelegate ? (
                /* --- DELEGATE MODAL VIEW: SLATE MEMBERS --- */
                <View style={{ marginBottom: 20 }}>
                    <View style={styles.voterChoiceCard}>
                        <View style={[styles.modalPhoto, { backgroundColor: selectedCandidate?.color_code || DELEGATE_BLUE, justifyContent: 'center', alignItems: 'center' }]}>
                             <MaterialCommunityIcons name="shield-star" size={30} color={WHITE} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.modalCandidateName}>{selectedCandidate?.name}</Text>
                            <Text style={styles.modalCandidateSchool}>{selectedCandidate?.slogan || "Executive Coalition"}</Text>
                        </View>
                    </View>

                    <Text style={styles.inputLabel}>Slate Lineup</Text>
                    {loadingSlate ? (
                        <ActivityIndicator color={DELEGATE_BLUE} style={{ marginVertical: 20 }} />
                    ) : (
                        slateData?.coalition?.candidates?.map((member: any) => (
                            <View key={member.id} style={styles.memberRow}>
                                <Image source={{ uri: member.photo_url }} style={styles.memberThumb} />
                                <View>
                                    <Text style={styles.memberName}>{member.name}</Text>
                                    <Text style={styles.memberPos}>{member.position?.name}</Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            ) : (
                /* --- STANDARD MODAL VIEW --- */
                <View style={styles.voterChoiceCard}>
                    <Image source={{ uri: selectedCandidate?.photo_url }} style={styles.modalPhoto} />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.modalCandidateSchool, { color: themeColor, fontWeight: '900', marginBottom: 2 }]}>
                        {activePositionName.toUpperCase()}
                        </Text>
                        <Text style={styles.modalCandidateName}>{selectedCandidate?.name}</Text>
                        <Text style={styles.modalCandidateSchool}>{selectedCandidate?.school}</Text>
                    </View>
                </View>
            )}

            <View style={[styles.responsibilityCard, { marginHorizontal: 0, marginBottom: 20, backgroundColor: '#F8FAFC' }]}>
                <Text style={[styles.responsibilityTitle, { color: themeColor, fontSize: 11 }]}>
                    BLOCKCHAIN FINALIZATION
                </Text>
                <Text style={[styles.responsibilityText, { fontSize: 11 }]}>
                    Your vote will be encrypted and anchored to the LUSA 2026 election ledger on Ethereum Sepolia.
                </Text>
            </View>

            <Text style={styles.inputLabel}>Secure Voting Code</Text>
            <View style={[styles.inputContainer, isVoting && { opacity: 0.7 }]}>
              <MaterialCommunityIcons name="shield-key-outline" size={20} color={themeColor} />
              <TextInput 
                style={styles.textInput}
                placeholder="Enter 4-digit code"
                secureTextEntry={!showSecretCode}
                keyboardType="numeric"
                value={secretCode}
                onChangeText={setSecretCode}
                editable={!isVoting} 
              />
              <TouchableOpacity disabled={isVoting} onPress={() => setShowSecretCode(!showSecretCode)}>
                <Ionicons name={showSecretCode ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              disabled={isVoting || (isDelegate && loadingSlate)}
              onPress={handleCastVote}
              style={[styles.confirmBtn, { backgroundColor: themeColor }, (isVoting || (isDelegate && loadingSlate)) && { opacity: 0.8 }]}
            >
              {isVoting && <ActivityIndicator color={WHITE} style={{ marginRight: 10 }} />}
              <Text style={styles.confirmBtnText}>{votingStatus}</Text>
              {!isVoting && <MaterialCommunityIcons name="cube-send" size={20} color={WHITE} />}
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 40, height: 40 },
  greetingText: { fontSize: 10, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' },
  electionNameText: { fontSize: 15, fontWeight: '900', color: TEXT_DARK, width: 180 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, backgroundColor: WHITE },
  liveDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  liveBadgeText: { fontSize: 10, fontWeight: '900' },
  profileSummary: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 20, padding: 12, backgroundColor: WHITE, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2 },
  avatarBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  profileName: { fontSize: 15, fontWeight: '800', color: TEXT_DARK },
  profileInfo: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusPillText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  responsibilityCard: { margin: 20, padding: 16, backgroundColor: WHITE, borderRadius: 16, borderLeftWidth: 4, elevation: 1 },
  responsibilityHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  responsibilityTitle: { fontSize: 13, fontWeight: '900' },
  responsibilityText: { fontSize: 12, color: '#64748B', lineHeight: 18, fontWeight: '500' },
  mainContainer: { paddingHorizontal: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '900', color: '#64748B', letterSpacing: 0.8 },
  timerTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: WHITE, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  timerValue: { fontSize: 12, fontWeight: '800', fontFamily: 'monospace' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  candidateCard: { width: COLUMN_WIDTH, backgroundColor: WHITE, borderRadius: 24, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9', elevation: 4 },
  candidatePhoto: { width: '100%', height: 190, backgroundColor: '#F1F5F9' },
  coalitionLogoPlaceholder: { width: '100%', height: 190, justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: '100%', height: '100%' },
  cardBottom: { padding: 15 },
  candidateName: { fontSize: 14, fontWeight: '900', color: TEXT_DARK },
  candidateSchool: { fontSize: 10, color: '#64748B', marginTop: 4, fontWeight: '700' },
  loadingBox: { marginTop: 60, alignItems: 'center' },
  loadingText: { marginTop: 15, fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: WHITE, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, minHeight: height * 0.5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: TEXT_DARK },
  voterChoiceCard: { flexDirection: 'row', alignItems: 'center', gap: 15, backgroundColor: '#F8FAFC', padding: 15, borderRadius: 20, marginBottom: 25 },
  modalPhoto: { width: 60, height: 60, borderRadius: 30 },
  modalCandidateName: { fontSize: 16, fontWeight: '800', color: TEXT_DARK },
  modalCandidateSchool: { fontSize: 12, color: '#64748B' },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 10, textTransform: 'uppercase' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 16, paddingHorizontal: 15, height: 55, marginBottom: 25 },
  textInput: { flex: 1, marginLeft: 10, fontSize: 16, fontWeight: '700', color: TEXT_DARK },
  confirmBtn: { height: 60, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  confirmBtnText: { color: WHITE, fontSize: 15, fontWeight: '900' },
  successContainer: { padding: 30, alignItems: 'center', marginTop: 10 },
  successIconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: '900', color: TEXT_DARK, textAlign: 'center' },
  successSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 12, lineHeight: 22, fontWeight: '500' },
  receiptCard: { width: '100%', backgroundColor: WHITE, borderRadius: 28, padding: 20, marginTop: 30, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  receiptLabel: { fontSize: 12, fontWeight: '900', color: TEXT_DARK, letterSpacing: 1.2 },
  receiptLabelSmall: { fontSize: 10, fontWeight: '800', color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase' },
  receiptValueSmall: { fontSize: 13, fontWeight: '700', color: TEXT_DARK },
  receiptMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  verifiedTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: SUCCESS_GREEN + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  verifiedTagText: { fontSize: 10, fontWeight: '900', color: SUCCESS_GREEN },
  hashText: { fontSize: 11, color: '#64748B', backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, fontFamily: 'monospace', borderWidth: 1, borderColor: '#F1F5F9' },
  verifyButton: { height: 55, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 10, elevation: 2 },
  verifyButtonText: { color: WHITE, fontSize: 15, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  closedStateContainer: { width: '100%', alignItems: 'center', padding: 30, backgroundColor: WHITE, borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  closedStateTitle: { fontSize: 18, fontWeight: '900', color: TEXT_DARK, marginTop: 15 },
  closedStateSubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 10, lineHeight: 20 },
  delegateNotice: { fontSize: 11, color: WARNING_GOLD, fontWeight: '800', textAlign: 'center', textTransform: 'uppercase' },
  delegateBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: DELEGATE_BLUE, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  delegateBadgeText: { color: WHITE, fontSize: 9, fontWeight: '900' },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F1F5F9', padding: 12, borderRadius: 14, marginBottom: 8 },
  memberThumb: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#CBD5E1' },
  memberName: { fontSize: 13, fontWeight: '800', color: TEXT_DARK },
  memberPos: { fontSize: 10, color: '#64748B' }
});

export default VoteScreen;