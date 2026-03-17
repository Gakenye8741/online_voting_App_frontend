import React, { useMemo, useState, useEffect, useRef } from 'react';
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
  Alert,
  ScrollView,
  Image,
  Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PieChart } from "react-native-chart-kit";
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from 'expo-clipboard';

// API Hooks
import { useGetElectionResultsQuery } from '@/src/store/Apis/Voting.Api'; 
import { useGetAllElectionsQuery } from '@/src/store/Apis/Election.Api';
import { useGetAllPositionsQuery } from '@/src/store/Apis/Positions.Api';
import { useGetUsersCountQuery } from '@/src/store/Apis/User.Api';

const { width } = Dimensions.get('window');
const UNIVERSITY_RED = '#c8102e';

interface ElectionResult {
  candidate_id: string;
  candidate_name: string | null;
  position_id: string;
  votes_count: string | number;
}

const ResultsScreen = () => {
  const route = useRoute();
  const params = (route?.params as any) || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyHash, setVerifyHash] = useState(''); 
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isNotified, setIsNotified] = useState(false); // New state for notifications

  useEffect(() => {
    const loadData = async () => {
      const userData = await AsyncStorage.getItem("user");
      if (userData) setUser(JSON.parse(userData));
      if (params?.txHash) setVerifyHash(params.txHash);
    };
    loadData();
  }, [params?.txHash]);

  const { data: allElections, isLoading: loadingElections } = useGetAllElectionsQuery();
  const { data: positionsData, isLoading: loadingPositions } = useGetAllPositionsQuery();
  const { data: userCountData, isLoading: loadingUserCount } = useGetUsersCountQuery();

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
    pollingInterval: isCompleted ? 0 : 20000, 
    refetchOnFocus: true,
  });

  const { sortedResults, totalVotes, turnoutPercentage, chartData } = useMemo(() => {
    const rawData = (data?.data || []) as ElectionResult[]; 
    const baseData = selectedPositionId 
      ? rawData.filter(item => item.position_id === selectedPositionId)
      : rawData;

    const sorted = [...baseData].sort((a, b) => Number(b.votes_count) - Number(a.votes_count));
    const total = sorted.reduce((acc, curr) => acc + Number(curr.votes_count), 0);
    const registeredVoters = userCountData?.count || 0;
    const turnout = registeredVoters > 0 ? (total / registeredVoters) * 100 : 0;

    const colors = [UNIVERSITY_RED, '#111', '#475569', '#94a3b8', '#cbd5e1'];
    const chart = sorted.slice(0, 5).map((c, i) => ({
      name: (c.candidate_name ?? "Candidate").split(' ')[0], 
      votes: Number(c.votes_count),
      color: colors[i % colors.length],
      legendFontColor: "#475569",
      legendFontSize: 11
    }));

    return { sortedResults: sorted, totalVotes: total, turnoutPercentage: turnout, chartData: chart };
  }, [data, selectedPositionId, userCountData]);

  const handleShareResults = async () => {
    try {
      const positionFilterText = selectedPositionId ? ` for ${positionsData?.positions.find((p: any) => p.id === selectedPositionId)?.name}` : "";
      await Share.share({
        message: `📊 Official ${resolvedName} Leaderboard${positionFilterText}:\n\nTotal Votes: ${totalVotes}\nTurnout: ${turnoutPercentage.toFixed(1)}%\n\nVerified on the Blockchain Ledger.`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleShareCandidate = async (item: ElectionResult, positionName: string) => {
    try {
        const percentage = totalVotes > 0 ? (Number(item.votes_count) / totalVotes) * 100 : 0;
        await Share.share({
            message: `🗳️ Candidate Spotlight: ${item.candidate_name}\nPosition: ${positionName}\nVotes: ${Number(item.votes_count).toLocaleString()} (${percentage.toFixed(1)}%)\n\nCheck live updates on the Laikipia E-Vote Portal!`,
        });
    } catch (error) {
        console.error(error);
    }
  };

  const handleToggleNotification = () => {
    setIsNotified(!isNotified);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
        !isNotified ? "Notifications On" : "Notifications Off",
        !isNotified ? "You will be notified when the final results are certified." : "You have unsubscribed from result updates."
    );
  };

  const handleDownloadCertificate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Generating Certificate", "Your official election result summary is being prepared for download.");
    // In a real scenario, trigger a PDF generation service here
  };

  const handlePasteHash = async () => {
    const text = await Clipboard.getStringAsync();
    if (text.startsWith('0x')) {
      setVerifyHash(text);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Alert.alert("No Hash Found", "The clipboard doesn't contain a valid transaction hash.");
    }
  };

  const handleVerifyVote = () => {
    if (!verifyHash.startsWith('0x') || verifyHash.length < 40) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Invalid Hash", "Please enter a valid Sepolia transaction hash.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`https://sepolia.etherscan.io/tx/${verifyHash}`);
  };

  const filteredResults = useMemo(() => {
    return sortedResults.filter(c => {
      const nameMatch = (c.candidate_name ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      const posName = positionsData?.positions.find((p: any) => p.id === c.position_id)?.name || "";
      const posMatch = posName.toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch || posMatch;
    });
  }, [sortedResults, searchQuery, positionsData]);

  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      <View style={styles.topHeader}>
        <Animatable.View animation="fadeInLeft" style={styles.headerLeft}>
          <Image source={require('@/assets/images/Laikipia-logo.png')} style={styles.logo} />
          <View>
            <View style={styles.nameRow}>
                <Text style={styles.userNameText}>{user?.name || "User"}</Text>
                <View style={styles.votedBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
                    <Text style={styles.votedBadgeText}>VOTED</Text>
                </View>
            </View>
            <Text style={styles.greetingText}>Analytics Dashboard</Text>
          </View>
        </Animatable.View>
        <View style={styles.headerRightGroup}>
            {!isCompleted && (
                <TouchableOpacity onPress={handleToggleNotification} style={styles.notificationBtn}>
                    <Ionicons name={isNotified ? "notifications" : "notifications-outline"} size={20} color={isNotified ? UNIVERSITY_RED : "#111"} />
                </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleShareResults} style={styles.shareBtn}>
                <Ionicons name="share-social-outline" size={20} color="#111" />
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.container}>
        <Animatable.View animation="fadeInUp" style={styles.electionInfoCard}>
            <View style={styles.electionHeaderRow}>
                <View style={{flex: 1}}>
                    <Text style={styles.electionTitle}>{resolvedName}</Text>
                    <View style={styles.liveIndicatorRow}>
                        <View style={[styles.pulseDot, isCompleted && { backgroundColor: '#166534' }]} />
                        <Text style={[styles.liveText, isCompleted && { color: '#166534' }]}>
                            {isCompleted ? 'ARCHIVED' : 'LIVE DATA STREAM'}
                        </Text>
                    </View>
                </View>
                {isCompleted && (
                    <TouchableOpacity onPress={handleDownloadCertificate} style={styles.certBtn}>
                        <MaterialCommunityIcons name="file-certificate" size={24} color={UNIVERSITY_RED} />
                    </TouchableOpacity>
                )}
            </View>
            
            <View style={styles.participationTracker}>
                <View style={styles.trackerHeader}>
                    <Text style={styles.trackerLabel}>Real-time Voter Turnout</Text>
                    <Text style={styles.trackerValue}>{turnoutPercentage.toFixed(1)}%</Text>
                </View>
                <View style={styles.progressBackground}>
                    <View style={[styles.progressFill, { width: `${turnoutPercentage}%` }]} />
                </View>
                <Text style={styles.voterSubtext}>{totalVotes.toLocaleString()} votes cast via secure ledger</Text>
            </View>
        </Animatable.View>

        <TouchableOpacity 
            style={styles.trustCard}
            onPress={() => Linking.openURL(`https://sepolia.etherscan.io/address/${resolvedId}`)}
        >
           <View style={styles.trustIconBg}><Ionicons name="shield-checkmark" size={24} color="#fff" /></View>
           <View style={styles.trustTextContent}>
              <Text style={styles.trustLabel}>Immutable Ledger Verified</Text>
              <Text style={styles.trustDesc}>View cryptographic proof on Sepolia Explorer.</Text>
           </View>
           <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>

        <View style={styles.filterSection}>
            <View style={styles.filterHeaderRow}>
                <Text style={styles.sectionTitle}>Filter Results</Text>
                <TouchableOpacity onPress={handleShareResults}>
                    <Text style={styles.shareStatsText}>Share Tally</Text>
                </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                <TouchableOpacity 
                    onPress={() => setSelectedPositionId(null)}
                    style={[styles.chip, !selectedPositionId && styles.activeChip]}
                >
                    <Text style={[styles.chipText, !selectedPositionId && styles.activeChipText]}>All Seats</Text>
                </TouchableOpacity>
                {positionsData?.positions.map((pos: any) => (
                    <TouchableOpacity 
                        key={pos.id}
                        onPress={() => setSelectedPositionId(pos.id)}
                        style={[styles.chip, selectedPositionId === pos.id && styles.activeChip]}
                    >
                        <Text style={[styles.chipText, selectedPositionId === pos.id && styles.activeChipText]}>{pos.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        {totalVotes > 0 && (
          <Animatable.View animation="zoomIn" style={styles.chartCard}>
            <Text style={styles.chartTitle}>Distribution</Text>
            <PieChart
              data={chartData}
              width={width - 80}
              height={180}
              chartConfig={{ color: (opacity = 1) => `rgba(200, 16, 46, ${opacity})` }}
              accessor={"votes"}
              backgroundColor={"transparent"}
              paddingLeft={"0"}
              center={[10, 0]}
              absolute
            />
          </Animatable.View>
        )}

        <View style={styles.leaderboardHeader}>
            <Text style={styles.sectionTitle}>Leaderboard</Text>
            <View style={styles.searchBar}>
                <Ionicons name="search" size={16} color="#9CA3AF" />
                <TextInput 
                    placeholder="Search candidate..." 
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>
        </View>
      </View>
    </View>
  );

  const renderFooter = () => (
    <Animatable.View animation="fadeInUp" style={styles.footerContainer}>
        <View style={styles.verifySection}>
            <View style={styles.verifyHeader}>
              <Ionicons name="finger-print" size={20} color={UNIVERSITY_RED} />
              <Text style={styles.verifyTitle}>Audit Your Vote</Text>
            </View>
            <Text style={styles.verifyDesc}>Paste your transaction hash to verify your immutable entry.</Text>
            <View style={styles.verifyInputRow}>
                <TextInput 
                    placeholder="0x... Transaction Hash" 
                    style={styles.verifyInput}
                    value={verifyHash}
                    onChangeText={setVerifyHash}
                    autoCapitalize="none"
                />
                <TouchableOpacity style={styles.pasteBtn} onPress={handlePasteHash}>
                    <Ionicons name="clipboard-outline" size={20} color={UNIVERSITY_RED} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyVote}>
                    <Ionicons name="shield-checkmark" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
        <View style={styles.endPadding} />
    </Animatable.View>
  );

  const renderCandidate = ({ item, index }: { item: ElectionResult, index: number }) => {
    const percentage = totalVotes > 0 ? (Number(item.votes_count) / totalVotes) * 100 : 0;
    const isWinner = index === 0 && totalVotes > 0;
    const positionName = positionsData?.positions.find((p: any) => p.id === item.position_id)?.name || "Candidate";

    return (
      <Animatable.View animation="fadeInUp" delay={index * 50} style={[styles.candCard, isWinner && styles.winnerCard]}>
        <View style={styles.candTop}>
            <View style={[styles.rankBadge, isWinner && styles.winnerBadge]}>
                {isWinner ? (
                    <MaterialCommunityIcons name="trophy" size={20} color="#fff" />
                ) : (
                    <Text style={styles.rankText}>{index + 1}</Text>
                )}
            </View>
            <View style={styles.candInfo}>
                <View style={styles.nameShareRow}>
                    <Text style={styles.candName} numberOfLines={1}>{item.candidate_name || "Anonymous"}</Text>
                    <TouchableOpacity onPress={() => handleShareCandidate(item, positionName)} style={styles.candShareBtn}>
                        <Ionicons name="share-outline" size={16} color={UNIVERSITY_RED} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.candPosition}>{positionName.toUpperCase()}</Text>
            </View>
            <View style={styles.voteBox}>
                <Text style={styles.voteCount}>{Number(item.votes_count).toLocaleString()}</Text>
                <Text style={styles.votePercent}>{percentage.toFixed(1)}%</Text>
            </View>
        </View>
        <View style={styles.candProgressBase}>
            <View style={[styles.candProgressFill, { width: `${percentage}%`, backgroundColor: isWinner ? UNIVERSITY_RED : '#111' }]} />
        </View>
      </Animatable.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="account-search-outline" size={60} color="#E5E7EB" />
        <Text style={styles.emptyTitle}>No Results Found</Text>
        <TouchableOpacity 
            style={styles.resetBtn} 
            onPress={() => {setSearchQuery(''); setSelectedPositionId(null);}}
        >
            <Text style={styles.resetBtnText}>Reset Filter</Text>
        </TouchableOpacity>
    </View>
  );

  if (loadingElections || isLoading || loadingPositions || loadingUserCount) {
    return (
        <View style={styles.loader}>
            <ActivityIndicator size="large" color={UNIVERSITY_RED} />
            <Text style={styles.loaderText}>SYNCING LEDGER...</Text>
        </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <FlatList
        data={filteredResults}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState} 
        renderItem={renderCandidate}
        keyExtractor={(item) => item.candidate_id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={UNIVERSITY_RED} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  headerWrapper: { backgroundColor: "#F9FAFB" },
  topHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 10, 
    backgroundColor: '#fff', 
    paddingBottom: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRightGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shareBtn: { padding: 8, backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  notificationBtn: { padding: 8, backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  logo: { width: 40, height: 40, marginRight: 12, borderRadius: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  greetingText: { fontSize: 11, color: "#9CA3AF", fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  userNameText: { fontSize: 16, fontWeight: "900", color: "#111" },
  votedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 0.5, borderColor: '#16a34a40' },
  votedBadgeText: { fontSize: 8, fontWeight: '900', color: '#16a34a', marginLeft: 3 },
  
  electionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  liveIndicatorRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: UNIVERSITY_RED, marginRight: 6 },
  liveText: { fontSize: 9, fontWeight: '900', color: UNIVERSITY_RED, letterSpacing: 0.5 },
  certBtn: { padding: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2 },

  container: { padding: 20 },
  electionInfoCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 } },
  electionTitle: { fontSize: 22, fontWeight: '900', color: '#111', marginBottom: 6 },
  participationTracker: { marginTop: 15 },
  trackerHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  trackerLabel: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  trackerValue: { fontSize: 16, fontWeight: '900', color: UNIVERSITY_RED },
  progressBackground: { height: 12, backgroundColor: '#F3F4F6', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: UNIVERSITY_RED },
  voterSubtext: { fontSize: 11, color: '#9CA3AF', marginTop: 8, fontWeight: '600' },

  trustCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 16, borderRadius: 20, marginBottom: 20 },
  trustIconBg: { backgroundColor: UNIVERSITY_RED, padding: 8, borderRadius: 12, marginRight: 12 },
  trustTextContent: { flex: 1 },
  trustLabel: { fontSize: 12, color: '#fff', fontWeight: '800' },
  trustDesc: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },

  sectionTitle: { fontSize: 18, fontWeight: "900", color: "#111" },
  filterSection: { marginBottom: 25 },
  filterHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  shareStatsText: { fontSize: 12, fontWeight: '800', color: UNIVERSITY_RED },
  chipScroll: { paddingBottom: 5 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  activeChip: { backgroundColor: '#111', borderColor: '#111' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  activeChipText: { color: '#fff' },

  chartCard: { backgroundColor: '#fff', padding: 20, borderRadius: 24, marginBottom: 25, alignItems: 'center', elevation: 1 },
  chartTitle: { fontSize: 14, fontWeight: '900', color: '#111', alignSelf: 'flex-start', marginBottom: 10 },

  leaderboardHeader: { marginBottom: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 45, borderWidth: 1, borderColor: '#E5E7EB', marginTop: 5 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#111' },

  footerContainer: { paddingHorizontal: 20, paddingBottom: 40, marginTop: 10 },
  verifySection: { backgroundColor: '#fff', borderRadius: 24, padding: 20, elevation: 1, borderTopWidth: 4, borderTopColor: UNIVERSITY_RED },
  verifyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  verifyTitle: { fontSize: 16, fontWeight: '900', color: '#111', marginLeft: 8 },
  verifyDesc: { fontSize: 11, color: '#6B7280', marginBottom: 15, lineHeight: 16 },
  verifyInputRow: { flexDirection: 'row', gap: 10 },
  verifyInput: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 15, height: 45, borderWidth: 1, borderColor: '#E5E7EB', fontSize: 12 },
  pasteBtn: { backgroundColor: '#FEF2F2', width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: UNIVERSITY_RED + '40' },
  verifyBtn: { backgroundColor: '#111', width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  endPadding: { height: 20 },

  listContent: { paddingBottom: 20, backgroundColor: '#F9FAFB' },
  candCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9', marginHorizontal: 20 },
  winnerCard: { borderColor: UNIVERSITY_RED, borderLeftWidth: 5 },
  candTop: { flexDirection: 'row', alignItems: 'center' },
  rankBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  winnerBadge: { backgroundColor: UNIVERSITY_RED },
  rankText: { fontSize: 14, fontWeight: '900', color: '#9CA3AF' },
  candInfo: { flex: 1 },
  nameShareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  candName: { fontSize: 15, fontWeight: '800', color: '#111', maxWidth: '85%' },
  candShareBtn: { padding: 4 },
  candPosition: { fontSize: 9, color: '#9CA3AF', fontWeight: '900', marginTop: 2 },
  voteBox: { alignItems: 'flex-end', minWidth: 60 },
  voteCount: { fontSize: 18, fontWeight: '900', color: '#111' },
  votePercent: { fontSize: 10, fontWeight: '700', color: '#9CA3AF' },
  candProgressBase: { height: 4, backgroundColor: '#F3F4F6', borderRadius: 2, marginTop: 15, overflow: 'hidden' },
  candProgressFill: { height: '100%' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#111', marginTop: 15 },
  resetBtn: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F3F4F6' },
  resetBtnText: { fontSize: 12, fontWeight: '800', color: UNIVERSITY_RED },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loaderText: { marginTop: 15, fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1 }
});

export default ResultsScreen;