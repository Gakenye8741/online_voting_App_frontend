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

// --- REFINED TOAST COMPONENT ---
const Toast = ({ visible, message }: { visible: boolean; message: string }) => {
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
      <View style={styles.toastContent}>
        <Ionicons name="checkmark-circle" size={20} color="#c8102e" />
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const POSITION_ORDER: Record<string, number> = {
  "President": 1,
  "Deputy President": 2,
  "Vice President": 3,
  "Secretary General": 4,
  "Deputy Secretary General": 5,
  "Treasurer": 6,
  "Organizing Secretary": 7,
  "Director of Academics": 8,
  "Director of Welfare": 9,
  "Director of Gender": 10,
  "Director of Sports": 11,
};

export default function CandidatesScreen() {
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState<string | null>(null);
  const [coalitionFilter, setCoalitionFilter] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [zoomVisible, setZoomVisible] = useState(false); 
  const [positionsMap, setPositionsMap] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

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

  const filteredCandidates = coalitionFilter
    ? candidates.filter(c => c.coalition_id === coalitionFilter)
    : candidates;

  const groupedData = useMemo(() => {
    const coalitions: Record<string, Candidate[]> = {};
    const byPosition: Record<string, Candidate[]> = {};

    filteredCandidates.forEach((candidate) => {
      const posName = positionsMap[candidate.position_id] || "Other Positions";
      if (coalitionFilter && candidate.coalition_id && coalitionMap[candidate.coalition_id]) {
        const cName = coalitionMap[candidate.coalition_id].name;
        if (!coalitions[cName]) coalitions[cName] = [];
        coalitions[cName].push(candidate);
      } else {
        if (!byPosition[posName]) byPosition[posName] = [];
        byPosition[posName].push(candidate);
      }
    });

    const sortedPositions = Object.keys(byPosition).sort((a, b) => (POSITION_ORDER[a] || 999) - (POSITION_ORDER[b] || 999));
    const sortedByPosition: Record<string, Candidate[]> = {};
    sortedPositions.forEach(pos => { sortedByPosition[pos] = byPosition[pos]; });

    return { coalitions, byPosition: sortedByPosition };
  }, [filteredCandidates, positionsMap, coalitionMap, coalitionFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await Promise.all([refetchElections(), refetchCandidates()]);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 3000);
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

  const getInitials = (name: string) => {
    const words = name.split(" ");
    return words.length >= 2 ? `${words[0][0]}${words[1][0]}` : name.substring(0, 2);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <Toast visible={toastVisible} message="Content refreshed successfully" />

      {/* --- BALANCED PROFESSIONAL HEADER --- */}
      <View style={styles.topHeader}>
        <Animatable.View animation="fadeInLeft" style={styles.headerLeft}>
          <Image source={require('@/assets/images/Laikipia-logo.png')} style={styles.logo} />
          <View>
            <Text style={styles.greetingText}>Active Election Portal</Text>
            <Text style={styles.userNameText}>{latestElection?.name || "Official Ballot"} CANDIDATES</Text>
          </View>
        </Animatable.View>
        <View style={styles.liveBadgeHome}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeTextHome}>LIVE</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#c8102e"]} />}
      >
        <View style={styles.mainContainer}>
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#c8102e" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search candidates by name..."
                placeholderTextColor="#999"
                value={search}
                onChangeText={setSearch}
              />
            </View>
            
            <View style={styles.filterRow}>
              <View style={styles.pickerWrapper}>
                <Ionicons name="briefcase-outline" size={14} color="#c8102e" style={styles.pickerIcon} />
                <Picker 
                    style={styles.picker}
                    selectedValue={positionFilter} 
                    onValueChange={(v) => { setPositionFilter(v); setCoalitionFilter(null); }}
                >
                  <Picker.Item label="Positions" value={null} />
                  {Object.entries(positionsMap).map(([id, name]) => (
                    <Picker.Item key={id} label={name} value={id} />
                  ))}
                </Picker>
              </View>

              <View style={styles.pickerWrapper}>
                <MaterialCommunityIcons name="shield-outline" size={14} color="#c8102e" style={styles.pickerIcon} />
                <Picker 
                    style={styles.picker}
                    selectedValue={coalitionFilter} 
                    onValueChange={(v) => { setCoalitionFilter(v); setPositionFilter(null); }}
                >
                  <Picker.Item label="Alliances" value={null} />
                  {Object.values(coalitionMap).map((coal) => (
                    <Picker.Item key={coal.id} label={coal.name} value={coal.id} />
                  ))}
                </Picker>
              </View>

              {(search || positionFilter || coalitionFilter) && (
                <TouchableOpacity onPress={() => { setSearch(""); setPositionFilter(null); setCoalitionFilter(null); }} style={styles.clearBtn}>
                  <Ionicons name="refresh" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {isLoadingAll && !refreshing ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#c8102e" />
              <Text style={styles.loaderText}>Loading Ballot...</Text>
            </View>
          ) : (
            <View>
              {Object.entries(groupedData.byPosition).map(([positionName, list]) => (
                <View key={positionName} style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleBox}>
                        <Text style={styles.sectionTitle}>{positionName}</Text>
                        <View style={styles.countPill}><Text style={styles.countPillText}>{list.length}</Text></View>
                    </View>
                    <View style={styles.divider} />
                  </View>

                  <View style={styles.grid}>
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

              {Object.entries(groupedData.coalitions).map(([coalitionName, list]) => (
                <View key={coalitionName} style={styles.sectionContainer}>
                  <LinearGradient 
                    colors={['#fff', '#f9f9f9']} 
                    style={[styles.coalitionHero, { borderLeftColor: coalitionMap[list[0].coalition_id!]?.color }]}
                  >
                    <View style={styles.coalitionInfo}>
                      <Text style={[styles.coalitionTitle, { color: coalitionMap[list[0].coalition_id!]?.color || '#c8102e' }]}>
                        {coalitionName} Alliance
                      </Text>
                      <Text style={styles.coalitionSlogan}>{coalitionMap[list[0].coalition_id!]?.slogan}</Text>
                    </View>
                    <MaterialCommunityIcons name="shield-star" size={32} color={coalitionMap[list[0].coalition_id!]?.color || "#c8102e"} />
                  </LinearGradient>

                  <View style={styles.grid}>
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
        </View>
      </ScrollView>

      {/* --- MODAL --- */}
      <Modal visible={modalVisible} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <Animatable.View animation="slideInUp" duration={400} style={styles.modalContent}>
            {selectedCandidate && (
              <>
                <View style={styles.modalDragHandle} />
                <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.modalHero}>
                        <TouchableOpacity 
                            style={styles.modalImageWrapper} 
                            activeOpacity={0.8}
                            onPress={() => selectedCandidate.photo_url && setZoomVisible(true)}
                        >
                            {selectedCandidate.photo_url ? (
                                <Image source={{ uri: selectedCandidate.photo_url }} style={styles.modalImage} />
                            ) : (
                                <View style={[styles.modalLargeInitials, { backgroundColor: selectedCandidate.coalition_id ? coalitionMap[selectedCandidate.coalition_id].color : '#c8102e' }]}>
                                <Text style={styles.modalInitialsText}>{getInitials(selectedCandidate.name)}</Text>
                                </View>
                            )}
                            <View style={styles.verifiedBadge}>
                                <MaterialCommunityIcons name="check-decagram" size={32} color="#1DA1F2" />
                            </View>
                        </TouchableOpacity>
                        
                        <Text style={styles.modalTitle}>{selectedCandidate.name}</Text>
                        <View style={styles.modalPositionBadge}>
                            <Text style={styles.modalPositionText}>{positionsMap[selectedCandidate.position_id]}</Text>
                        </View>
                    </View>

                    <View style={styles.detailCard}>
    <Text style={styles.detailHeading}>Student Information</Text>
    {/* Changed <div> to <View> below */}
    <View style={styles.infoGrid}> 
        <View style={styles.infoItem}>
            <Ionicons name="school" size={18} color="#c8102e" />
            <View>
                <Text style={styles.infoLabel}>School/Department</Text>
                <Text style={styles.infoValue}>{selectedCandidate.school}</Text>
            </View>
        </View>
        <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={18} color="#4CD964" />
            <View>
                <Text style={styles.infoLabel}>Verification Status</Text>
                <Text style={[styles.infoValue, {color: '#4CD964'}]}>Verified & Duly Cleared</Text>
            </View>
        </View>
    </View> {/* Changed </div> to </View> here too */}
</View>

                    <View style={styles.manifestoSection}>
                        <View style={styles.manifestoHeader}>
                            <MaterialCommunityIcons name="bullhorn-variant" size={20} color="#c8102e" />
                            <Text style={styles.manifestoLabel}>MANIFESTO & VISION</Text>
                        </View>
                        <Text style={styles.manifestoText}>
                            {selectedCandidate.manifesto || selectedCandidate.bio || "This candidate has not provided a detailed manifesto for this election cycle."}
                        </Text>
                    </View>
                </ScrollView>

                <TouchableOpacity style={styles.voteNavBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.voteNavText}>Return to Candidates</Text>
                </TouchableOpacity>
              </>
            )}
          </Animatable.View>
        </View>
      </Modal>

      <Modal visible={zoomVisible} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.zoomOverlay}>
            <TouchableOpacity style={styles.zoomClose} onPress={() => setZoomVisible(false)}>
                <Ionicons name="close-circle" size={40} color="#fff" />
            </TouchableOpacity>
            {selectedCandidate?.photo_url && (
                <Animatable.Image 
                    animation="zoomIn" 
                    duration={300}
                    source={{ uri: selectedCandidate.photo_url }} 
                    style={[styles.zoomImage, { width: width * 0.9, height: width * 0.9 }]} 
                    resizeMode="contain"
                />
            )}
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

  return (
    <Animatable.View animation="fadeInUp" delay={index * 50} style={[styles.card, { width: cardWidth }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.cardInner}>
        <View style={[styles.cardAccent, { backgroundColor: coalition?.color || '#c8102e' }]} />
        
        {candidate.photo_url ? (
            <Image source={{ uri: candidate.photo_url }} style={styles.cardImage} />
        ) : (
            <View style={[styles.cardInitials, { backgroundColor: coalition?.color || '#c8102e' }]}>
            <Text style={styles.cardInitialsText}>{getInitials(candidate.name)}</Text>
            </View>
        )}

        <View style={styles.cardBody}>
            <Text style={styles.cardName} numberOfLines={1}>{candidate.name}</Text>
            <Text style={styles.cardPosition} numberOfLines={1}>{positionsMap[candidate.position_id]}</Text>
            
            {coalition ? (
                <View style={styles.coalitionTag}>
                    <Text style={[styles.coalitionTagText, { color: coalition.color }]}>{coalition.name}</Text>
                </View>
            ) : (
                <View style={styles.cardSchoolBox}>
                    <Text style={styles.cardSchool} numberOfLines={1}>🏫 {candidate.school}</Text>
                </View>
            )}
        </View>

        <View style={styles.cardFooter}>
            <Text style={styles.viewProfileText}>View Profile</Text>
            <Ionicons name="chevron-forward" size={12} color="#999" />
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  // --- REFINED HEADER STYLES ---
  safeArea: { flex: 1, backgroundColor: "#fff" },
  topHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 10, 
    backgroundColor: '#fff', 
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0' 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 45, height: 45, marginRight: 12, borderRadius: 12 },
  greetingText: { fontSize: 11, color: "#888", fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  userNameText: { fontSize: 20, fontWeight: "900", color: "#1a1a1a", letterSpacing: -0.5 },
  liveBadgeHome: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#eee' 
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CD964', marginRight: 6 },
  liveBadgeTextHome: { color: '#111', fontSize: 10, fontWeight: '800' },
  
  // --- REFINED TOAST ---
  toastContainer: { position: 'absolute', top: 50, left: 20, right: 20, zIndex: 9999, alignItems: 'center' },
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
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  toastText: { color: '#111', fontSize: 14, fontWeight: '700', marginLeft: 10 },

  // --- ORIGINAL CARD & BODY STYLES (RETAINED) ---
  scrollContent: { paddingBottom: 30 },
  mainContainer: { padding: 16, backgroundColor: '#f8f9fa' },
  searchSection: { marginBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 15, height: 50, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },
  filterRow: { flexDirection: 'row', gap: 10 },
  pickerWrapper: { flex: 1, backgroundColor: '#fff', borderRadius: 12, height: 45, justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, overflow: 'hidden' },
  picker: { width: '110%', marginLeft: 15, color: '#444' },
  pickerIcon: { position: 'absolute', left: 8, zIndex: 1 },
  clearBtn: { backgroundColor: '#333', width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  
  sectionContainer: { marginBottom: 25 },
  sectionHeader: { marginBottom: 15 },
  sectionTitleBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 5 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a1a' },
  countPill: { backgroundColor: '#c8102e15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countPillText: { fontSize: 12, fontWeight: '800', color: '#c8102e' },
  divider: { height: 3, width: 40, backgroundColor: '#c8102e', borderRadius: 2 },
  
  coalitionHero: { padding: 15, borderRadius: 16, borderLeftWidth: 5, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  coalitionInfo: { flex: 1 },
  coalitionTitle: { fontSize: 18, fontWeight: '900', textTransform: 'uppercase' },
  coalitionSlogan: { fontSize: 12, color: '#777', fontStyle: 'italic', marginTop: 2 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { borderRadius: 20, backgroundColor: '#fff', elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, marginBottom: 4 },
  cardInner: { padding: 12, alignItems: 'center' },
  cardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 40, borderTopLeftRadius: 20, borderTopRightRadius: 20, opacity: 0.1 },
  cardImage: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: '#fff', marginTop: 5 },
  cardInitials: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginTop: 5, borderWidth: 3, borderColor: '#fff' },
  cardInitialsText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  cardBody: { marginTop: 10, alignItems: 'center', width: '100%' },
  cardName: { fontSize: 14, fontWeight: '800', color: '#1a1a1a' },
  cardPosition: { fontSize: 11, color: '#c8102e', fontWeight: '700', marginTop: 2 },
  cardSchoolBox: { marginTop: 5, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#f0f0f0', borderRadius: 6 },
  cardSchool: { fontSize: 9, color: '#666', fontWeight: '600' },
  coalitionTag: { backgroundColor: '#c8102e10', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 5 },
  coalitionTagText: { fontSize: 9, fontWeight: '800' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 12, borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 8, width: '100%', justifyContent: 'center' },
  viewProfileText: { fontSize: 10, fontWeight: '700', color: '#999', marginRight: 4 },

  loaderContainer: { marginTop: 100, alignItems: 'center' },
  loaderText: { marginTop: 10, color: '#666', fontWeight: '600' },
  
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, height: '90%' },
  modalDragHandle: { width: 40, height: 5, backgroundColor: '#eee', borderRadius: 3, alignSelf: 'center', marginBottom: 15 },
  modalCloseIcon: { position: 'absolute', right: 20, top: 20, backgroundColor: '#f5f5f5', padding: 8, borderRadius: 20, zIndex: 10 },
  modalHero: { alignItems: 'center', marginBottom: 20 },
  modalImageWrapper: { position: 'relative', marginBottom: 5 },
  modalImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#fff' },
  modalLargeInitials: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
  modalInitialsText: { color: "#fff", fontSize: 42, fontWeight: "900" },
  verifiedBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#fff', borderRadius: 20, padding: 2 },
  modalTitle: { fontSize: 26, fontWeight: "900", color: "#1a1a1a", textAlign: 'center' },
  modalPositionBadge: { backgroundColor: '#1a1a1a', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, marginTop: 10 },
  modalPositionText: { color: '#fff', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  detailCard: { backgroundColor: '#f8f9fa', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  detailHeading: { fontSize: 12, fontWeight: '800', color: '#c8102e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15 },
  infoGrid: { gap: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoLabel: { fontSize: 11, color: '#999', fontWeight: '600' },
  infoValue: { fontSize: 14, color: '#333', fontWeight: '700' },
  manifestoSection: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#c8102e', elevation: 2 },
  manifestoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  manifestoLabel: { fontSize: 13, fontWeight: '900', color: '#1a1a1a', letterSpacing: 1 },
  manifestoText: { fontSize: 15, color: "#444", lineHeight: 24, fontStyle: 'italic' },
  voteNavBtn: { backgroundColor: "#c8102e", paddingVertical: 18, borderRadius: 18, alignItems: "center", marginBottom: 20 },
  voteNavText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  zoomOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  zoomImage: { borderRadius: 20 },
  zoomClose: { position: 'absolute', top: 50, right: 30, zIndex: 100 },
});