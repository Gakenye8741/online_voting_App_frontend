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
const EMERALD = '#10b981';
const AMAKERE_GOLD = '#c8102e';

// REGISTER CUSTOM ANIMATIONS
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
  pulseSlow: {
    0: { transform: [{ scale: 1 }] },
    0.5: { transform: [{ scale: 1.05 }] },
    1: { transform: [{ scale: 1 }] }
  }
});

interface Candidate {
  candidate_id: string;
  candidate_name: string | null;
  position_id: string;
  votes_count: string | number;
  coalition_id?: string;
  coalition_name?: string;
  coalition_color?: string;
  total_pos_votes?: number; 
}

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

  // YOUR REQUESTED SYNTAX & STATE
  const [search, setSearch] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [positionsMap, setPositionsMap] = useState<Record<string, string>>({});

  const [activeTab, setActiveTab] = useState<'main' | 'coalition' | 'analytics'>('main');
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

  const { data: allElections, isLoading: loadingElections } = useGetAllElectionsQuery();
  const { data: positionsData, isLoading: loadingPositions } = useGetAllPositionsQuery();
  const { data: userCountData } = useGetUsersCountQuery();

  // Populate positionsMap
  useEffect(() => {
    if (positionsData?.positions) {
      const map: Record<string, string> = {};
      positionsData.positions.forEach((p: any) => { map[p.id] = p.name; });
      setPositionsMap(map);
    }
  }, [positionsData]);

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
    pollingInterval: isCompleted ? 0 : 15000, 
  });

  const { data: coalitionsData } = useGetCoalitionsByElectionQuery(resolvedId, { skip: !resolvedId });
  const { data: executiveResults } = useGetExecutiveResultsQuery(resolvedId, { skip: !resolvedId });
  
  const { data: leaderSlateData, isLoading: loadingLeaderSlate } = useGetCoalitionFullSlateQuery(
    activeCoalition?.id, 
    { skip: !activeCoalition?.id }
  );

  const processedData = useMemo(() => {
    const rawData = (data?.data || []) as Candidate[]; 
    const coalList = (coalitionsData?.coalitions || []) as any[];
    const allPos = (positionsData?.positions || []) as any[];
    const q = search.toLowerCase().trim();

    const enrichedData = rawData.map(candidate => {
      const matchingCoalition = coalList.find((c: any) => c.id === candidate.coalition_id);
      return {
        ...candidate,
        coalition_name: matchingCoalition?.name || "Independent",
        coalition_color: matchingCoalition?.color_code || '#475569'
      };
    });

    const totalVotesInElection = enrichedData.reduce((acc, curr) => acc + Number(curr.votes_count || 0), 0);
    const turnout = (totalVotesInElection / (Number(userCountData?.count) || 1)) * 100;

    const sections: { title: string, data: Candidate[] }[] = [];
    const allPositionCharts: any[] = [];

    allPos.forEach(pos => {
        // Search logic for Candidate Name OR Position Name
        const matchesPosition = pos.name.toLowerCase().includes(q);
        
        const candidatesForPos = enrichedData
            .filter(c => {
               const matchesCandidate = (c.candidate_name || "").toLowerCase().includes(q);
               return c.position_id === pos.id && (matchesCandidate || matchesPosition || q === '');
            })
            .sort((a, b) => Number(b.votes_count) - Number(a.votes_count));
        
        if (candidatesForPos.length > 0) {
            const totalPosVotes = candidatesForPos.reduce((s, curr) => s + Number(curr.votes_count), 0);
            sections.push({ 
                title: pos.name, 
                data: candidatesForPos.map(c => ({ ...c, total_pos_votes: totalPosVotes })) 
            });

            allPositionCharts.push({
                title: pos.name,
                totalVotes: totalPosVotes,
                chartData: candidatesForPos.map((c, idx) => ({
                    name: (c.candidate_name || "Unknown").split(' ')[0],
                    votes: Number(c.votes_count),
                    color: [UNIVERSITY_RED, GOLD, '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'][idx % 6],
                    legendFontColor: "#64748b",
                    legendFontSize: 10
                }))
            });
        }
    });

    const executiveResultsList = (executiveResults?.results || []) as any[];
    const totalExecutiveVotes = executiveResultsList.reduce((acc, curr) => acc + Number(curr.voteCount || 0), 0);
    const resultsMap = new Map(executiveResultsList.map((r: any) => [r.coalitionId, Number(r.voteCount || 0)]));
    
    const standings = coalList.map((info) => {
        const votes = resultsMap.get(info.id) || 0;
        return {
          id: info.id,
          name: info.name,
          acronym: info.acronym,
          votes: votes,
          color: info.color_code || UNIVERSITY_RED,
          percentage: totalExecutiveVotes > 0 ? (votes / totalExecutiveVotes) * 100 : 0
        };
      }).sort((a, b) => b.votes - a.votes);

    return { 
      sections, 
      totalVotes: totalVotesInElection, 
      turnoutPercentage: turnout, 
      coalitionStanding: standings,
      coalitionPie: standings.filter(s => s.votes > 0).map(s => ({ name: s.acronym, votes: s.votes, color: s.color, legendFontColor: "#64748b", legendFontSize: 11 })),
      allPositionCharts, 
      leadingCoalition: standings.length > 0 ? standings[0] : null,
      hasResults: sections.length > 0
    };
  }, [data, search, userCountData, coalitionsData, executiveResults, positionsData]);

  const handleShareResults = async () => {
    await Share.share({
      message: `📊 ${resolvedName} Update:\nTotal Votes: ${processedData.totalVotes.toLocaleString()}\nTurnout: ${processedData.turnoutPercentage.toFixed(1)}%`,
    });
  };

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

  const renderEmptySearch = () => (
    <Animatable.View animation="fadeIn" style={styles.noResultsContainer}>
        <MaterialCommunityIcons name="account-search-outline" size={70} color="#CBD5E1" />
        <Text style={styles.noResultsTitle}>No Match Found</Text>
        <Text style={styles.noResultsText}>
            We couldn't find any candidate or position matching "{search}".
        </Text>
    </Animatable.View>
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
                    <Animatable.View 
                        animation="fadeInLeft" 
                        key={processedData.turnoutPercentage} 
                        style={[styles.progressFill, { width: `${processedData.turnoutPercentage}%` }]} 
                    />
                </View>
                <Text style={styles.totalVotesText}>{processedData.totalVotes.toLocaleString()} votes processed</Text>
            </View>
        </Animatable.View>

        {activeTab === 'main' && (
          <Animatable.View animation="fadeIn">
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
                               {idx === 0 && coal.votes > 0 && <MaterialCommunityIcons name="crown" size={18} color={GOLD} />}
                            </View>
                            <View>
                                <Text style={styles.coalVoteVal}>{coal.votes.toLocaleString()}</Text>
                                <Text style={styles.coalVoteLbl}>{coal.percentage.toFixed(1)}% OF TOTAL</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.filtersWrapper}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={16} color="#999" />
                <TextInput 
                  style={styles.searchBarInput} 
                  placeholder="Quick search candidates or positions..." 
                  value={search} 
                  onChangeText={setSearch} 
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch("")}>
                        <Ionicons name="close-circle" size={18} color="#999" />
                    </TouchableOpacity>
                )}
              </View>
            </View>
          </Animatable.View>
        )}

        {activeTab === 'coalition' && renderCoalitionLeaderTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </View>
    </View>
  );

  const renderCoalitionLeaderTab = () => {
    const leader = processedData.leadingCoalition;
    if (!leader) return null;

    return (
        <View style={styles.leaderTabContainer}>
            <Animatable.View animation="pulseSlow" iterationCount="infinite" style={[styles.bigWinnerCard, { backgroundColor: leader.color }]}>
                <MaterialCommunityIcons name="shield-star-outline" size={140} color="rgba(255,255,255,0.15)" style={styles.bgIcon} />
                <View style={styles.winnerBadgeLarge}>
                    <MaterialCommunityIcons name="crown" size={16} color={GOLD} style={{marginRight: 8}} />
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
                        <Text style={styles.winnerStatVal}>{leader.percentage.toFixed(1)}%</Text>
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
        </View>
    );
  };

  const renderAnalyticsTab = () => (
      <View style={styles.analyticsContainer}>
          <Text style={styles.sectionTitle}>Executive Coalition Split</Text>
          <View style={styles.chartCard}>
                <PieChart
                    data={processedData.coalitionPie}
                    width={width - 80}
                    height={180}
                    chartConfig={{ color: (opacity = 1) => `rgba(0,0,0, ${opacity})` }}
                    accessor={"votes"}
                    backgroundColor={"transparent"}
                    paddingLeft={"15"}
                    absolute
                />
          </View>
          {processedData.allPositionCharts.map((posChart, idx) => (
            <Animatable.View key={posChart.title} animation="fadeInUp" delay={idx * 100} style={styles.posAnalyticsCard}>
                <View style={styles.schoolHeaderRow}>
                    <Text style={styles.posAnalyticsTitle}>{posChart.title}</Text>
                    <View style={styles.votesBadge}><Text style={styles.votesBadgeText}>{posChart.totalVotes.toLocaleString()} Total</Text></View>
                </View>
                <PieChart
                    data={posChart.chartData}
                    width={width - 80}
                    height={160}
                    chartConfig={{ color: (opacity = 1) => `rgba(0,0,0, ${opacity})` }}
                    accessor={"votes"}
                    backgroundColor={"transparent"}
                    paddingLeft={"15"}
                    absolute
                />
            </Animatable.View>
          ))}
      </View>
  );

  const renderCandidate = ({ item, index }: { item: Candidate, index: number }) => {
    const isWinner = index === 0 && search === '';
    const positionTotal = item.total_pos_votes || 1;
    const percentage = (Number(item.votes_count) / positionTotal) * 100;

    return (
      <Animatable.View animation="fadeInUp" delay={index * 50} style={[styles.candCard, isWinner && styles.winnerCard]}>
        <TouchableOpacity 
          onPress={() => {
              setSelectedCandidate(item);
              setModalVisible(true);
          }}
          activeOpacity={0.7}
        >
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
              <Animatable.View 
                  animation="stretchX" 
                  duration={1200} 
                  key={percentage} 
                  style={[styles.progressFillCand, { width: `${percentage}%`, backgroundColor: isWinner ? GOLD : UNIVERSITY_RED }]} 
              />
          </View>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  if (loadingElections || isLoading || loadingPositions) {
    return (
        <SafeAreaView style={styles.safe}>
            <View style={{ padding: 20 }}>
                <View style={[styles.skeletonCard, { height: 160, borderRadius: 24, marginBottom: 30 }]} />
                {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
            </View>
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <SectionList
        sections={activeTab === 'main' ? processedData.sections : []}
        ListHeaderComponent={renderGeneralHeader}
        ListEmptyComponent={search !== '' ? renderEmptySearch : null}
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

      {/* DETAILED CANDIDATE MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
              <View style={styles.modalContentSmall}>
                  <MaterialCommunityIcons name="account-details" size={50} color={UNIVERSITY_RED} />
                  <Text style={styles.modalTitleSmall}>{selectedCandidate?.candidate_name}</Text>
                  <Text style={styles.modalSubtitleSmall}>{selectedCandidate?.coalition_name}</Text>
                  <View style={styles.modalStatsRow}>
                      <View style={styles.modalStatItem}>
                        <Text style={styles.modalStatVal}>{Number(selectedCandidate?.votes_count).toLocaleString()}</Text>
                        <Text style={styles.modalStatLbl}>VOTES</Text>
                      </View>
                      <View style={styles.modalStatItem}>
                        <Text style={styles.modalStatVal}>
                          {((Number(selectedCandidate?.votes_count) / (selectedCandidate?.total_pos_votes || 1)) * 100).toFixed(1)}%
                        </Text>
                        <Text style={styles.modalStatLbl}>SHARE</Text>
                      </View>
                  </View>
                  <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                      <Text style={styles.closeBtnText}>DISMISS</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

      {/* COALITION SLATE MODAL */}
      <Modal visible={isSlateModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Animatable.View animation="slideInUp" duration={450} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalSubtitle}>PLATFORM SLATE</Text>
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
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  headerWrapper: { backgroundColor: '#f8fafc', paddingBottom: 10 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 45, height: 45, borderRadius: 12, marginRight: 12 },
  userNameText: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  greetingText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  shareBtn: { padding: 10, backgroundColor: '#fff', borderRadius: 12, elevation: 1 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 16, padding: 4, marginBottom: 20 },
  tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12 },
  activeTabButton: { backgroundColor: '#fff', elevation: 2 },
  tabText: { marginLeft: 6, fontSize: 12, fontWeight: '700', color: '#94A3B8' },
  activeTabText: { color: UNIVERSITY_RED },
  electionInfoCard: { backgroundColor: '#fff', padding: 20, borderRadius: 24, elevation: 2, marginBottom: 15 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  electionTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', flex: 1 },
  liveIndicatorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: UNIVERSITY_RED, marginRight: 6 },
  liveText: { fontSize: 10, fontWeight: '800', color: UNIVERSITY_RED, letterSpacing: 0.5 },
  participationTracker: { marginTop: 15 },
  trackerHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  trackerLabel: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  trackerValue: { fontSize: 14, fontWeight: '900', color: UNIVERSITY_RED },
  progressBackground: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: UNIVERSITY_RED },
  totalVotesText: { fontSize: 10, color: '#94A3B8', marginTop: 8, textAlign: 'right', fontWeight: '600' },
  coalitionSection: { marginBottom: 20 },
  sectionHeaderCompact: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: '#1E293B' },
  helperText: { fontSize: 11, color: '#94A3B8', fontWeight: '700' },
  coalitionScroll: { paddingLeft: 0 },
  detailedCoalCard: { width: 140, padding: 15, borderRadius: 20, marginRight: 12, elevation: 3 },
  coalCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  coalAcronym: { fontSize: 16, fontWeight: '900', color: '#fff' },
  coalVoteVal: { fontSize: 18, fontWeight: '900', color: '#fff' },
  coalVoteLbl: { fontSize: 8, fontWeight: '800', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  filtersWrapper: { marginBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, height: 50, borderRadius: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  searchBarInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1E293B', fontWeight: '600' },
  sectionHeaderContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  sectionHeaderLine: { width: 4, height: 18, backgroundColor: UNIVERSITY_RED, borderRadius: 2, marginRight: 10 },
  sectionHeaderText: { fontSize: 13, fontWeight: '900', color: '#64748B', letterSpacing: 1 },
  candCard: { backgroundColor: '#fff', marginHorizontal: 20, padding: 18, borderRadius: 22, marginBottom: 12, elevation: 1 },
  winnerCard: { borderWidth: 1.5, borderColor: '#FEF3C7', backgroundColor: '#FFFDF5' },
  candTop: { flexDirection: 'row', alignItems: 'center' },
  rankBadge: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rankText: { fontSize: 14, fontWeight: '800', color: '#64748B' },
  candInfo: { flex: 1 },
  candName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  candPosition: { fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 2 },
  voteBox: { alignItems: 'flex-end' },
  voteCount: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  votePercent: { fontSize: 12, fontWeight: '700', color: EMERALD },
  progressTrack: { height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, marginTop: 12, overflow: 'hidden' },
  progressFillCand: { height: '100%', borderRadius: 2 },
  noResultsContainer: { padding: 60, alignItems: 'center' },
  noResultsTitle: { fontSize: 18, fontWeight: '800', color: '#475569', marginTop: 15 },
  noResultsText: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 8 },
  leaderTabContainer: { paddingVertical: 10 },
  bigWinnerCard: { padding: 30, borderRadius: 32, overflow: 'hidden', elevation: 8, marginBottom: 25 },
  bgIcon: { position: 'absolute', right: -20, bottom: -20 },
  winnerBadgeLarge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 15 },
  winnerBadgeTextLarge: { color: '#fff', fontSize: 11, fontWeight: '900' },
  winnerCoalName: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 20 },
  winnerStatsRow: { flexDirection: 'row', alignItems: 'center' },
  winnerStatVal: { fontSize: 24, fontWeight: '900', color: '#fff' },
  winnerStatLbl: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.3)'},
  slateContainer: { backgroundColor: '#fff', padding: 25, borderRadius: 28, elevation: 1 },
  slateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  slateTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  slateSubtitle: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  countBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  slateCount: { fontSize: 12, fontWeight: '900', color: '#1E293B' },
  slateItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  slateDot: { width: 8, height: 8, borderRadius: 4, marginRight: 15 },
  slateInfo: { flex: 1 },
  slateNameText: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  slatePosText: { fontSize: 11, color: '#64748B', fontWeight: '700', marginTop: 2 },
  analyticsContainer: { paddingBottom: 20 },
  chartCard: { backgroundColor: '#fff', padding: 20, borderRadius: 24, elevation: 1, marginBottom: 20, alignItems: 'center' },
  posAnalyticsCard: { backgroundColor: '#fff', padding: 20, borderRadius: 24, elevation: 1, marginBottom: 15, alignItems: 'center' },
  schoolHeaderRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  posAnalyticsTitle: { fontSize: 15, fontWeight: '900', color: '#1E293B' },
  votesBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  votesBadgeText: { fontSize: 10, fontWeight: '800', color: '#64748B' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '100%', height: '80%', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 30, marginTop: 'auto' },
  modalContentSmall: { width: '85%', backgroundColor: '#fff', padding: 30, borderRadius: 32, alignItems: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  modalTitle: { fontSize: 24, fontWeight: '900', marginTop: 5 },
  modalSubtitle: { fontSize: 11, fontWeight: '800', color: '#64748B', letterSpacing: 1 },
  modalTitleSmall: { fontSize: 22, fontWeight: '900', color: '#1E293B', marginTop: 15, textAlign: 'center' },
  modalSubtitleSmall: { fontSize: 14, color: '#64748B', fontWeight: '700', marginTop: 4 },
  modalStatsRow: { flexDirection: 'row', marginVertical: 25, width: '100%', justifyContent: 'space-around' },
  modalStatItem: { alignItems: 'center' },
  modalStatVal: { fontSize: 24, fontWeight: '900', color: UNIVERSITY_RED },
  modalStatLbl: { fontSize: 10, fontWeight: '800', color: '#94A3B8', marginTop: 4 },
  closeBtn: { backgroundColor: '#F1F5F9', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 16, width: '100%', alignItems: 'center' },
  closeBtnText: { color: '#475569', fontWeight: '900', fontSize: 14 },
  slateRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 18, borderRadius: 20, marginBottom: 12 },
  slateMain: { flex: 1 },
  slateName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  skeletonCard: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderRadius: 20, marginBottom: 15 },
  skeletonCircle: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#F1F5F9' },
  skeletonLineShort: { height: 12, width: '60%', backgroundColor: '#F1F5F9', borderRadius: 6 }
});

export default ResultsScreen;
