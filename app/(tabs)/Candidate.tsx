import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Animatable from "react-native-animatable";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useGetAllElectionsQuery } from "@/src/store/Apis/Election.Api";
import {
  useGetCandidatesByElectionQuery,
  useGetCandidatesByNameQuery,
  useGetCandidatesByPositionQuery,
  Candidate,
} from "@/src/store/Apis/Candidates.Api";
import { useGetCoalitionsByElectionQuery } from "@/src/store/Apis/Coalition.Api";

export default function CandidatesScreen() {
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState<string | null>(null);
  const [coalitionFilter, setCoalitionFilter] = useState<string | null>(null); 
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [positionsMap, setPositionsMap] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);
  
  const toastY = useRef(new Animated.Value(-100)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  
  const { width } = useWindowDimensions();
  const numColumns = width < 600 ? 2 : 3;
  const cardWidth = (width - 48) / numColumns;

  const { data: electionsData, refetch: refetchElections } = useGetAllElectionsQuery();
  const latestElection = electionsData?.elections
    ? [...electionsData.elections].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : undefined;

  const latestElectionId = latestElection?.id || "";

  const { data: allCandidatesData, isLoading: isLoadingAll, refetch: refetchCandidates } = 
    useGetCandidatesByElectionQuery(latestElectionId, { skip: !latestElectionId });
  
  const { data: coalitionData } = useGetCoalitionsByElectionQuery(latestElectionId, { skip: !latestElectionId });
  
  const { data: searchData } = useGetCandidatesByNameQuery(search, { skip: !search });
  const { data: positionData } = useGetCandidatesByPositionQuery(positionFilter || "", { skip: !positionFilter });

  const coalitionMap = useMemo(() => {
    const map: Record<string, { id: string, name: string, color: string, slogan: string }> = {};
    coalitionData?.coalitions.forEach(c => {
      map[c.id] = { id: c.id, name: c.name, color: c.color_code || "#c8102e", slogan: c.slogan || "" };
    });
    return map;
  }, [coalitionData]);

  let candidates: Candidate[] = [];
  if (search) candidates = searchData?.candidates || [];
  else if (positionFilter) candidates = positionData?.candidates || [];
  else candidates = allCandidatesData?.candidates || [];

  // Logic: If a coalition is filtered, only show that coalition's members.
  const filteredCandidates = coalitionFilter 
    ? candidates.filter(c => c.coalition_id === coalitionFilter)
    : candidates;

  const groupedData = useMemo(() => {
    const coalitions: Record<string, Candidate[]> = {};
    const byPosition: Record<string, Candidate[]> = {};
    
    filteredCandidates.forEach((candidate) => {
      const posName = positionsMap[candidate.position_id] || "Other Positions";
      
      // If we are explicitly filtering by coalition, group them by coalition name
      if (coalitionFilter && candidate.coalition_id && coalitionMap[candidate.coalition_id]) {
        const cName = coalitionMap[candidate.coalition_id].name;
        if (!coalitions[cName]) coalitions[cName] = [];
        coalitions[cName].push(candidate);
      } else {
        // DEFAULT BEHAVIOR: Group by Position
        if (!byPosition[posName]) byPosition[posName] = [];
        byPosition[posName].push(candidate);
      }
    });

    return { coalitions, byPosition };
  }, [filteredCandidates, positionsMap, coalitionMap, coalitionFilter]);

  const getInitials = (name: string) => {
    const words = name.split(" ");
    return words.length >= 2 ? `${words[0][0]}${words[1][0]}` : name.substring(0, 2);
  };

  const showToast = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.timing(toastY, { toValue: 120, duration: 500, useNativeDriver: true }),
      Animated.timing(toastOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastY, { toValue: -100, duration: 500, useNativeDriver: true }),
        Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 2800);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchElections(), refetchCandidates()]);
      showToast();
    } catch (err) { console.error(err); } 
    finally { setRefreshing(false); }
  };

  useEffect(() => {
    const fetchPositions = async () => {
      if (!latestElectionId) return;
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch(`https://online-voting-system-oq4p.onrender.com/api/positions?electionId=${latestElectionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const map: Record<string, string> = {};
        data.positions.forEach((pos: any) => (map[pos.id] = pos.name));
        setPositionsMap(map);
      } catch (err) { console.error(err); }
    };
    fetchPositions();
  }, [latestElectionId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <Animated.View style={[styles.toastContainer, { opacity: toastOpacity, transform: [{ translateY: toastY }] }]}>
        <LinearGradient colors={["#c8102e", "#a00d25"]} style={styles.toastContent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Ionicons name="sparkles" size={18} color="#fff" />
          <Text style={styles.toastText}>Sync Complete</Text>
        </LinearGradient>
      </Animated.View>

      <ScrollView 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#c8102e"]} tintColor="#c8102e" />}
      >
        <Animatable.View animation="fadeInDown" style={styles.headerSection}>
          <Text style={styles.headerTitle}>{latestElection?.name || "Candidates"}</Text>
          <View style={styles.headerAccent} />
        </Animatable.View>

        <View style={styles.searchWrapper}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#c8102e" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Find a candidate or alliance..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <View style={styles.filterRow}>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={positionFilter} onValueChange={(v) => {setPositionFilter(v); setCoalitionFilter(null);}}>
                <Picker.Item label="All Positions" value={null} />
                {Object.entries(positionsMap).map(([id, name]) => (
                  <Picker.Item key={id} label={name} value={id} />
                ))}
              </Picker>
            </View>

            <View style={styles.pickerContainer}>
              <Picker selectedValue={coalitionFilter} onValueChange={(v) => {setCoalitionFilter(v); setPositionFilter(null);}}>
                <Picker.Item label="All Alliances" value={null} />
                {Object.values(coalitionMap).map((coal) => (
                  <Picker.Item key={coal.id} label={coal.name} value={coal.id} />
                ))}
              </Picker>
            </View>

            {(search || positionFilter || coalitionFilter) && (
              <TouchableOpacity onPress={() => {setSearch(""); setPositionFilter(null); setCoalitionFilter(null);}} style={styles.resetBtn}>
                <Ionicons name="close-circle" size={22} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isLoadingAll && !refreshing ? (
          <ActivityIndicator size="large" color="#c8102e" style={{ marginTop: 50 }} />
        ) : (
          <View>
            {/* 1. RENDER BY POSITION (Default View) */}
            {Object.entries(groupedData.byPosition).map(([positionName, list]) => (
              <View key={positionName} style={styles.sectionWrapper}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>{positionName}</Text>
                  <View style={styles.sectionHeaderLine} />
                  <View style={styles.countBadge}><Text style={styles.countText}>{list.length}</Text></View>
                </View>
                
                <View style={styles.gridContainer}>
                  {list.map((candidate, index) => (
                    <CandidateCard 
                        key={candidate.id} 
                        candidate={candidate} 
                        index={index} 
                        cardWidth={cardWidth} 
                        positionsMap={positionsMap} 
                        onPress={() => { setSelectedCandidate(candidate); setModalVisible(true); }}
                        coalition={candidate.coalition_id ? coalitionMap[candidate.coalition_id] : null}
                    />
                  ))}
                </View>
              </View>
            ))}

            {/* 2. RENDER BY COALITION (Appears when coalition filter is active) */}
            {Object.entries(groupedData.coalitions).map(([coalitionName, list]) => (
              <View key={coalitionName} style={styles.sectionWrapper}>
                <View style={[styles.sectionHeader, styles.coalitionHeaderBox, { borderLeftColor: coalitionMap[list[0].coalition_id!]?.color }]}>
                  <View>
                    <Text style={[styles.sectionHeaderText, { color: coalitionMap[list[0].coalition_id!]?.color || '#c8102e' }]}>
                       {coalitionName} Alliance
                    </Text>
                    <Text style={styles.coalitionSlogan}>{coalitionMap[list[0].coalition_id!]?.slogan}</Text>
                  </View>
                  <View style={styles.sectionHeaderLine} />
                  <MaterialCommunityIcons name="shield-star" size={20} color={coalitionMap[list[0].coalition_id!]?.color || "#c8102e"} />
                </View>
                
                <View style={styles.gridContainer}>
                  {list.map((candidate, index) => (
                    <CandidateCard 
                        key={candidate.id} 
                        candidate={candidate} 
                        index={index} 
                        cardWidth={cardWidth} 
                        positionsMap={positionsMap} 
                        onPress={() => { setSelectedCandidate(candidate); setModalVisible(true); }}
                        coalition={coalitionMap[candidate.coalition_id!]}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Profile Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animatable.View animation="zoomIn" duration={300} style={styles.modalContent}>
            {selectedCandidate && (
              <>
                <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setModalVisible(false)}>
                  <Ionicons name="close-circle" size={32} color="#c8102e" />
                </TouchableOpacity>

                <View style={styles.modalHero}>
                  {selectedCandidate.photo_url ? (
                    <Image source={{ uri: selectedCandidate.photo_url }} style={styles.modalImage} />
                  ) : (
                    <View style={[styles.initialsPlaceholder, styles.modalLargeInitials]}>
                      <Text style={styles.modalInitialsText}>{getInitials(selectedCandidate.name)}</Text>
                    </View>
                  )}
                  <Text style={styles.modalTitle}>{selectedCandidate.name}</Text>
                  
                  {selectedCandidate.coalition_id && coalitionMap[selectedCandidate.coalition_id] && (
                     <View style={[styles.modalCoalitionBadge, { borderColor: coalitionMap[selectedCandidate.coalition_id].color }]}>
                        <Text style={[styles.modalCoalitionText, { color: coalitionMap[selectedCandidate.coalition_id].color }]}>
                            {coalitionMap[selectedCandidate.coalition_id].name} Member
                        </Text>
                     </View>
                  )}

                  <View style={styles.modalTag}>
                    <Text style={styles.modalTagText}>{positionsMap[selectedCandidate.position_id]}</Text>
                  </View>
                  <Text style={styles.modalSchoolText}>🏫 {selectedCandidate.school}</Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.manifestoBox}>
                   <Text style={styles.manifestoLabel}>Aspirations & Manifesto</Text>
                   <Text style={styles.manifestoText}>
                     {selectedCandidate.manifesto || selectedCandidate.bio || "No detailed manifesto provided."}
                   </Text>
                </ScrollView>

                <TouchableOpacity style={styles.closeModalBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeModalText}>Back to Candidates</Text>
                </TouchableOpacity>
              </>
            )}
          </Animatable.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const CandidateCard = ({ candidate, index, cardWidth, positionsMap, onPress, coalition }: any) => {
    const getInitials = (name: string) => {
        const words = name.split(" ");
        return words.length >= 2 ? `${words[0][0]}${words[1][0]}` : name.substring(0, 2);
    };
    const getPreview = (text?: string) => 
        (!text ? "No manifesto provided." : text.length > 40 ? text.slice(0, 40) + "..." : text);

    return (
        <Animatable.View animation="fadeInUp" delay={index * 50} style={[styles.candidateCard, { width: cardWidth }]}>
            <View style={[styles.cardPositionBadge, coalition && { backgroundColor: coalition.color }]}>
                <Text style={styles.cardPositionText} numberOfLines={1}>{positionsMap[candidate.position_id]}</Text>
            </View>

            {candidate.photo_url ? (
                <Image source={{ uri: candidate.photo_url }} style={[styles.candidateImage, coalition && { borderColor: coalition.color }]} />
            ) : (
                <View style={[styles.initialsPlaceholder, coalition && { backgroundColor: coalition.color }]}>
                    <Text style={styles.initialsText}>{getInitials(candidate.name)}</Text>
                </View>
            )}

            <View style={styles.cardInfo}>
                <Text style={styles.candidateName} numberOfLines={1}>{candidate.name}</Text>
                {coalition ? (
                    <Text style={[styles.coalitionMiniTag, { color: coalition.color }]}>🛡️ {coalition.name}</Text>
                ) : (
                    <Text style={styles.candidateSchool} numberOfLines={1}>🎓 {candidate.school}</Text>
                )}
                <Text style={styles.candidateManifestoPreview}>{getPreview(candidate.manifesto || candidate.bio)}</Text>
            </View>

            <TouchableOpacity style={[styles.seeMoreBtn, coalition && { backgroundColor: coalition.color }]} onPress={onPress}>
                <Text style={styles.seeMoreText}>Profile</Text>
            </TouchableOpacity>
        </Animatable.View>
    );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { padding: 16 },
  toastContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99999, alignItems: 'center' },
  toastContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 50, gap: 10, elevation: 12, shadowColor: "#c8102e", shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  headerSection: { marginBottom: 25, alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#c8102e", textAlign: 'center', textTransform: 'uppercase' },
  headerAccent: { width: 50, height: 4, backgroundColor: "#c8102e", borderRadius: 2, marginTop: 6 },
  searchWrapper: { marginBottom: 25 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 15, paddingHorizontal: 15, height: 50, borderWidth: 1.5, borderColor: '#f0f0f0', marginBottom: 12, elevation: 2 },
  searchInput: { flex: 1, fontSize: 15, color: '#333', fontWeight: '500' },
  filterRow: { flexDirection: 'row', gap: 10 },
  pickerContainer: { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#f0f0f0', height: 45, justifyContent: 'center' },
  resetBtn: { backgroundColor: '#c8102e', width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  sectionWrapper: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  coalitionHeaderBox: { backgroundColor: '#fdfdfd', padding: 10, borderRadius: 12, borderLeftWidth: 4 },
  coalitionSlogan: { fontSize: 10, fontStyle: 'italic', color: '#888', marginTop: 2 },
  sectionHeaderText: { fontSize: 14, fontWeight: '900', color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: 1 },
  sectionHeaderLine: { flex: 1, height: 1, backgroundColor: '#eee' },
  countBadge: { backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  countText: { fontSize: 10, fontWeight: '800', color: '#666' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 16 },
  candidateCard: { backgroundColor: "#fff", borderRadius: 20, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#eee", elevation: 6, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, minHeight: 260 },
  cardPositionBadge: { position: 'absolute', top: 0, backgroundColor: '#c8102e', paddingVertical: 4, paddingHorizontal: 10, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, zIndex: 1 },
  cardPositionText: { fontSize: 8, fontWeight: '900', color: '#fff', textTransform: 'uppercase' },
  candidateImage: { width: 80, height: 80, borderRadius: 40, marginTop: 15, marginBottom: 10, borderWidth: 2, borderColor: '#c8102e' },
  initialsPlaceholder: { width: 80, height: 80, borderRadius: 40, marginTop: 15, marginBottom: 10, backgroundColor: '#c8102e', justifyContent: 'center', alignItems: 'center' },
  initialsText: { color: "#fff", fontSize: 26, fontWeight: "900" },
  cardInfo: { alignItems: 'center', marginBottom: 12, flex: 1 },
  candidateName: { fontSize: 14, fontWeight: "800", color: "#1a1a1a", textAlign: 'center' },
  candidateSchool: { fontSize: 10, color: "#c8102e", fontWeight: '700', marginTop: 3 },
  coalitionMiniTag: { fontSize: 9, fontWeight: '800', marginTop: 3 },
  candidateManifestoPreview: { fontSize: 10, color: "#666", marginTop: 8, textAlign: 'center', lineHeight: 14 },
  seeMoreBtn: { backgroundColor: '#c8102e', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 12 },
  seeMoreText: { color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: "#fff", borderRadius: 30, padding: 20, width: '100%', maxHeight: "90%", elevation: 20 },
  modalCloseIcon: { alignSelf: 'flex-end', marginBottom: -10, zIndex: 10 },
  modalHero: { alignItems: 'center', marginBottom: 20 },
  modalImage: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#c8102e', marginBottom: 12 },
  modalLargeInitials: { width: 110, height: 110, borderRadius: 55, marginTop: 0 },
  modalInitialsText: { color: "#fff", fontSize: 38, fontWeight: "900" },
  modalTitle: { fontSize: 24, fontWeight: "900", color: "#1a1a1a", textAlign: 'center' },
  modalCoalitionBadge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, marginTop: 5 },
  modalCoalitionText: { fontSize: 11, fontWeight: '900' },
  modalTag: { backgroundColor: '#fff1f2', paddingVertical: 6, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1, borderColor: '#ffccd2', marginVertical: 8 },
  modalTagText: { color: '#c8102e', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  modalSchoolText: { fontSize: 14, color: '#666', fontWeight: '600' },
  manifestoBox: { backgroundColor: '#f9f9f9', borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
  manifestoLabel: { fontSize: 12, fontWeight: '900', color: '#c8102e', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  manifestoText: { fontSize: 15, color: "#444", lineHeight: 24 },
  closeModalBtn: { backgroundColor: "#c8102e", paddingVertical: 16, borderRadius: 15, alignItems: "center" },
  closeModalText: { color: "#fff", fontWeight: "900", fontSize: 15, textTransform: 'uppercase' },
});