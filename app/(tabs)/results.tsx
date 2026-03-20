import React, { useMemo, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl, 
  Dimensions, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Image,
  Share,
  Modal,
  SectionList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons} from '@expo/vector-icons';
import { PieChart } from "react-native-chart-kit";
import * as Haptics from 'expo-haptics';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from "@react-native-async-storage/async-storage";

// API Hooks
import { useGetElectionResultsQuery } from '@/src/store/Apis/Voting.Api'; 
import { useGetAllElectionsQuery } from '@/src/store/Apis/Election.Api';
import { useGetAllPositionsQuery } from '@/src/store/Apis/Positions.Api';
import { useGetUsersCountQuery } from '@/src/store/Apis/User.Api';
import { 
  useGetCoalitionsByElectionQuery, 
  useGetCoalitionFullSlateQuery 
} from '@/src/store/Apis/Coalition.Api';
import { useGetExecutiveResultsQuery } from '@/src/store/Apis/Delegate.Api';

// CONSTANTS & THEME
const { width, height } = Dimensions.get('window');
const UNIVERSITY_RED = '#c8102e';
const GOLD = '#F59E0B';
const DARK_BG = '#0f172a';
const SLATE_GRAY = '#475569';
const EMERALD = '#10b981';
const AMAKERE_GOLD = '#c8102e';

// REGISTER CUSTOM ANIMATIONS - CORRECTED TRANSFORM SYNTAX
Animatable.initializeRegistryWithDefinitions({
  stretchX: {
    0: { opacity: 0, transform: [{ scaleX: 0 }, { translateX: -width / 2 }] },
    1: { opacity: 1, transform: [{ scaleX: 1 }, { translateX: 0 }] },
  },
  shimmer: {
    0: { opacity: 0.4 },
    0.5: { opacity: 1 },
    1: { opacity: 0.4 },
  },
  float: {
    0: { transform: [{ translateY: 0 }] },
    0.5: { transform: [{ translateY: -10 }] },
    1: { transform: [{ translateY: 0 }] },
  },
  pulseSlow: {
    0: { transform: [{ scale: 1 }] },
    0.5: { transform: [{ scale: 1.05 }] },
    1: { transform: [{ scale: 1 }] }
  }
});

interface ElectionResult {
  candidate_id: string;
  candidate_name: string | null;
  position_id: string;
  votes_count: string | number;
  coalition_id?: string;
  coalition_name?: string;
  coalition_color?: string;
}

// --- SKELETON LOADER ---
const SkeletonCard = () => (
    <Animatable.View animation="shimmer" iterationCount="infinite" duration={1500} style={styles.skeletonCard}>
      <View style={styles.skeletonCircle} />
      <View style={{ flex: 1, marginLeft: 15 }}>
        <View style={styles.skeletonLineShort} />
        <View style={[styles.skeletonLineShort, { width: '40%', marginTop: 8 }]} />
      </View>
      <View style={[styles.skeletonCircle, { borderRadius: 4, width: 30 }]} />
    </Animatable.View>
);

const ResultsScreen = () => {
  const route = useRoute();
  const params = (route?.params as any) || {};

  // UI STATE
  const [activeTab, setActiveTab] = useState<'main' | 'coalition' | 'analytics'>('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isSlateModalVisible, setIsSlateModalVisible] = useState(false);
  const [activeCoalition, setActiveCoalition] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem("user");
      if (userData) setUser(JSON.parse(userData));
    };
    loadUser();
  }, []);

  // DATA FETCHING
  const { data: allElections, isLoading: loadingElections } = useGetAllElectionsQuery();
  const { data: positionsData, isLoading: loadingPositions } = useGetAllPositionsQuery();
  const { data: userCountData } = useGetUsersCountQuery();

  const { resolvedId, resolvedName, electionStatus } = useMemo(() => {
    const navId = params?.electionId || params?.id;
    const elections = (allElections as any)?.elections || [];
    let target = elections.find((e: any) => (e.id || e._id) === navId);
    
    if (!target && elections.length > 0) {
      target = [...elections].sort((a, b) => 
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      )[0];
    }
    return { 
      resolvedId: target?.id || target?._id || null, 
      resolvedName: target?.name || "Election Results",
      electionStatus: target?.status || 'active'
    };
  }, [params, allElections]);

  const isCompleted = electionStatus === 'completed' || electionStatus === 'ended';

  const { data, isLoading, refetch, isFetching } = useGetElectionResultsQuery(resolvedId, {
    skip: !resolvedId,
    pollingInterval: isCompleted ? 0 : 30000, 
  });

  const { data: coalitionsData } = useGetCoalitionsByElectionQuery(resolvedId, { skip: !resolvedId });
  const { data: executiveResults } = useGetExecutiveResultsQuery(resolvedId, { skip: !resolvedId });
  
  const { data: leaderSlateData, isLoading: loadingLeaderSlate } = useGetCoalitionFullSlateQuery(
    activeCoalition?.id, 
    { skip: !activeCoalition?.id }
  );

  const processedData = useMemo(() => {
    const rawData = (data?.data || []) as ElectionResult[]; 
    const coalList = coalitionsData?.coalitions || [];
    const allPos = (positionsData?.positions || []) as any[];

    const schoolPositions = allPos.filter((p: any) => 
        p.tier?.toLowerCase() === 'school' && !p.name?.toLowerCase().includes('executive')
    );

    const enrichedData = rawData.map(candidate => {
      const matchingCoalition = coalList.find((c: any) => c.id === candidate.coalition_id);
      return {
        ...candidate,
        coalition_name: matchingCoalition?.name || "Independent",
        coalition_color: matchingCoalition?.color_code || '#475569'
      };
    });

    const total = enrichedData.reduce((acc, curr) => acc + Number(curr.votes_count), 0);
    const turnout = (total / (userCountData?.count || 1)) * 100;

    // POSITION SECTIONS FOR MAIN LIST
    const sections: { title: string, data: ElectionResult[] }[] = [];
    const positionsToProcess = selectedPositionId 
        ? schoolPositions.filter(p => p.id === selectedPositionId)
        : schoolPositions;

    positionsToProcess.forEach(pos => {
        const candidatesForPos = enrichedData
            .filter(c => c.position_id === pos.id && (c.candidate_name?.toLowerCase().includes(searchQuery.toLowerCase()) || !searchQuery))
            .sort((a, b) => Number(b.votes_count) - Number(a.votes_count));
        
        if (candidatesForPos.length > 0) {
            sections.push({ title: pos.name, data: candidatesForPos });
        }
    });

    // CANDIDATE PIE CHART DATA (BASED ON SELECTED SCHOOL)
    const currentSchool = schoolPositions.find(p => p.id === selectedPositionId) || schoolPositions[0];
    const schoolCandidateResults = enrichedData
        .filter(c => c.position_id === currentSchool?.id)
        .map((c, idx) => ({
            name: c.candidate_name?.split(' ')[0] || "Unknown",
            votes: Number(c.votes_count),
            color: [UNIVERSITY_RED, GOLD, '#3b82f6', EMERALD, '#8b5cf6'][idx % 5],
            legendFontColor: "#7F7F7F",
            legendFontSize: 12
        }));

    // STANDINGS & COALITIONS
    const standings = (executiveResults?.results || []).map((tally: any) => {
        const info = coalList.find((c: any) => c.id === tally.coalitionId);
        return {
          id: tally.coalitionId,
          name: info?.name || "Independent",
          acronym: info?.acronym || "IND",
          votes: Number(tally.voteCount),
          color: info?.color_code || UNIVERSITY_RED
        };
      }).sort((a: any, b: any) => b.votes - a.votes);

    const coalPie = standings.map((s) => ({
        name: s.acronym,
        votes: s.votes,
        color: s.color,
        legendFontColor: "#64748b",
        legendFontSize: 11
    }));

    return { 
      sections, 
      totalVotes: total, 
      turnoutPercentage: turnout, 
      coalitionStanding: standings,
      coalitionPie: coalPie,
      schoolPositions,
      leadingCoalition: standings.length > 0 ? standings[0] : null,
      schoolCandidatePie: schoolCandidateResults,
      activeSchoolName: currentSchool?.name || "General Schools"
    };
  }, [data, selectedPositionId, searchQuery, userCountData, coalitionsData, executiveResults, positionsData]);

  useEffect(() => {
    if (activeTab === 'coalition' && processedData.leadingCoalition) {
        setActiveCoalition(processedData.leadingCoalition);
    }
  }, [activeTab, processedData.leadingCoalition]);

  const handleShareResults = async () => {
    await Share.share({
      message: `📊 ${resolvedName} Update:\nTotal Votes: ${processedData.totalVotes.toLocaleString()}\nTurnout: ${processedData.turnoutPercentage.toFixed(1)}%`,
    });
  };

  // --- RENDERING HELPERS ---

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
        {(['main', 'coalition', 'analytics'] as const).map((tab) => (
            <TouchableOpacity 
                key={tab}
                onPress={() => { setActiveTab(tab); Haptics.selectionAsync(); }}
                style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            >
                <MaterialCommunityIcons 
                    name={tab === 'main' ? 'view-list' : tab === 'coalition' ? 'shield-crown' : 'chart-arc'} 
                    size={18} 
                    color={activeTab === tab ? UNIVERSITY_RED : '#94A3B8'} 
                />
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                    {tab === 'main' ? 'Live Tally' : tab === 'coalition' ? 'Coalition' : 'Analytics'}
                </Text>
            </TouchableOpacity>
        ))}
    </View>
  );

  const renderGeneralHeader = () => (
    <View style={styles.headerWrapper}>
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Image source={require('@/assets/images/Laikipia-logo.png')} style={styles.logo} />
          <View>
            <Text style={styles.userNameText}>{user?.name || "Voter"}</Text>
            <Text style={styles.greetingText}>Laikipia University Node</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleShareResults} style={styles.shareBtn}>
            <Ionicons name="share-outline" size={20} color="#111" />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
        {renderTabBar()}

        <Animatable.View animation="fadeInDown" style={styles.electionInfoCard}>
            <View style={styles.cardHeaderRow}>
               <Text style={styles.electionTitle}>{resolvedName}</Text>
               <MaterialCommunityIcons name="cube-send" size={24} color={EMERALD} />
            </View>
            <View style={styles.liveIndicatorRow}>
                <View style={[styles.pulseDot, isCompleted && { backgroundColor: EMERALD }]} />
                <Text style={[styles.liveText, isCompleted && { color: EMERALD }]}>
                    {isCompleted ? 'IMMUTABLE RECORD' : 'REAL-TIME MINING'}
                </Text>
            </View>
            <View style={styles.participationTracker}>
                <View style={styles.trackerHeader}>
                    <Text style={styles.trackerLabel}>University Turnout</Text>
                    <Text style={styles.trackerValue}>{processedData.turnoutPercentage.toFixed(1)}%</Text>
                </View>
                <View style={styles.progressBackground}>
                    <Animatable.View animation="fadeInLeft" style={[styles.progressFill, { width: `${processedData.turnoutPercentage}%` }]} />
                </View>
                <Text style={styles.totalVotesText}>{processedData.totalVotes.toLocaleString()} votes processed</Text>
            </View>
        </Animatable.View>

        <View style={styles.coalitionSection}>
            <View style={styles.sectionHeaderCompact}>
               <Text style={styles.sectionTitle}>Coalition Race</Text>
               <Text style={styles.helperText}>Live Ranking</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coalitionScroll}>
                {processedData.coalitionStanding.map((coal, idx) => (
                    <TouchableOpacity 
                        key={coal.id} 
                        onPress={() => { setActiveCoalition(coal); setIsSlateModalVisible(true); }}
                        style={[styles.detailedCoalCard, { backgroundColor: coal.color }]}
                    >
                        <View style={styles.coalCardHeader}>
                           <Text style={styles.coalAcronym}>{coal.acronym}</Text>
                           {idx === 0 && <MaterialCommunityIcons name="crown" size={18} color={GOLD} />}
                        </View>
                        <View>
                            <Text style={styles.coalVoteVal}>{coal.votes.toLocaleString()}</Text>
                            <Text style={styles.coalVoteLbl}>AGGREGATE VOTES</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Filter School Context</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                <TouchableOpacity onPress={() => setSelectedPositionId(null)} style={[styles.chip, !selectedPositionId && styles.activeChip]}>
                    <Text style={[styles.chipText, !selectedPositionId && styles.activeChipText]}>All Schools</Text>
                </TouchableOpacity>
                {processedData.schoolPositions.map((pos: any) => (
                    <TouchableOpacity key={pos.id} onPress={() => setSelectedPositionId(pos.id)} style={[styles.chip, selectedPositionId === pos.id && styles.activeChip]}>
                        <Text style={[styles.chipText, selectedPositionId === pos.id && styles.activeChipText]}>{pos.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color="#94A3B8" />
            <TextInput placeholder="Filter by candidate name..." placeholderTextColor="#94A3B8" style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} />
        </View>
      </View>
    </View>
  );

  const renderCoalitionLeaderTab = () => {
    const leader = processedData.leadingCoalition;
    if (!leader) return (
      <View style={styles.emptyContainer}>
         <ActivityIndicator color={UNIVERSITY_RED} />
         <Text style={styles.emptyText}>Syncing Ledger...</Text>
      </View>
    );

    return (
        <ScrollView style={styles.leaderTabContainer} showsVerticalScrollIndicator={false}>
            <Animatable.View animation="pulseSlow" iterationCount="infinite" style={[styles.bigWinnerCard, { backgroundColor: leader.color }]}>
                <MaterialCommunityIcons name="shield-star-outline" size={140} color="rgba(255,255,255,0.15)" style={styles.bgIcon} />
                <View style={styles.winnerBadgeLarge}>
                    <MaterialCommunityIcons name="crown" size={16} color={AMAKERE_GOLD} style={{marginRight: 8}} />
                    <Text style={styles.winnerBadgeTextLarge}>{leader.name} Coalition Leaders</Text>
                </View>
                <Text style={styles.winnerCoalName}>{leader.name}</Text>
                <View style={styles.winnerStatsRow}>
                    <View>
                        <Text style={styles.winnerStatVal}>{leader.votes.toLocaleString()}</Text>
                        <Text style={styles.winnerStatLbl}>TOTAL TALLY</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View>
                        <Text style={styles.winnerStatVal}>{((leader.votes / (processedData.totalVotes || 1)) * 100).toFixed(1)}%</Text>
                        <Text style={styles.winnerStatLbl}>LEAD MARGIN</Text>
                    </View>
                </View>
            </Animatable.View>

            <View style={styles.slateContainer}>
                <View style={styles.slateHeader}>
                    <View>
                        <Text style={styles.slateTitle}>Active Slate</Text>
                        <Text style={styles.slateSubtitle}>Members of {leader.acronym} platform</Text>
                    </View>
                    <View style={styles.countBadge}><Text style={styles.slateCount}>{leaderSlateData?.coalition?.candidates?.length || 0}</Text></View>
                </View>

                {loadingLeaderSlate ? (
                    <ActivityIndicator color={UNIVERSITY_RED} style={{ marginTop: 20 }} />
                ) : (
                    leaderSlateData?.coalition?.candidates.map((cand: any, i: number) => (
                        <Animatable.View key={cand.id} animation="fadeInLeft" delay={i * 80} style={styles.slateItem}>
                            <View style={[styles.slateDot, { backgroundColor: leader.color }]} />
                            <View style={styles.slateInfo}>
                                <Text style={styles.slateNameText}>{cand.name}</Text>
                                <Text style={styles.slatePosText}>{cand.position.name}</Text>
                            </View>
                            <MaterialCommunityIcons name="check-circle" size={20} color={EMERALD} />
                        </Animatable.View>
                    ))
                )}
            </View>
            <View style={{height: 100}} />
        </ScrollView>
    );
  };

  const renderAnalyticsTab = () => (
      <ScrollView style={styles.analyticsContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Executive Coalition Split</Text>
          <View style={styles.chartCard}>
                <PieChart
                    data={processedData.coalitionPie}
                    width={width - 80}
                    height={220}
                    chartConfig={{ color: (opacity = 1) => `rgba(0,0,0, ${opacity})` }}
                    accessor={"votes"}
                    backgroundColor={"transparent"}
                    paddingLeft={"15"}
                    absolute
                />
          </View>

          <View style={styles.schoolHeaderRow}>
            <Text style={styles.sectionTitle}>{processedData.activeSchoolName}</Text>
            <Text style={styles.helperText}>Candidate Split</Text>
          </View>
          
          <View style={styles.chartCard}>
                <PieChart
                    data={processedData.schoolCandidatePie}
                    width={width - 80}
                    height={220}
                    chartConfig={{ color: (opacity = 1) => `rgba(0,0,0, ${opacity})` }}
                    accessor={"votes"}
                    backgroundColor={"transparent"}
                    paddingLeft={"15"}
                    absolute
                />
          </View>

          <View style={styles.metricsGrid}>
                <View style={[styles.metricItem, { borderLeftColor: UNIVERSITY_RED }]}>
                    <Text style={styles.metricLabel}>Total Reach</Text>
                    <Text style={styles.metricValue}>{processedData.totalVotes.toLocaleString()}</Text>
                </View>
                <View style={[styles.metricItem, { borderLeftColor: GOLD }]}>
                    <Text style={styles.metricLabel}>Active Schools</Text>
                    <Text style={styles.metricValue}>{processedData.schoolPositions.length}</Text>
                </View>
          </View>

          <View style={styles.blockchainInfo}>
             <MaterialCommunityIcons name="security" size={24} color="#fff" />
             <Text style={styles.blockchainText}>Data fetched via Laikipia E-Vote decentralized validator network. Zero centralized manipulation.</Text>
          </View>
          <View style={{height: 100}} />
      </ScrollView>
  );

  const renderCandidate = ({ item, index }: { item: ElectionResult, index: number }) => {
    const isWinner = index === 0 && !searchQuery;
    const percentage = processedData.totalVotes > 0 ? (Number(item.votes_count) / processedData.totalVotes) * 100 : 0;

    return (
      <Animatable.View animation="fadeInUp" delay={index * 50} style={[styles.candCard, isWinner && styles.winnerCard]}>
        <View style={styles.candTop}>
            <View style={[styles.rankBadge, isWinner && { backgroundColor: '#FEF3C7' }]}>
                {isWinner ? <MaterialCommunityIcons name="trophy" size={18} color={GOLD} /> : <Text style={styles.rankText}>{index + 1}</Text>}
            </View>
            <View style={styles.candInfo}>
                <Text style={styles.candName} numberOfLines={1}>{item.candidate_name}</Text>
                <Text style={styles.candPosition}>{item.coalition_name}</Text>
            </View>
            <View style={styles.voteBox}>
                <Text style={[styles.voteCount, isWinner && { color: GOLD }]}>{Number(item.votes_count).toLocaleString()}</Text>
                <Text style={styles.votePercent}>{percentage.toFixed(1)}%</Text>
            </View>
        </View>
        <View style={styles.progressTrack}>
           <Animatable.View animation="stretchX" duration={1200} style={[styles.progressFillCand, { width: `${percentage}%`, backgroundColor: isWinner ? GOLD : UNIVERSITY_RED }]} />
        </View>
      </Animatable.View>
    );
  };

  // --- MAIN RENDER ---

  if (loadingElections || isLoading || loadingPositions) {
    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <View style={[styles.skeletonCard, { height: 160, borderRadius: 24, marginBottom: 30 }]} />
                {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
            </View>
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      
      {activeTab === 'main' ? (
          <SectionList
            sections={processedData.sections}
            ListHeaderComponent={renderGeneralHeader}
            keyExtractor={(item) => item.candidate_id}
            renderItem={renderCandidate}
            renderSectionHeader={({ section: { title } }) => (
                <View style={styles.sectionHeaderContainer}>
                    <View style={styles.sectionHeaderLine} />
                    <Text style={styles.sectionHeaderText}>{title.toUpperCase()}</Text>
                </View>
            )}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={{ paddingBottom: 60 }}
            refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={UNIVERSITY_RED} />}
          />
      ) : (
          <View style={{ flex: 1 }}>
              <View style={styles.topHeader}>
                <TouchableOpacity onPress={() => setActiveTab('main')}>
                    <Ionicons name="arrow-back" size={24} color="#111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{activeTab === 'coalition' ? 'Coalition Dashboard' : 'School Analytics'}</Text>
                <View style={{ width: 24 }} />
              </View>
              {activeTab === 'coalition' ? renderCoalitionLeaderTab() : renderAnalyticsTab()}
          </View>
      )}

      {/* SLATE MODAL */}
      <Modal visible={isSlateModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Animatable.View animation="slideInUp" duration={450} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalSubtitle}>DETAILED PLATFORM SLATE</Text>
                <Text style={[styles.modalTitle, { color: activeCoalition?.color }]}>{activeCoalition?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsSlateModalVisible(false)}><Ionicons name="close-circle" size={32} color="#111" /></TouchableOpacity>
            </View>
            <FlatList
                data={leaderSlateData?.coalition?.candidates || []}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <View style={styles.slateRow}>
                        <View style={styles.slateMain}>
                           <Text style={styles.slateName}>{item.name}</Text>
                           <Text style={styles.slatePosText}>{item.position.name}</Text>
                        </View>
                        <MaterialCommunityIcons name="badge-account-horizontal-outline" size={24} color="#E2E8F0" />
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 40 }}
            />
          </Animatable.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  headerWrapper: { backgroundColor: "#fff" },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#1E293B' },
  logo: { width: 42, height: 42, marginRight: 15, borderRadius: 12 },
  userNameText: { fontSize: 16, fontWeight: "900", color: "#111" },
  greetingText: { fontSize: 10, color: "#9CA3AF", fontWeight: '800', textTransform: 'uppercase' },
  shareBtn: { padding: 8, backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  container: { padding: 20 },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', padding: 5, borderRadius: 18, marginBottom: 20 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 15, flexDirection: 'row', justifyContent: 'center' },
  activeTabButton: { backgroundColor: '#fff', elevation: 4, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 5 },
  tabText: { fontSize: 11, fontWeight: '800', color: '#64748B', marginLeft: 8 },
  activeTabText: { color: UNIVERSITY_RED },

  electionInfoCard: { backgroundColor: UNIVERSITY_RED, borderRadius: 30, padding: 25, marginBottom: 25, elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  electionTitle: { fontSize: 22,fontStyle:'italic', fontWeight: '900', color: '#fff', marginBottom: 10, flex: 1, lineHeight: 28 },
  liveIndicatorRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start' },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'white', marginRight: 10 },
  liveText: { fontSize: 10, fontWeight: '900', color: 'white', letterSpacing: 1.2 },
  participationTracker: { marginTop: 22 },
  trackerHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  trackerLabel: { fontSize: 12, fontWeight: '800', color: '#fff' },
  trackerValue: { fontSize: 26, fontWeight: '900', color: '#fff' },
  progressBackground: { height: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: "white" },
  totalVotesText: { color: '#fff', fontSize: 12, marginTop: 12, fontWeight: '700' },

  coalitionSection: { marginBottom: 30 },
  sectionHeaderCompact: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: "#1E293B" },
  schoolHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  helperText: { fontSize: 10, color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase' },
  coalitionScroll: { paddingBottom: 10 },
  detailedCoalCard: { width: 155, height: 135, borderRadius: 26, padding: 20, marginRight: 15, justifyContent: 'space-between', elevation: 5, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 7 },
  coalCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  coalAcronym: { color: '#fff', fontSize: 22, fontWeight: '900' },
  coalVoteVal: { color: '#fff', fontSize: 24, fontWeight: '900' },
  coalVoteLbl: { color: 'rgba(255,255,255,0.75)', fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },

  filterSection: { marginBottom: 20 },
  chipScroll: { paddingVertical: 10 },
  chip: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 16, backgroundColor: '#fff', marginRight: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  activeChip: { backgroundColor: '#1E293B', borderColor: '#1E293B' },
  chipText: { fontSize: 12, fontWeight: '800', color: '#64748B' },
  activeChipText: { color: '#fff' },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 18, paddingHorizontal: 18, height: 56, marginTop: 12, marginBottom: 15, borderWidth: 1, borderColor: '#F1F5F9' },
  searchInput: { flex: 1, marginLeft: 15, fontSize: 14, color: '#1E293B', fontWeight: '700' },

  sectionHeaderContainer: { paddingHorizontal: 20, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' },
  sectionHeaderLine: { width: 6, height: 22, backgroundColor: UNIVERSITY_RED, borderRadius: 4, marginRight: 15 },
  sectionHeaderText: { fontSize: 15, fontWeight: '900', color: '#1E293B', letterSpacing: 1 },

  candCard: { backgroundColor: '#fff', borderRadius: 26, padding: 22, marginBottom: 15, marginHorizontal: 20, borderWidth: 1.5, borderColor: '#F1F5F9', elevation: 2 },
  winnerCard: { borderColor: AMAKERE_GOLD, backgroundColor: '#FFFEF2', elevation: 4 },
  candTop: { flexDirection: 'row', alignItems: 'center' },
  rankBadge: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 18 },
  rankText: { fontSize: 13, fontWeight: '900', color: '#94A3B8' },
  candInfo: { flex: 1 },
  candName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  candPosition: { fontSize: 11, color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', marginTop: 4 },
  voteBox: { alignItems: 'flex-end' },
  voteCount: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  votePercent: { fontSize: 11, color: '#94A3B8', fontWeight: '700' },
  progressTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, marginTop: 18, overflow: 'hidden' },
  progressFillCand: { height: '100%' },

  leaderTabContainer: { flex: 1, padding: 20 },
  bigWinnerCard: { height: 300, borderRadius: 40, padding: 35, justifyContent: 'center', overflow: 'hidden', marginBottom: 30, elevation: 15, shadowColor: '#000', shadowRadius: 20, shadowOpacity: 0.45 },
  bgIcon: { position: 'absolute', right: -40, bottom: -40 },
  winnerBadgeLarge: { backgroundColor: 'rgba(255,255,255,0.28)', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, alignSelf: 'flex-start', marginBottom: 25, flexDirection: 'row', alignItems: 'center' },
  winnerBadgeTextLarge: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  winnerCoalName: { color: '#fff', fontSize: 38, fontWeight: '900', marginBottom: 30, lineHeight: 44 },
  winnerStatsRow: { flexDirection: 'row', alignItems: 'center' },
  winnerStatVal: { color: '#fff', fontSize: 28, fontWeight: '900' },
  winnerStatLbl: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  statDivider: { width: 1.5, height: 45, backgroundColor: 'rgba(255,255,255,0.35)', marginHorizontal: 35 },
  
  slateContainer: { backgroundColor: '#F8FAFC', borderRadius: 30, padding: 25, marginBottom: 35 },
  slateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  slateTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  slateSubtitle: { fontSize: 12, color: '#94A3B8', fontWeight: '700' },
  countBadge: { backgroundColor: '#1E293B', width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  slateCount: { color: '#fff', fontSize: 14, fontWeight: '900' },
  slateItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 14, borderWidth: 1, borderColor: '#F1F5F9', elevation: 3 },
  slateDot: { width: 12, height: 12, borderRadius: 6, marginRight: 20 },
  slateInfo: { flex: 1 },
  slateNameText: { fontWeight: '800', fontSize: 16, color: '#1E293B' },
  slatePosText: { fontSize: 12, color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', marginTop: 5 },

  analyticsContainer: { flex: 1, padding: 20 },
  chartCard: { backgroundColor: '#fff', borderRadius: 32, padding: 25, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 35, alignItems: 'center', elevation: 4 },
  metricsGrid: { flexDirection: 'row', gap: 20, marginBottom: 35 },
  metricItem: { flex: 1, backgroundColor: '#fff', padding: 25, borderRadius: 26, borderWidth: 1, borderColor: '#F1F5F9', borderLeftWidth: 8 },
  metricLabel: { fontSize: 12, fontWeight: '800', color: '#64748B', textTransform: 'uppercase' },
  metricValue: { fontSize: 26, fontWeight: '900', color: '#1E293B', marginTop: 10 },
  blockchainInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: DARK_BG, padding: 25, borderRadius: 24, elevation: 5 },
  blockchainText: { flex: 1, marginLeft: 18, fontSize: 13, color: '#CBD5E1', fontWeight: '700', lineHeight: 20 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 140 },
  emptyText: { marginTop: 25, color: '#94A3B8', fontWeight: '800', fontSize: 18 },

  skeletonCard: { height: 95, backgroundColor: '#F8FAFC', borderRadius: 26, marginBottom: 18, flexDirection: 'row', alignItems: 'center', padding: 22 },
  skeletonCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E2E8F0' },
  skeletonLineShort: { width: '60%', height: 16, backgroundColor: '#E2E8F0', borderRadius: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 45, borderTopRightRadius: 45, padding: 35, maxHeight: height * 0.85 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 35 },
  modalSubtitle: { fontSize: 12, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.2 },
  modalTitle: { fontSize: 28, fontWeight: '900', marginTop: 8 },
  slateRow: { paddingVertical: 22, borderBottomWidth: 1.5, borderBottomColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center' },
  slateMain: { flex: 1 },
  slateName: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
});

export default ResultsScreen;