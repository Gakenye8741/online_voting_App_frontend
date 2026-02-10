import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Modal,
} from "react-native";
// Note: In a web environment, you might need to mock or remove these platform-specific imports.
// For a standard React Native project (like Expo), these imports are essential.
// If you are trying to run this in a web editor, you need a React Native Web shim.
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"; 

// --- TYPE DEFINITIONS ---
interface CandidateInterface {
  id: string; 
  name: string;
  position: string;
  manifesto: string;
  photo: string;
  keyFocus: string[];
}

interface ElectionPositionInterface {
  id: string; 
  title: string;
  candidates: CandidateInterface[];
}

type ElectionStatus = 'Pre-Election' | 'Active' | 'Closed';

// --- ELECTION TIMELINE CONFIGURATION (DYNAMIC FOR IMMEDIATE TESTING) ---
// ELECTION START: 5 minutes from now. ELECTION END: 30 minutes from now.
const ELECTION_START_DAY: Date = new Date(Date.now() + 1000 * 60 * 5);
const ELECTION_END_DAY: Date = new Date(Date.now() + 1000 * 60 * 30);

// Utility function to format countdown time
const formatTime = (distance: number): string => {
    if (distance < 0) return "0d 0h 0m 0s";
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

// --- MOCK DATA FOR MULTIPLE POSITIONS ---
const ALL_ELECTIONS: ElectionPositionInterface[] = [
  {
    id: "president",
    title: "University President Election",
    candidates: [
      { id: "A001", name: "Alice Johnson", position: "President", manifesto: "I will improve student services and enhance campus engagement. My plan includes a 24/7 library, improved campus security, and dedicated funding for student clubs and activities to ensure a vibrant and supportive university environment.", photo: "https://picsum.photos/seed/alice/100/100", keyFocus: ["Facilities Upgrade", "Campus Security", "Club Funding"] },
      { id: "D004", name: "David Green", position: "President", manifesto: "Focusing on academic excellence and research funding. I will lobby for higher scholarship quotas and invest in modernizing lab equipment across all faculties. Academic resources are my top priority.", photo: "https://picsum.photos/seed/david/100/100", keyFocus: ["Scholarship Quota", "Lab Modernization", "Faculty Resources"] },
      { id: "E005", name: "Emma White", position: "President", manifesto: "Committed to sustainability and modernizing campus technology. We will implement campus-wide recycling, introduce paperless administration, and ensure faster, more reliable campus Wi-Fi for everyone.", photo: "https://picsum.photos/seed/emma/100/100", keyFocus: ["Sustainability", "Reliable Wi-Fi", "Paperless Admin"] },
    ],
  },
  {
    id: "treasurer",
    title: "Student Treasurer Election",
    candidates: [
      { id: "B002", name: "Bob Smith", position: "Treasurer", manifesto: "Ensure transparent financial management for all student funds. I will introduce an open-source budget tracking system accessible to all students to foster trust and accountability.", photo: "https://picsum.photos/seed/bob/100/100", keyFocus: ["Budget Transparency", "Fund Auditing", "Zero Corruption"] },
      { id: "F006", name: "Frank Brown", position: "Treasurer", manifesto: "Increase funding for extracurricular and sports activities. My goal is to diversify non-academic spending to boost student welfare and competitive sports success.", photo: "https://picsum.photos/seed/frank/100/100", keyFocus: ["Sports Investment", "Welfare Programs", "Activity Grants"] },
    ],
  },
];

interface VoteScreenProps {
    navigation: any; 
}


export default function VoteScreen({ navigation }: VoteScreenProps): JSX.Element {
  const [votes, setVotes] = useState<Record<string, string | null>>({
    president: null,
    treasurer: null,
  });
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [currentCandidate, setCurrentCandidate] = useState<CandidateInterface | null>(null);

  const [countdown, setCountdown] = useState<string>("");
  const [electionStatus, setElectionStatus] = useState<ElectionStatus>('Pre-Election');

  // --- TIME-GATING LOGIC ---
  useEffect(() => {
    const calculateStatusAndCountdown = (): void => {
        const now: number = Date.now();
        const start: number = ELECTION_START_DAY.getTime();
        const end: number = ELECTION_END_DAY.getTime();
        let status: ElectionStatus;
        let targetTime: number;

        if (now < start) {
            status = 'Pre-Election';
            targetTime = start;
        } else if (now >= start && now <= end) {
            status = 'Active';
            targetTime = end;
        } else {
            status = 'Closed';
            targetTime = end;
        }
        setElectionStatus(status);

        const distance: number = targetTime - now;
        setCountdown(formatTime(distance));
    };

    const interval: NodeJS.Timeout = setInterval(calculateStatusAndCountdown, 1000);
    calculateStatusAndCountdown(); 

    return () => clearInterval(interval); 
  }, []);
  // -------------------------

  const allPositionsVoted: boolean = useMemo(() => ALL_ELECTIONS.every(
    (election) => votes[election.id] !== null
  ), [votes]);

  const isDisabled: boolean = hasVoted || electionStatus !== 'Active';

  const handleCandidateSelection = (positionId: string, candidateId: string): void => {
    if (isDisabled) {
        Alert.alert("Voting Inactive", `Cannot select a candidate. The official voting period is currently ${electionStatus}.`);
        return;
    }
    setVotes((prev) => ({
      ...prev,
      [positionId]: candidateId,
    }));
  };

  const handleViewProfile = (candidate: CandidateInterface): void => {
    setCurrentCandidate(candidate);
    setIsModalVisible(true);
  };

  const handleVoteSubmission = (): void => {
    if (electionStatus !== 'Active') {
        Alert.alert("Voting Inactive", `Cannot submit ballot. The official voting period is currently ${electionStatus}.`);
        return;
    }

    if (!allPositionsVoted) {
      Alert.alert("Incomplete Selection", "Please select a candidate for ALL positions before submitting your ballot.");
      return;
    }

    const votesSummary: string = ALL_ELECTIONS.map(election => {
        const candidateId = votes[election.id];
        const candidate = election.candidates.find(c => c.id === candidateId);
        return `${election.title}: ${candidate?.name || 'N/A'}`;
    }).join('\n');
    
    Alert.alert(
      "Confirm Final Ballot",
      `You are about to cast your ballot with the following selections:\n\n${votesSummary}\n\nThis action will be finalized on the blockchain and cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" as const },
        {
          text: "Submit Secure Ballot",
          style: "destructive" as const,
          onPress: () => {
            const finalBallotPayload: Record<string, string | null> = votes; 
            console.log("Final Ballot Payload (for blockchain):", finalBallotPayload);

            const mockTxId: string = `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 4)}`;
            setTransactionId(mockTxId);
            setHasVoted(true);
            
            Alert.alert("Success! 🎉", `Your secure ballot has been submitted.\n\nTransaction ID (Mock): ${mockTxId}\n\nYour vote is now immutable on the ledger.`);
          },
        },
      ]
    );
  };

  const renderCandidateCard = (electionId: string, candidate: CandidateInterface): JSX.Element => {
    const isSelected: boolean = votes[electionId] === candidate.id;
    
    return (
      <View key={candidate.id} style={[styles.candidateCardWrapper, isSelected && styles.selectedCard, isDisabled && styles.disabledCard]}>
        
        <View style={styles.infoContainer}>
          <Image source={{ uri: candidate.photo }} style={styles.candidatePhoto} />
          <View style={styles.textContainer}>
            <Text style={styles.candidateName}>{candidate.name}</Text>
            <Text style={styles.candidateManifesto} numberOfLines={2}>
              {candidate.manifesto}
            </Text>
            <Text style={styles.candidateFocus}>
              **Focus:** {candidate.keyFocus.slice(0, 2).join(", ")} {candidate.keyFocus.length > 2 && '...'}
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
            <Pressable
                style={styles.viewProfileButton}
                onPress={() => handleViewProfile(candidate)}
            >
                <MaterialCommunityIcons name="information-outline" size={18} color="#6A5ACD" />
                <Text style={styles.viewProfileText}>View Profile</Text>
            </Pressable>

            <Pressable
                style={styles.selectVoteButton}
                onPress={() => handleCandidateSelection(electionId, candidate.id)}
                disabled={isDisabled}
            >
                <Ionicons
                    name={isSelected ? "radio-button-on" : "radio-button-off"}
                    size={24}
                    color={isDisabled ? "#aaa" : (isSelected ? "#FF3366" : "#444")}
                />
                <Text style={[styles.selectVoteText, isSelected && styles.selectVoteTextSelected, isDisabled && styles.selectVoteTextDisabled]}>
                    {isDisabled ? 'Locked' : (isSelected ? 'Selected' : 'Select')}
                </Text>
            </Pressable>
        </View>
      </View>
    );
  };

  const CandidateDetailsModal = (): JSX.Element | null => {
    if (!currentCandidate) return null;
    
    return (
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
                <Image source={{ uri: currentCandidate.photo }} style={styles.modalPhoto} />
                <Text style={styles.modalName}>{currentCandidate.name}</Text>
                <Text style={styles.modalPosition}>{currentCandidate.position}</Text>

                <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>📜 Full Manifesto</Text>
                    <Text style={styles.modalManifesto}>{currentCandidate.manifesto}</Text>
                </View>

                <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>🎯 Key Focus Areas</Text>
                    {currentCandidate.keyFocus.map((focus: string, idx: number) => (
                       <Text key={idx} style={styles.modalFocusArea}>
                           <MaterialCommunityIcons name="star-circle" size={16} color="#FF8C00" /> {focus}
                       </Text>
                    ))}
                </View>
            </ScrollView>
            
            <Pressable
              style={styles.closeModalButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.closeModalText}>Close Profile & Return to Ballot</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  };

  const HeaderStatus = (): JSX.Element => {
    let iconName: 'hourglass-outline' | 'checkmark-circle-outline' | 'lock-closed-outline';
    let statusColor: string;
    let statusText: string;

    if (electionStatus === 'Active') {
        iconName = 'hourglass-outline';
        statusColor = '#FF3366';
        statusText = 'Time Left to Vote:';
    } else if (electionStatus === 'Pre-Election') {
        iconName = 'hourglass-outline';
        statusColor = '#6A5ACD';
        statusText = 'Voting Starts In:';
    } else {
        iconName = 'lock-closed-outline';
        statusColor = '#666';
        statusText = 'Voting Is Closed';
    }

    return (
        <View style={[styles.statusBox, { borderColor: statusColor + '50' }]}>
            <View style={styles.statusRow}>
                <Ionicons name={iconName} size={24} color={statusColor} />
                <Text style={[styles.statusText, { color: statusColor }]}>
                    {statusText}
                </Text>
            </View>
            <Text style={styles.countdownText}>
                {electionStatus !== 'Closed' ? countdown : 'N/A'}
            </Text>
            <Text style={styles.statusPeriod}>
                Period: {ELECTION_START_DAY.toLocaleDateString()} - {ELECTION_END_DAY.toLocaleDateString()}
            </Text>
        </View>
    );
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🗳️ Secure Ballot Submission</Text>
          <HeaderStatus />
        </View>

        {hasVoted ? (
          <View style={styles.votedContainer}>
            <Ionicons name="lock-closed-outline" size={80} color="#4CAF50" />
            <Text style={styles.votedText}>Your Secure Ballot is Cast.</Text>
            <Text style={styles.transactionId}>
                Blockchain Receipt ID (Tx): 
                <Text style={{fontWeight: '700', color: '#1E90FF', fontSize: 13}}> {transactionId}</Text>
            </Text>
            <Text style={styles.votedInstruction}>This transaction ID confirms your vote is immutable and transparently recorded on the secure ledger. **SAVE THIS ID**</Text>
          </View>
        ) : (
          <>
            <Text style={styles.mainInstruction}>
                {electionStatus === 'Active' ? 'Select Your Candidates (Ballot Open)' : `Review Candidate Profiles (${electionStatus})`}
            </Text>

            {ALL_ELECTIONS.map((election) => (
              <View key={election.id} style={styles.electionSection}>
                <View style={styles.electionHeader}>
                  <Text style={styles.electionTitle}>{election.title}</Text>
                </View>
                <Text style={styles.instruction}>
                  Select **one** candidate for this position.
                </Text>
                {election.candidates.map((candidate) =>
                  renderCandidateCard(election.id, candidate)
                )}
              </View>
            ))}

            <Pressable
              style={[
                styles.voteButton,
                (isDisabled || !allPositionsVoted) && styles.disabledVoteButton,
              ]}
              onPress={handleVoteSubmission}
              disabled={isDisabled || !allPositionsVoted}
            >
              <Text style={styles.voteButtonText}>
                {electionStatus !== 'Active'
                    ? `Voting is ${electionStatus}`
                    : (allPositionsVoted ? "Submit Final Secure Ballot" : "Select All Candidates to Submit")
                }
              </Text>
            </Pressable>
          </>
        )}
        
        <CandidateDetailsModal />

      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles for VoteScreen ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8f8f8" },
  container: { padding: 15, paddingBottom: 50 },
  header: { marginBottom: 20, alignItems: "center" },
  title: { fontSize: 24, fontWeight: "800", color: "#333", marginBottom: 10 },
  
  statusBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginTop: 5,
    borderWidth: 2, 
    borderColor: '#eee',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  countdownText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#333',
    marginTop: 5,
  },
  statusPeriod: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  mainInstruction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  
  electionSection: { marginBottom: 25, padding: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#f0f0f0' },
  electionHeader: { alignItems: 'center', marginBottom: 10 },
  electionTitle: { fontSize: 20, fontWeight: "700", color: "#FF3366" },
  instruction: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
    fontWeight: '500'
  },
  
  candidateCardWrapper: { 
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    borderWidth: 2,
    borderColor: "transparent",
    justifyContent: "space-between",
  },
  selectedCard: {
    borderColor: "#FF3366",
    backgroundColor: "#FFE6EB",
    elevation: 4,
  },
  disabledCard: {
    opacity: 0.5,
    backgroundColor: '#f5f5f5',
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  candidatePhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  candidateManifesto: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    lineHeight: 18,
  },
  candidateFocus: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E90FF",
    marginTop: 4,
  },
  actionRow: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
    marginTop: 5,
  },
  viewProfileButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5ff',
  },
  viewProfileText: { 
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '600',
    color: '#6A5ACD',
  },
  selectVoteButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  selectVoteText: {
    marginLeft: 5,
    fontSize: 15,
    fontWeight: '700',
    color: '#444'
  },
  selectVoteTextSelected: {
    color: '#FF3366',
  },
  selectVoteTextDisabled: {
    color: '#aaa',
  },

  voteButton: {
    backgroundColor: "#FF3366",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  disabledVoteButton: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
    elevation: 0,
  },
  voteButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 17,
  },
  
  votedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 50,
    backgroundColor: '#e6ffe6',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  votedText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
    marginTop: 15,
    textAlign: 'center',
  },
  transactionId: {
    fontSize: 13,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  votedInstruction: {
    fontSize: 12,
    color: '#999',
    marginTop: 15,
    textAlign: 'center',
    fontStyle: 'italic'
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  modalScrollContent: {
    alignItems: "center",
    paddingBottom: 10,
  },
  modalPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#6A5ACD',
  },
  modalName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#333",
    textAlign: 'center',
  },
  modalPosition: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FF3366",
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSection: {
    width: '100%',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 10,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6A5ACD',
    marginBottom: 10,
  },
  modalManifesto: {
    fontSize: 14,
    color: "#333",
    lineHeight: 22,
    textAlign: 'justify',
  },
  modalFocusArea: {
    fontSize: 15,
    color: "#333",
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeModalButton: {
    backgroundColor: "#6A5ACD",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  closeModalText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});