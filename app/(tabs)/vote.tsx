import React, { useState, useEffect, useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Image, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert, 
  RefreshControl 
} from "react-native";
import { useSelector } from "react-redux";
import { useGetAllElectionsQuery } from "@/src/store/Apis/Election.Api";
import { useGetCandidatesByElectionQuery } from "@/src/store/Apis/Candidates.Api";
import { useCastVoteMutation } from "@/src/store/Apis/Voting.Api";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RootState } from "@/src/store";
import * as Haptics from "expo-haptics";

export default function VoteScreen() {
  // --- SELECTORS (Strict Pathing) ---
  const user = useSelector((state: RootState) => state.auth.user);
  const userSchool = user?.school || "";
  const userRole = user?.role || "";
  const userName = user?.name || "Voter";
  
  const [positionsMap, setPositionsMap] = useState<Record<string, string>>({});
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>({});
  const [txProgress, setTxProgress] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // --- API QUERIES ---
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

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchElections(), refetchCandidates()]);
    setRefreshing(false);
  };

  useEffect(() => {
    const fetchPositions = async () => {
      if (!activeElection?.id) return;
      try {
        const res = await fetch(`https://online-voting-system-oq4p.onrender.com/api/positions?electionId=${activeElection.id}`);
        const data = await res.json();
        const map: Record<string, string> = {};
        if (data.positions) {
            data.positions.forEach((pos: any) => (map[pos.id] = pos.name));
        }
        setPositionsMap(map);
      } catch (err) { console.error("Position Fetch Error", err); }
    };
    fetchPositions();
  }, [activeElection]);

  // --- RE-ENGINEERED FILTER LOGIC ---
  const filteredGroupedCandidates = useMemo(() => {
    if (!candidatesData?.candidates || Object.keys(positionsMap).length === 0) return {};
    
    const schoolKeyword = userSchool.split(' ')[0].toLowerCase().trim();
    const role = userRole.toLowerCase().trim();

    return candidatesData.candidates.reduce((acc, candidate) => {
      const posName = positionsMap[candidate.position_id] || "Unknown Position";
      const posNameLower = posName.toLowerCase().trim();
      
      // Identify if the position is a School-specific rep
      const isSchoolRep = posNameLower.includes("school") && (posNameLower.includes("rep") || posNameLower.includes("representative"));
      
      let include = false;

      if (role === "voter") {
        // VOTERS: Only show the ONE position that is a School Rep AND matches their school name
        if (isSchoolRep && schoolKeyword && posNameLower.includes(schoolKeyword)) {
          include = true;
        }
      } else if (role === "delegate") {
        // DELEGATES: Show everything EXCEPT school-specific reps
        if (!isSchoolRep) {
          include = true;
        }
      } else {
        // ADMIN or OTHER: Show everything
        include = true;
      }

      if (include) {
        if (!acc[posName]) acc[posName] = [];
        acc[posName].push(candidate);
      }
      return acc;
    }, {} as Record<string, any[]>);
  }, [candidatesData, userSchool, userRole, positionsMap]);

  const positions = Object.keys(filteredGroupedCandidates);

  // --- BLOCKCHAIN CAST VOTE HANDLER ---
  const handleVoteSubmission = async () => {
    // Check if every visible position has a selection
    if (Object.keys(selectedVotes).length < positions.length) {
      Alert.alert("Incomplete Ballot", "You must select a candidate for every position shown.");
      return;
    }

    Alert.alert("Confirm Submission", "Your votes will be anchored to the blockchain sequentially. This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Submit Ballot",
        onPress: async () => {
          try {
            for (const posName of positions) {
              const posId = Object.keys(positionsMap).find(key => positionsMap[key] === posName);
              if (!posId) continue;

              setTxProgress(`Anchoring ${posName}...`);
              
              await castVote({
                candidate_id: selectedVotes[posName],
                position_id: posId,
                election_id: activeElection!.id,
              }).unwrap();
            }
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setHasVoted(true);
            setTxProgress("");
          } catch (error: any) {
            console.error(error);
            Alert.alert("Blockchain Error", error.data?.error || "Transaction failed on the network.");
            setTxProgress("");
          }
        }
      }
    ]);
  };

  if (isLoadingElections || isLoadingCandidates) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#c8102e" /></View>;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#c8102e"]} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{activeElection?.name || "Election Ballot"}</Text>
        <Text style={styles.subtitle}>Verified as: {userName}</Text>
        <View style={styles.infoRow}>
           <View style={styles.badge}><Text style={styles.badgeText}>{userRole.toUpperCase()}</Text></View>
           <Text style={styles.schoolSub}>{userSchool}</Text>
        </View>
      </View>

      <View style={styles.main}>
        {hasVoted ? (
          <View style={styles.votedContainer}>
            <MaterialCommunityIcons name="shield-check" size={100} color="#4CD964" />
            <Text style={styles.votedTitle}>Ballot Secured</Text>
            <Text style={styles.votedSub}>Your vote is now an immutable block on the ledger.</Text>
          </View>
        ) : positions.length === 0 ? (
          <View style={styles.empty}>
             <Ionicons name="finger-print" size={60} color="#eee" />
             <Text style={styles.emptyText}>No available positions for your profile.</Text>
          </View>
        ) : (
          <>
            {positions.map((posName) => (
              <View key={posName} style={styles.section}>
                <Text style={styles.posLabel}>{posName}</Text>
                {filteredGroupedCandidates[posName].map((cand) => (
                  <Pressable 
                    key={cand.id} 
                    style={[styles.card, selectedVotes[posName] === cand.id && styles.selected]}
                    onPress={() => setSelectedVotes({...selectedVotes, [posName]: cand.id})}
                  >
                    <Image source={{ uri: cand.photo_url }} style={styles.img} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{cand.name}</Text>
                      <Text style={styles.school}>{cand.school}</Text>
                    </View>
                    <Ionicons 
                      name={selectedVotes[posName] === cand.id ? "checkmark-circle" : "ellipse-outline"} 
                      size={26} color={selectedVotes[posName] === cand.id ? "#c8102e" : "#ddd"} 
                    />
                  </Pressable>
                ))}
              </View>
            ))}

            <TouchableOpacity 
              style={[styles.submitBtn, isSubmitting && styles.disabledBtn]} 
              onPress={handleVoteSubmission}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
                  <Text style={styles.submitBtnText}>{txProgress || "Processing..."}</Text>
                </View>
              ) : (
                <Text style={styles.submitBtnText}>CAST SECURE VOTE</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 30, backgroundColor: "#c8102e", borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
  title: { color: "#fff", fontSize: 24, fontWeight: "900" },
  subtitle: { color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 5, fontWeight: "600" },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  badge: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  schoolSub: { color: "#fff", fontSize: 12, opacity: 0.7, fontWeight: "500" },
  main: { padding: 20 },
  section: { marginBottom: 25 },
  posLabel: { fontSize: 12, fontWeight: "800", color: "#c8102e", marginBottom: 15, textTransform: "uppercase", letterSpacing: 1.5 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 16, borderRadius: 22, marginBottom: 12, elevation: 3, borderWidth: 1, borderColor: "#f0f0f0" },
  selected: { borderColor: "#c8102e", backgroundColor: "#fffafa" },
  img: { width: 60, height: 60, borderRadius: 18, marginRight: 15 },
  name: { fontSize: 18, fontWeight: "700", color: "#111" },
  school: { fontSize: 12, color: "#888", marginTop: 2 },
  submitBtn: { backgroundColor: "#c8102e", padding: 22, borderRadius: 22, alignItems: "center", marginTop: 20, elevation: 5 },
  disabledBtn: { backgroundColor: "#d1d1d1" },
  submitBtnText: { color: "#fff", fontWeight: "900", fontSize: 16, letterSpacing: 1 },
  votedContainer: { alignItems: "center", marginTop: 80 },
  votedTitle: { fontSize: 24, fontWeight: "900", color: "#111", marginTop: 20 },
  votedSub: { fontSize: 14, color: "#666", marginTop: 12, textAlign: 'center', paddingHorizontal: 20 },
  empty: { alignItems: "center", marginTop: 100 },
  emptyText: { color: "#bbb", marginTop: 20, fontSize: 16, fontWeight: "600" }
});