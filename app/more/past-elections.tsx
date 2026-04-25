import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
  Image,
  ToastAndroid,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

// API Imports
import { useGetAllElectionsQuery, useGetElectionResultsQuery } from "@/src/store/Apis/Election.Api";

// Charts
import { PieChart } from "react-native-svg-charts";

const { width } = Dimensions.get("window");
const UNIVERSITY_RED = "#D32F2F";
const DARK_NAVY = "#1A237E";

export default function PastElectionScreen() {
  const router = useRouter();
  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const toastY = useRef(new Animated.Value(-100)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // 1. Fetch all elections for the list
  const { data: allElections, isLoading: loadingAll, refetch } = useGetAllElectionsQuery();

  // 2. Fetch Detailed Results (includes positions, candidates, and votes)
  const { data: resultsData, isLoading: loadingDetails, isError } = useGetElectionResultsQuery(
    selectedElectionId ?? "",
    { skip: !selectedElectionId }
  );

  // Safely extract the results object from the response
  const electionDetails = useMemo(() => resultsData?.results, [resultsData]);

  // Filter for past or completed elections
  const pastElections = useMemo(() => {
    if (!allElections?.elections) return [];
    const now = new Date();
    return allElections.elections.filter((election: any) => {
      const endDate = new Date(election.end_date);
      return endDate < now || election.status === 'completed' || election.status === 'finished'; 
    });
  }, [allElections]);

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync("#ffffff");
      NavigationBar.setButtonStyleAsync("dark");
    }
  }, []);

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
    
    Animated.parallel([
      Animated.timing(toastY, { toValue: 60, duration: 500, useNativeDriver: true }),
      Animated.timing(toastOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastY, { toValue: -100, duration: 500, useNativeDriver: true }),
        Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 2800);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast("Archive Database Updated");
  }, [refetch]);

  const closeModal = () => setSelectedElectionId(null);

  // Logic to calculate winner based on the 'votes' array length per candidate
  const getWinnerInfo = (position: any) => {
    if (!position.candidates || position.candidates.length === 0) return { name: "No Candidates", votes: 0 };
    
    const candidatesWithCounts = position.candidates.map((c: any) => ({
      name: c.name || "Unknown",
      votes: c.votes?.length || 0
    })).sort((a: any, b: any) => b.votes - a.votes);
    
    return candidatesWithCounts[0];
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* REFRESH TOAST */}
      <Animated.View style={[styles.toastContainer, { opacity: toastOpacity, transform: [{ translateY: toastY }] }]}>
        <LinearGradient colors={[UNIVERSITY_RED, "#B71C1C"]} style={styles.toastContent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Ionicons name="archive" size={18} color="#fff" />
          <Text style={styles.toastText}>Archive Refreshed</Text>
        </LinearGradient>
      </Animated.View>

      {/* NAVBAR */}
      <View style={styles.navbar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backChevron}>
             <Ionicons name="chevron-back" size={26} color={UNIVERSITY_RED} />
          </TouchableOpacity>
          <Image source={require('@/assets/images/Laikipia-logo.png')} style={styles.logo} />
          <View>
            <Text style={styles.headerTitle}>Past Elections</Text>
            <Text style={styles.headerSub}>CONCLUDED RECORDS</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="reload-circle-outline" size={26} color={UNIVERSITY_RED} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[UNIVERSITY_RED]} />}
      >
        <View style={styles.infoBox}>
            <MaterialCommunityIcons name="shield-check-outline" size={20} color={DARK_NAVY} />
            <Text style={styles.subtitle}>
            Historical results are cryptographically signed and stored for transparency.
            </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.header}>Past Results</Text>
          <View style={styles.titleLine} />
        </View>

        {loadingAll ? (
          <ActivityIndicator size="large" color={UNIVERSITY_RED} style={{ marginTop: 50 }} />
        ) : pastElections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="hourglass-outline" size={50} color="#ccc" />
            </View>
            <Text style={styles.emptyTitle}>No Records Found</Text>
            <Text style={styles.emptySubtitle}>There are no concluded elections to show at this time.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
               <Text style={styles.retryText}>Check for Updates</Text>
            </TouchableOpacity>
          </View>
        ) : (
          pastElections.map((election: any) => (
            <TouchableOpacity 
              key={election.id} 
              style={styles.electionCard}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSelectedElectionId(election.id);
              }}
            >
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{election.name}</Text>
                  <Text style={styles.dateText}>Concluded: {new Date(election.end_date).toLocaleDateString()}</Text>
                </View>
                <View style={styles.closedBadge}><Text style={styles.closedText}>CERTIFIED</Text></View>
              </View>
              <View style={styles.divider} />
              <View style={styles.cardFooter}>
                <Text style={styles.footerLink}>View Final Statistics</Text>
                <Ionicons name="stats-chart" size={16} color={UNIVERSITY_RED} />
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerBrand}>UNIVERSITY ARCHIVE SYSTEM</Text>
          <Text style={styles.footerSub}>VOTER NODE VERIFIED • © 2026</Text>
        </View>
      </ScrollView>

      {/* Results Modal */}
      <Modal visible={!!selectedElectionId} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {loadingDetails ? "Decrypting..." : electionDetails?.name || "Election Archive"}
                </Text>
                <Text style={styles.modalDate}>Official Results Statement</Text>
              </View>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close-circle" size={32} color="#DDD" /></TouchableOpacity>
            </View>

            {loadingDetails ? (
              <View style={{ paddingVertical: 80, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={UNIVERSITY_RED} />
                <Text style={{ marginTop: 15, color: '#999', fontWeight: '700' }}>RECOVERING BLOCKCHAIN DATA...</Text>
              </View>
            ) : isError ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Ionicons name="alert-circle" size={48} color={UNIVERSITY_RED} />
                <Text style={{ marginTop: 10, fontWeight: '700' }}>Error Loading Results</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.chartWrapper}>
                   <PieChart
                    style={{ height: 160, width: width * 0.7 }}
                    data={(electionDetails?.positions || []).map((pos: any, index: number) => {
                      // Total votes per position
                      const total = pos.candidates?.reduce((acc: number, curr: any) => acc + (curr.votes?.length || 0), 0) || 0;
                      return {
                        key: pos.id,
                        value: total === 0 ? 1 : total, // Avoid 0 value chart errors
                        svg: { fill: `hsl(${(index * 75) % 360}, 70%, 50%)` },
                      };
                    })}
                  />
                  <Text style={styles.chartCaption}>Aggregated Vote Distribution</Text>
                </View>

                <Text style={styles.breakdownHeader}>Executive Summary</Text>
                {electionDetails?.positions?.map((pos: any) => {
                  const winner = getWinnerInfo(pos);
                  return (
                    <View key={pos.id} style={styles.resultRow}>
                      <View style={styles.trophyBox}>
                        <Ionicons name="ribbon" size={24} color={UNIVERSITY_RED} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.posLabel}>{pos.tier?.toUpperCase()} • {pos.school || 'University Wide'}</Text>
                        <Text style={styles.winnerName}>{pos.name}</Text>
                        <View style={styles.winnerPill}>
                           <Text style={styles.winnerLabel}>Elected: {winner.name}</Text>
                        </View>
                        <Text style={styles.voteSub}>{winner.votes} Certified Votes</Text>
                      </View>
                    </View>
                  );
                })}
                
                <TouchableOpacity style={styles.closeFullButton} onPress={closeModal}>
                   <Text style={styles.closeFullButtonText}>Exit Records</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  navbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, height: 75, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee", elevation: 2 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backChevron: { marginRight: 8, padding: 4 },
  logo: { width: 45, height: 45, resizeMode: 'contain', marginRight: 10 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: UNIVERSITY_RED, textTransform: 'uppercase' },
  headerSub: { fontSize: 9, color: '#999', fontWeight: 'bold' },
  refreshBtn: { padding: 5 },
  content: { padding: 20 },
  infoBox: { flexDirection: 'row', backgroundColor: '#F0F4FF', padding: 15, borderRadius: 16, marginBottom: 25, alignItems: 'center' },
  subtitle: { flex: 1, fontSize: 12, color: DARK_NAVY, marginLeft: 10, lineHeight: 18, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  header: { fontSize: 20, fontWeight: "900", color: "#222" },
  titleLine: { flex: 1, height: 1, backgroundColor: '#EEE', marginLeft: 15 },
  toastContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99999, alignItems: 'center' },
  toastContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, gap: 8, elevation: 10 },
  toastText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  electionCard: { padding: 20, marginVertical: 8, borderRadius: 24, backgroundColor: "#fff", borderWidth: 1, borderColor: "#F0F0F0" },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 17, fontWeight: "900", color: "#111" },
  dateText: { fontSize: 12, color: "#AAA" },
  closedBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  closedText: { fontSize: 9, fontWeight: '900', color: '#2E7D32' },
  divider: { height: 1, backgroundColor: "#F8F8F8", marginVertical: 15 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLink: { fontSize: 13, fontWeight: '800', color: UNIVERSITY_RED },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyIconBox: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#333' },
  emptySubtitle: { fontSize: 14, color: '#AAA', textAlign: 'center', paddingHorizontal: 20 },
  retryBtn: { paddingVertical: 14, paddingHorizontal: 30, borderRadius: 15, borderWidth: 1.5, borderColor: UNIVERSITY_RED, marginTop: 20 },
  retryText: { color: UNIVERSITY_RED, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, maxHeight: "92%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: "900", color: "#111" },
  modalDate: { fontSize: 11, color: UNIVERSITY_RED, fontWeight: '800', textTransform: 'uppercase' },
  chartWrapper: { alignItems: 'center', marginBottom: 20, padding: 20, backgroundColor: '#F9FAFB', borderRadius: 24 },
  chartCaption: { fontSize: 10, fontWeight: '900', color: '#BBB', marginTop: 15, textTransform: 'uppercase' },
  breakdownHeader: { fontSize: 14, fontWeight: '900', color: '#444', marginBottom: 15, marginLeft: 5 },
  resultRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, backgroundColor: '#FFF', padding: 18, borderRadius: 20, borderWidth: 1, borderColor: '#F0F0F0' },
  trophyBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#FDF2F2', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  posLabel: { fontSize: 9, fontWeight: "900", color: "#BBB" },
  winnerName: { fontSize: 17, fontWeight: "900", color: "#222", marginBottom: 4 },
  winnerPill: { backgroundColor: '#F0F4FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 5 },
  winnerLabel: { fontSize: 11, color: DARK_NAVY, fontWeight: '800' },
  voteSub: { fontSize: 12, color: UNIVERSITY_RED, fontWeight: '700' },
  closeFullButton: { backgroundColor: DARK_NAVY, padding: 18, borderRadius: 18, alignItems: "center", marginTop: 25, marginBottom: 40 },
  closeFullButtonText: { color: "#fff", fontWeight: "900" },
  footer: { marginTop: 40, alignItems: 'center', marginBottom: 20 },
  footerDivider: { width: 35, height: 3, backgroundColor: UNIVERSITY_RED, marginBottom: 15 },
  footerBrand: { fontSize: 11, fontWeight: '900' },
  footerSub: { fontSize: 10, color: '#BBB', marginTop: 6 },
});