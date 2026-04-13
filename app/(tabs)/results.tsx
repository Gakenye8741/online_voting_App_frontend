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
    pollingInterval: isCompleted ? 0 : 15000, 
  });

  const { data: coalitionsData } = useGetCoalitionsByElectionQuery(resolvedId, { skip: !resolvedId });
  const { data: executiveResults } = useGetExecutiveResultsQuery(resolvedId, { skip: !resolvedId });
  
  const { data: leaderSlateData, isLoading: loadingLeaderSlate } = useGetCoalitionFullSlateQuery(
    activeCoalition?.id, 
    { skip: !activeCoalition?.id }
  );

 const processedData = useMemo(() => {
    const rawData = (data?.data || []) as ElectionResult[]; 
    const coalList = (coalitionsData?.coalitions || []) as any[];
    const allPos = (positionsData?.positions || []) as any[];

    // Filter for School-tier positions only
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

    const totalVotesInElection = enrichedData.reduce((acc, curr) => acc + Number(curr.votes_count || 0), 0);
    const turnout = (totalVotesInElection / (Number(userCountData?.count) || 1)) * 100;

    // HELPER: Generates data for positions without being affected by UI filters
    const getChartDataForPositions = (posList: any[]) => {
      return posList.map(pos => {
        const candidates = enrichedData
          .filter(c => c.position_id === pos.id)
          .sort((a, b) => Number(b.votes_count) - Number(a.votes_count));
        
        const totalPosVotes = candidates.reduce((sum, c) => sum + Number(c.votes_count), 0);

        return {
          title: pos.name,
          totalVotes: totalPosVotes,
          chartData: candidates.map((c, idx) => ({
            name: c.candidate_name?.split(' ')[0] || "Unknown",
            votes: Number(c.votes_count),
            color: [UNIVERSITY_RED, GOLD, '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'][idx % 6],
            legendFontColor: "#64748b",
            legendFontSize: 10
          }))
        };
      }).filter(p => p.chartData.length > 0);
    };

    // 1. For the Live Tally list (Affected by search and chip filters)
    const positionsToDisplay = selectedPositionId 
        ? schoolPositions.filter(p => p.id === selectedPositionId)
        : schoolPositions;

    const sections: { title: string, data: ElectionResult[] }[] = [];
    positionsToDisplay.forEach(pos => {
        const candidatesForPos = enrichedData
            .filter(c => c.position_id === pos.id && (c.candidate_name?.toLowerCase().includes(searchQuery.toLowerCase()) || !searchQuery))
            .sort((a, b) => Number(b.votes_count) - Number(a.votes_count));
        
        if (candidatesForPos.length > 0) {
            sections.push({ 
                title: pos.name, 
                data: candidatesForPos.map(c => ({ ...c, total_pos_votes: candidatesForPos.reduce((s, curr) => s + Number(curr.votes_count), 0) })) 
            });
        }
    });

    // 2. For Analytics (ALWAYS shows all schools)
    const allPositionCharts = getChartDataForPositions(schoolPositions);

    // EXECUTIVE RESULTS CALCULATION
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
      schoolPositions,
      allPositionCharts, 
      leadingCoalition: standings.length > 0 ? standings[0] : null,
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
          </Animatable.View>
        )}

        {activeTab === 'coalition' && renderCoalitionLeaderTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
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
        <View style={styles.leaderTabContainer}>
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

          <View style={styles.sectionHeaderContainer}>
              <View style={styles.sectionHeaderLine} />
              <Text style={styles.sectionHeaderText}>SCHOOL-LEVEL BREAKDOWN</Text>
          </View>

          {processedData.allPositionCharts.map((posChart, idx) => (
            <Animatable.View 
                key={posChart.title} 
                animation="fadeInUp" 
                delay={idx * 100} 
                style={styles.posAnalyticsCard}
            >
                <View style={styles.schoolHeaderRow}>
                    <Text style={styles.posAnalyticsTitle}>{posChart.title}</Text>
                    <View style={styles.votesBadge}>
                        <Text style={styles.votesBadgeText}>{posChart.totalVotes.toLocaleString()} Total</Text>
                    </View>
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

          <View style={styles.metricsGrid}>
                <View style={[styles.metricItem, { borderLeftColor: UNIVERSITY_RED }]}>
                    <Text style={styles.metricLabel}>Total Reach</Text>
                    <Text style={styles.metricValue}>{processedData.totalVotes.toLocaleString()}</Text>
                </View>
                <View style={[styles.metricItem, { borderLeftColor: GOLD }]}>
                    <Text style={styles.metricLabel}>Nodes Reporting</Text>
                    <Text style={styles.metricValue}>{processedData.allPositionCharts.length}</Text>
                </View>
          </View>

          <View style={[styles.blockchainInfo, { marginBottom: 30 }]}>
             <MaterialCommunityIcons name="security" size={24} color="#fff" />
             <Text style={styles.blockchainText}>Fetched via Laikipia E-Vote validator network. Data is final and immutable.</Text>
          </View>
      </View>
  );

  const renderCandidate = ({ item, index }: { item: ElectionResult, index: number }) => {
    const isWinner = index === 0 && !searchQuery;
    const positionTotal = item.total_pos_votes || 1;
    const percentage = (Number(item.votes_count) / positionTotal) * 100;

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
            <Animatable.View 
                animation="stretchX" 
                duration={1200} 
                key={percentage} 
                style={[styles.progressFillCand, { width: `${percentage}%`, backgroundColor: isWinner ? GOLD : UNIVERSITY_RED }]} 
            />
        </View>
      </Animatable.View>
    );
  };

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
      
      <SectionList
        sections={activeTab === 'main' ? processedData.sections : []}
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
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    container: { padding: 20 },
    headerWrapper: { backgroundColor: '#fff' },
    topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    logo: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
    userNameText: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    greetingText: { fontSize: 12, color: '#64748b' },
    shareBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 10 },
    tabContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 4, borderRadius: 12, marginBottom: 15 },
    tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
    activeTabButton: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    tabText: { fontSize: 12, fontWeight: '600', color: '#94a3b8', marginLeft: 6 },
    activeTabText: { color: UNIVERSITY_RED },
    electionInfoCard: { backgroundColor: '#1e293b', borderRadius: 24, padding: 20, marginBottom: 20 },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    electionTitle: { fontSize: 18, fontWeight: '800', color: '#fff', flex: 1 },
    liveIndicatorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: UNIVERSITY_RED, marginRight: 8 },
    liveText: { fontSize: 10, fontWeight: '800', color: UNIVERSITY_RED, letterSpacing: 1 },
    participationTracker: { marginTop: 5 },
    trackerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
    trackerLabel: { color: '#94a3b8', fontSize: 12 },
    trackerValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
    progressBackground: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
    progressFill: { height: '100%', backgroundColor: EMERALD, borderRadius: 3 },
    totalVotesText: { color: '#64748b', fontSize: 11 },
    coalitionSection: { marginBottom: 25 },
    sectionHeaderCompact: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
    helperText: { fontSize: 12, color: '#64748b' },
    coalitionScroll: { paddingBottom: 5 },
    detailedCoalCard: { width: 140, padding: 15, borderRadius: 20, marginRight: 12 },
    coalCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    coalAcronym: { color: '#fff', fontWeight: '900', fontSize: 16 },
    coalVoteVal: { color: '#fff', fontSize: 20, fontWeight: '800' },
    coalVoteLbl: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '700', marginTop: 2 },
    filterSection: { marginBottom: 20 },
    chipScroll: { paddingVertical: 5 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8, marginBottom: 5 },
    activeChip: { backgroundColor: UNIVERSITY_RED, borderColor: UNIVERSITY_RED },
    chipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    activeChipText: { color: '#fff' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 15, paddingHorizontal: 15, height: 45, marginBottom: 10 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1e293b' },
    sectionHeaderContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginVertical: 15 },
    sectionHeaderLine: { width: 4, height: 16, backgroundColor: UNIVERSITY_RED, borderRadius: 2, marginRight: 10 },
    sectionHeaderText: { fontSize: 14, fontWeight: '800', color: '#64748b', letterSpacing: 1 },
    candCard: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 12, borderRadius: 16, padding: 15, borderWidth: 1, borderColor: '#f1f5f9' },
    winnerCard: { borderColor: GOLD, backgroundColor: '#fff' },
    candTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    rankBadge: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    rankText: { fontSize: 14, fontWeight: '800', color: '#64748b' },
    candInfo: { flex: 1 },
    candName: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
    candPosition: { fontSize: 12, color: '#64748b' },
    voteBox: { alignItems: 'flex-end' },
    voteCount: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
    votePercent: { fontSize: 11, color: '#64748b', fontWeight: '600' },
    progressTrack: { height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, overflow: 'hidden' },
    progressFillCand: { height: '100%', borderRadius: 2 },
    skeletonCard: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, marginHorizontal: 20 },
    skeletonCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9' },
    skeletonLineShort: { width: '60%', height: 12, backgroundColor: '#f1f5f9', borderRadius: 6 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyText: { marginTop: 15, fontSize: 14, color: '#64748b', fontWeight: '600' },
    leaderTabContainer: { paddingVertical: 10 },
    bigWinnerCard: { borderRadius: 30, padding: 25, height: 220, justifyContent: 'center', overflow: 'hidden', marginBottom: 25 },
    bgIcon: { position: 'absolute', right: -20, bottom: -20 },
    winnerBadgeLarge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 15 },
    winnerBadgeTextLarge: { fontSize: 10, fontWeight: '800', color: AMAKERE_GOLD, letterSpacing: 0.5 },
    winnerCoalName: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 20 },
    winnerStatsRow: { flexDirection: 'row', alignItems: 'center' },
    winnerStatVal: { color: '#fff', fontSize: 24, fontWeight: '800' },
    winnerStatLbl: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', marginTop: 2 },
    statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 20 },
    slateContainer: { backgroundColor: '#fff', borderRadius: 24, padding: 20 },
    slateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    slateTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
    slateSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
    countBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    slateCount: { fontSize: 14, fontWeight: '800', color: UNIVERSITY_RED },
    slateItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    slateDot: { width: 6, height: 6, borderRadius: 3, marginRight: 15 },
    slateInfo: { flex: 1 },
    slateNameText: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
    slatePosText: { fontSize: 11, color: '#64748b', marginTop: 2 },
    analyticsContainer: { paddingBottom: 20 },
    chartCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, alignItems: 'center', marginBottom: 25, borderWidth: 1, borderColor: '#f1f5f9' },
    posAnalyticsCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#f1f5f9' },
    schoolHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    posAnalyticsTitle: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
    votesBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    votesBadgeText: { fontSize: 10, fontWeight: '800', color: UNIVERSITY_RED },
    metricsGrid: { flexDirection: 'row', gap: 12, marginBottom: 25 },
    metricItem: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 20, borderLeftWidth: 4 },
    metricLabel: { fontSize: 11, color: '#64748b', marginBottom: 5, fontWeight: '600' },
    metricValue: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
    blockchainInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 15, borderRadius: 15 },
    blockchainText: { flex: 1, color: 'rgba(255,255,255,0.7)', fontSize: 11, marginLeft: 12, lineHeight: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, height: height * 0.7 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
    modalSubtitle: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 },
    modalTitle: { fontSize: 24, fontWeight: '900', marginTop: 5 },
    slateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    slateMain: { flex: 1 },
    slateName: { fontSize: 16, fontWeight: '700', color: '#1e293b' }
});

export default ResultsScreen;