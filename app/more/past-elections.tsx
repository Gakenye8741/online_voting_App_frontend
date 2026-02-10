import React, { useState, useEffect, useRef, useMemo } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

// API Imports
import { useGetAllElectionsQuery, useGetElectionByIdQuery } from "@/src/store/Apis/Election.Api";

// Charts
import { PieChart } from "react-native-svg-charts";

const { width } = Dimensions.get("window");
const UNIVERSITY_RED = "#D32F2F";

export default function PastElectionScreen() {
  const router = useRouter();
  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);
  
  // Toast Animation State
  const toastY = useRef(new Animated.Value(-100)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // 1. Fetch all elections
  const { data: allElections, isLoading: loadingAll, refetch, isFetching } = useGetAllElectionsQuery();

  // 2. Fetch details for the selected modal
  const { data: electionDetails, isLoading: loadingDetails } = useGetElectionByIdQuery(
    selectedElectionId ?? "",
    { skip: !selectedElectionId }
  );

  // ---------- FILTER LOGIC ----------
  // Only show elections where the end_date is in the past
  const pastElections = useMemo(() => {
    if (!allElections?.elections) return [];
    const now = new Date();
    return allElections.elections.filter((election: any) => {
      const endDate = new Date(election.end_date);
      return endDate < now; // Strictly older than current time
    });
  }, [allElections]);

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync("#ffffff");
      NavigationBar.setButtonStyleAsync("dark");
    }
  }, []);

  const showToast = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  const onRefresh = async () => {
    await refetch();
    showToast();
  };

  const closeModal = () => setSelectedElectionId(null);

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color={UNIVERSITY_RED} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Archives</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={onRefresh} colors={[UNIVERSITY_RED]} />}
      >
        <Text style={styles.subtitle}>
          Official results of concluded elections. Active or upcoming polls are filtered out.
        </Text>

        <Text style={styles.header}>Past Results</Text>

        {loadingAll ? (
          <ActivityIndicator size="large" color={UNIVERSITY_RED} style={{ marginTop: 50 }} />
        ) : pastElections.length === 0 ? (
          /* EMPTY STATE - NO CONCLUDED ELECTIONS */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="hourglass-outline" size={50} color="#ccc" />
            </View>
            <Text style={styles.emptyTitle}>No Records Found</Text>
            <Text style={styles.emptySubtitle}>
              There are no concluded elections to show at this time.
            </Text>
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
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSelectedElectionId(election.id);
              }}
            >
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{election.name}</Text>
                  <Text style={styles.dateText}>
                    Concluded: {new Date(election.end_date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.closedBadge}>
                   <Text style={styles.closedText}>CLOSED</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.cardFooter}>
                <Text style={styles.footerLink}>View Full Statistics</Text>
                <Ionicons name="stats-chart-outline" size={16} color={UNIVERSITY_RED} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Election Details Modal */}
      <Modal visible={!!selectedElectionId} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{electionDetails?.election?.name || "Loading..."}</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close-circle" size={30} color="#333" />
              </TouchableOpacity>
            </View>

            {loadingDetails ? (
              <ActivityIndicator color={UNIVERSITY_RED} style={{ marginVertical: 40 }} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalDate}>Official Results Statement</Text>

                <View style={styles.chartWrapper}>
                   <PieChart
                    style={{ height: 160 }}
                    data={(electionDetails?.positions || [1,2,3]).map((_, index: number) => ({
                      key: index,
                      value: 1,
                      svg: { fill: index === 0 ? UNIVERSITY_RED : `hsl(${index * 45}, 70%, 50%)` },
                    }))}
                  />
                  <Text style={styles.chartCaption}>Vote Distribution Overview</Text>
                </View>

                {/* Candidate Results Breakdown */}
                {(electionDetails?.positions || []).map((pos: any, index: number) => (
                  <View key={index} style={styles.resultRow}>
                    <View style={styles.trophyBox}>
                      <Ionicons name="ribbon" size={24} color={UNIVERSITY_RED} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.posLabel}>{pos.name}</Text>
                      <Text style={styles.winnerName}>{pos.winner_name || "Results Pending"}</Text>
                      <Text style={styles.voteSub}>{pos.total_votes || 0} Total Votes</Text>
                    </View>
                  </View>
                ))}
                
                <TouchableOpacity style={styles.closeFullButton} onPress={closeModal}>
                   <Text style={styles.closeFullButtonText}>Close Records</Text>
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
  container: { flex: 1, backgroundColor: "#fff" },
  navbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: "#eee" },
  backButton: { padding: 8 },
  navTitle: { fontSize: 18, fontWeight: "800", color: UNIVERSITY_RED, textTransform: "uppercase" },
  content: { padding: 20 },
  subtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 25, lineHeight: 20 },
  header: { fontSize: 22, fontWeight: "800", color: UNIVERSITY_RED, marginBottom: 15 },
  
  toastContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99999, alignItems: 'center' },
  toastContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, gap: 8, elevation: 10, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 5 },
  toastText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  electionCard: { padding: 18, marginVertical: 8, borderWidth: 1.5, borderColor: "#eee", borderRadius: 15, backgroundColor: "#fff", elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 16, fontWeight: "800", color: "#333", marginBottom: 4 },
  dateText: { fontSize: 12, color: "#888" },
  closedBadge: { backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#DDD' },
  closedText: { fontSize: 10, fontWeight: '800', color: '#999' },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLink: { fontSize: 13, fontWeight: '700', color: '#444' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyIconBox: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F9F9F9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#333', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 25 },
  retryBtn: { paddingVertical: 12, paddingHorizontal: 25, borderRadius: 10, borderWidth: 1.5, borderColor: UNIVERSITY_RED },
  retryText: { color: UNIVERSITY_RED, fontWeight: '800', textTransform: 'uppercase', fontSize: 12 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: "900", color: UNIVERSITY_RED, flex: 1 },
  modalDate: { fontSize: 13, color: '#666', fontWeight: '700', textTransform: 'uppercase', marginBottom: 20 },
  
  chartWrapper: { alignItems: 'center', marginBottom: 25, padding: 15, backgroundColor: '#FBFBFB', borderRadius: 20, borderWidth: 1, borderColor: '#F0F0F0' },
  chartCaption: { fontSize: 10, fontWeight: '800', color: '#AAA', textTransform: 'uppercase', marginTop: 10 },
  
  resultRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, backgroundColor: '#FFF9F9', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#FFEAEA' },
  trophyBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 15, elevation: 1 },
  posLabel: { fontSize: 11, fontWeight: "800", color: "#999", textTransform: 'uppercase' },
  winnerName: { fontSize: 16, fontWeight: "800", color: UNIVERSITY_RED },
  voteSub: { fontSize: 12, color: "#666", marginTop: 2 },
  
  closeFullButton: { backgroundColor: "#333", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 20, marginBottom: 30 },
  closeFullButtonText: { color: "#fff", fontWeight: "800", textTransform: "uppercase" },
});