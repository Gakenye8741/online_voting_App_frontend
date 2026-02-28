import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";

import { useGetApplicationsByStudentQuery, useDeleteApplicationMutation } from "@/src/store/Apis/Applications.Api";
import { useGetPositionByIdQuery } from "@/src/store/Apis/Positions.Api";
import { useGetElectionByIdQuery } from "@/src/store/Apis/Election.Api";
import { useGetUserByIdQuery } from "@/src/store/Apis/User.Api";

// --- IMPORT COALITION API ---
import { 
  useCreateCoalitionMutation, 
  useJoinCoalitionMutation, 
  useGetCoalitionsByElectionQuery 
} from "@/src/store/Apis/Coalition.Api";

const UNIVERSITY_RED = "#D32F2F";
const UNIVERSITY_WHITE = "#FFFFFF";
const DARK_NAVY = "#1A237E";

const STATUS_COLOR = {
  PENDING: "#FFA500",
  APPROVED: "#4CAF50",
  REJECTED: "#F44336",
  DEFAULT: "#777",
} as const;

export default function ApplicationProgress() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  
  // Coalition UI State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [coalitionName, setCoalitionName] = useState("");
  const [coalitionAcronym, setCoalitionAcronym] = useState("");
  const [coalitionSlogan, setCoalitionSlogan] = useState("");

  const toastY = useRef(new Animated.Value(-100)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // ------------------- APPLICATION -------------------
  const { data, isLoading, isError, refetch } = useGetApplicationsByStudentQuery();
  const [deleteApplication, { isLoading: isDeleting }] = useDeleteApplicationMutation();

  useEffect(() => {
    console.log("Applications Response:", data);
  }, [data]);

  const applicationsArray = Array.isArray(data) ? data : data?.candidates ?? [];
  const application = applicationsArray[0] ?? null;

  // ------------------- POSITION & ELECTION -------------------
  const { data: positionData, refetch: refetchPosition } = useGetPositionByIdQuery(
    application?.position_id ?? "",
    { skip: !application?.position_id }
  );

  const { data: electionData, refetch: refetchElection } = useGetElectionByIdQuery(
    application?.election_id ?? "",
    { skip: !application?.election_id }
  );

  // ------------------- COALITION API HOOKS -------------------
  const [createCoalition, { isLoading: isCreatingCoalition }] = useCreateCoalitionMutation();
  const [joinCoalition, { isLoading: isJoiningCoalition }] = useJoinCoalitionMutation();
  const { data: electionCoalitions } = useGetCoalitionsByElectionQuery(application?.election_id ?? "", {
    skip: !application?.election_id || application?.overall_status !== "APPROVED"
  });

  // ------------------- APPROVERS -------------------
  const { data: deanUser } = useGetUserByIdQuery(application?.school_dean_id ?? "", {
    skip: !application?.school_dean_id,
  });
  const { data: accountsUser } = useGetUserByIdQuery(application?.accounts_officer_id ?? "", {
    skip: !application?.accounts_officer_id,
  });
  const { data: dosUser } = useGetUserByIdQuery(application?.dean_of_students_id ?? "", {
    skip: !application?.dean_of_students_id,
  });

  const deanName = deanUser?.user?.name ?? application?.school_dean_id ?? "Pending";
  const accountsName = accountsUser?.user?.name ?? application?.accounts_officer_id ?? "Pending";
  const dosName = dosUser?.user?.name ?? application?.dean_of_students_id ?? "Pending";

  // ------------------- COALITION HANDLERS -------------------
  const isPresident = positionData?.position?.name?.toLowerCase().includes("president") && 
                     !positionData?.position?.name?.toLowerCase().includes("vice");

  const handleCreateCoalitionSubmit = async () => {
    if (!coalitionName || !coalitionAcronym) {
      Alert.alert("Error", "Please fill in the Coalition Name and Acronym");
      return;
    }
    try {
      await createCoalition({
        creatorCandidateId: application.id,
        coalition: {
          election_id: application.election_id,
          name: coalitionName,
          acronym: coalitionAcronym,
          slogan: coalitionSlogan,
          color_code: UNIVERSITY_RED
        }
      }).unwrap();
      Alert.alert("Success", "Coalition Created Successfully!");
      setShowCreateForm(false);
      refetch();
    } catch (err: any) {
      Alert.alert("Error", err.data?.message || "Failed to create coalition");
    }
  };

  const handleJoinSubmit = async (coalitionId: string) => {
    try {
      await joinCoalition({
        candidate_id: application.id,
        coalition_id: coalitionId
      }).unwrap();
      Alert.alert("Success", "Successfully joined the coalition!");
      refetch();
    } catch (err: any) {
      Alert.alert("Error", err.data?.message || "Failed to join coalition");
    }
  };

  // ------------------- Toast Logic -------------------
  const showToast = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  // ------------------- REFRESH -------------------
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchPosition(), refetchElection()]);
    setRefreshing(false);
    showToast();
  }, [refetch, refetchPosition, refetchElection]);

  // ------------------- CANCEL APPLICATION -------------------
  const handleCancelApplication = () => {
    Alert.alert(
      "Withdraw Application",
      "Are you sure you want to cancel your application? This action cannot be undone.",
      [
        { text: "Keep Application", style: "cancel" },
        { 
          text: "Yes, Withdraw", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteApplication(application.id).unwrap();
              Alert.alert("Success", "Your application has been withdrawn.");
              navigation.goBack();
            } catch (err) {
              Alert.alert("Error", "Failed to withdraw application. Please try again.");
            }
          } 
        },
      ]
    );
  };

  // ------------------- LOADING / ERROR -------------------
  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={UNIVERSITY_RED} />
        <Text style={styles.loadingText}>Loading your application...</Text>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>Error loading your application</Text>
        <TouchableOpacity style={styles.errorBackBtn} onPress={() => navigation.goBack()}>
          <Text style={{ color: UNIVERSITY_RED, fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!application) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.noAppText}>
          You have no submitted applications. Please check your student account or contact support.
        </Text>
        <TouchableOpacity style={styles.errorBackBtn} onPress={() => navigation.goBack()}>
          <Text style={{ color: UNIVERSITY_RED, fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ------------------- DATA -------------------
  const positionName = positionData?.position?.name ?? "Loading...";
  const electionName = electionData?.election?.name ?? "Loading...";
  const overallStatus = application.overall_status ?? "PENDING";
  const submittedAt = application.created_at
    ? new Date(application.created_at).toLocaleDateString()
    : "Unknown";

  const startDate = electionData?.election?.start_date
    ? new Date(electionData.election.start_date).toLocaleDateString()
    : "Unknown";
  const endDate = electionData?.election?.end_date
    ? new Date(electionData.election.end_date).toLocaleDateString()
    : "Unknown";

  const electionPeriod = `${startDate} - ${endDate}`;

  const steps = [
    {
      label: "School Dean Approval",
      status: application.school_dean_status,
      comment: application.school_dean_comment,
      approverName: deanName,
      role: "School Dean",
      description: "The School Dean reviews your application to ensure it meets academic standards.",
    },
    {
      label: "Accounts Officer Approval",
      status: application.accounts_status,
      comment: application.accounts_comment,
      approverName: accountsName,
      role: "Accounts Officer",
      description: "The Accounts Officer checks your financial status for eligibility.",
    },
    {
      label: "Dean of Students Approval",
      status: application.dean_of_students_status,
      comment: application.dean_of_students_comment,
      approverName: dosName,
      role: "Dean of Students",
      description: "Conduct record and compliance verification.",
    },
    {
      label: "Final Approval",
      status: overallStatus,
      comment: "",
      approverName: "System",
      role: "Overall Status",
      description: "Aggregated results of all approval stages.",
    },
  ];

  // ------------------- RENDER -------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* REFRESH TOAST */}
      <Animated.View style={[styles.toastContainer, { opacity: toastOpacity, transform: [{ translateY: toastY }] }]}>
        <LinearGradient colors={[UNIVERSITY_RED, "#B71C1C"]} style={styles.toastContent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Ionicons name="sync-circle" size={18} color="#fff" />
          <Text style={styles.toastText}>Sync Complete</Text>
        </LinearGradient>
      </Animated.View>

      {/* NAVBAR */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBackBtn}>
          <Ionicons name="arrow-back" size={26} color={UNIVERSITY_RED} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Application Status</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[UNIVERSITY_RED]} />
        }
        contentContainerStyle={styles.container}
      >
        <Text style={styles.header}>📝 Application Progress</Text>
        
        {/* PAGE DESCRIPTION */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionText}>
            This page shows the current progress of your application. You can track each approval
            stage, view your manifesto, and manage your coalition.
          </Text>
        </View>

        {/* --- COALITION MANAGEMENT SECTION --- */}
        {overallStatus === "APPROVED" && (
          <View style={styles.coalitionSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="handshake" size={24} color={DARK_NAVY} />
              <Text style={styles.sectionTitle}>Coalition Hub</Text>
            </View>

            {application.coalition_id ? (
              <View style={styles.joinedCoalitionBox}>
                <Text style={styles.joinedLabel}>YOU ARE A MEMBER OF:</Text>
                <Text style={styles.joinedName}>{application.coalition_name || "Official Slate"}</Text>
                <Text style={styles.joinedSub}>Your candidacy is now part of an alliance.</Text>
              </View>
            ) : isPresident ? (
              <View>
                {!showCreateForm ? (
                  <TouchableOpacity style={styles.primaryActionBtn} onPress={() => setShowCreateForm(true)}>
                    <LinearGradient colors={[DARK_NAVY, "#3949AB"]} style={styles.btnGradient}>
                      <Ionicons name="add-circle-outline" size={20} color="#fff" style={{marginRight: 8}} />
                      <Text style={styles.btnText}>CREATE COALITION</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.createForm}>
                    <Text style={styles.formTitle}>New Coalition Details</Text>
                    <TextInput style={styles.input} placeholder="Coalition Name (e.g. Progressive Alliance)" value={coalitionName} onChangeText={setCoalitionName} />
                    <TextInput style={styles.input} placeholder="Acronym (e.g. TPA)" value={coalitionAcronym} onChangeText={setCoalitionAcronym} maxLength={5} />
                    <TextInput style={styles.input} placeholder="Slogan" value={coalitionSlogan} onChangeText={setCoalitionSlogan} />
                    <View style={styles.formButtons}>
                       <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreateForm(false)}>
                          <Text style={{color: '#666', fontWeight: 'bold'}}>Cancel</Text>
                       </TouchableOpacity>
                       <TouchableOpacity style={styles.submitBtn} onPress={handleCreateCoalitionSubmit}>
                          {isCreatingCoalition ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{color: '#fff', fontWeight: 'bold'}}>Create</Text>}
                       </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View>
                <Text style={styles.promptText}>Join an existing coalition to run as part of a team.</Text>
                {electionCoalitions?.coalitions?.length === 0 ? (
                  <Text style={styles.noData}>No coalitions formed yet.</Text>
                ) : (
                  electionCoalitions?.coalitions?.map((c: any) => (
                    <TouchableOpacity key={c.id} style={styles.coalitionJoinItem} onPress={() => handleJoinSubmit(c.id)}>
                      <View>
                        <Text style={styles.cName}>{c.name} ({c.acronym})</Text>
                        <Text style={styles.cSlogan}>{c.slogan}</Text>
                      </View>
                      {isJoiningCoalition ? <ActivityIndicator color={UNIVERSITY_RED} /> : <Ionicons name="chevron-forward" size={20} color={UNIVERSITY_RED} />}
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>
        )}

        {/* APPLICATION INFO */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Position:</Text>
              <Text style={styles.infoValue}>{positionName}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Submitted At:</Text>
              <Text style={styles.infoValue}>{submittedAt}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Election Period:</Text>
              <Text style={styles.infoValue}>{electionPeriod}</Text>
            </View>
          </View>
        </View>

        {/* MANIFESTO */}
        <View style={styles.manifestoCard}>
          <Text style={styles.manifestoLabel}>Your Manifesto</Text>
          <Text style={styles.manifestoText}>{application.manifesto}</Text>
        </View>

        {/* OVERALL STATUS */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Overall Status:</Text>
          <Text style={[styles.statusValue, { color: STATUS_COLOR[overallStatus as keyof typeof STATUS_COLOR] }]}>
            {overallStatus}
          </Text>
          {overallStatus === "APPROVED" && (
            <Text style={styles.successMessage}>🎉 Congratulations! You have qualified as a candidate.</Text>
          )}
        </View>

        {/* APPROVAL TIMELINE */}
        <View style={styles.timelineContainer}>
          {steps.map((step, idx) => {
            const color = STATUS_COLOR[step.status as keyof typeof STATUS_COLOR] ?? STATUS_COLOR.DEFAULT;
            return (
              <View key={idx} style={styles.stepWrapper}>
                {idx !== 0 && <View style={styles.verticalLine} />}
                <View style={[styles.stepCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
                  <View style={styles.stepHeader}>
                    <View style={[styles.statusCircle, { backgroundColor: color }]} />
                    <Text style={styles.stepLabel}>{step.label} ({step.role})</Text>
                  </View>
                  <Text style={styles.stepStatus}>Status: {step.status ?? "PENDING"}</Text>
                  <Text style={styles.approverId}>Approver: {step.approverName}</Text>
                  {step.comment && <Text style={styles.stepComment}>💬 {step.comment}</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {/* WITHDRAW BUTTON */}
        <TouchableOpacity style={[styles.withdrawBtn, isDeleting && { opacity: 0.7 }]} onPress={handleCancelApplication} disabled={isDeleting}>
          {isDeleting ? <ActivityIndicator color="#fff" size="small" /> : (
            <><Ionicons name="trash-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.withdrawBtnText}>Withdraw Application</Text></>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: UNIVERSITY_WHITE },
  navbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: "#eee" },
  navBackBtn: { padding: 8 },
  navTitle: { fontSize: 18, fontWeight: "800", color: UNIVERSITY_RED, textTransform: "uppercase" },
  container: { padding: 16, paddingBottom: 40 },
  header: { fontSize: 26, fontWeight: "bold", color: UNIVERSITY_RED, textAlign: "center", marginBottom: 20 },
  
  // --- COALITION STYLES ---
  coalitionSection: { backgroundColor: '#F8F9FE', borderRadius: 15, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#E0E5F2' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: DARK_NAVY, marginLeft: 10 },
  joinedCoalitionBox: { backgroundColor: DARK_NAVY, padding: 20, borderRadius: 12 },
  joinedLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  joinedName: { color: '#fff', fontSize: 22, fontWeight: '900', marginVertical: 4 },
  joinedSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  primaryActionBtn: { borderRadius: 12, overflow: 'hidden' },
  btnGradient: { padding: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  promptText: { fontSize: 13, color: '#666', marginBottom: 15 },
  coalitionJoinItem: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  cName: { fontWeight: '800', fontSize: 15, color: DARK_NAVY },
  cSlogan: { fontSize: 12, color: '#888', fontStyle: 'italic' },
  createForm: { backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#DDD' },
  formTitle: { fontWeight: '800', marginBottom: 10, color: DARK_NAVY },
  input: { borderBottomWidth: 1, borderBottomColor: '#DDD', paddingVertical: 8, marginBottom: 15, fontSize: 14 },
  formButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { padding: 10 },
  submitBtn: { backgroundColor: DARK_NAVY, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  noData: { textAlign: 'center', color: '#AAA', fontStyle: 'italic' },

  toastContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99999, alignItems: 'center' },
  toastContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, gap: 8, elevation: 10, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 5 },
  toastText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  infoCard: { backgroundColor: UNIVERSITY_WHITE, padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: UNIVERSITY_RED, elevation: 2 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  infoColumn: { flex: 1, marginRight: 8 },
  infoLabel: { fontWeight: "600", fontSize: 14, color: '#666' },
  infoValue: { fontSize: 15, color: "#333", fontWeight: '700' },
  manifestoCard: { backgroundColor: UNIVERSITY_WHITE, padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: UNIVERSITY_RED },
  manifestoLabel: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  manifestoText: { fontSize: 14, color: "#333" },
  statusContainer: { marginBottom: 20, padding: 16, backgroundColor: UNIVERSITY_WHITE, borderRadius: 12, borderWidth: 1, borderColor: UNIVERSITY_RED },
  statusLabel: { fontSize: 18, fontWeight: "600", marginBottom: 6 },
  statusValue: { fontSize: 18, fontWeight: "bold" },
  successMessage: { marginTop: 8, fontSize: 14, fontWeight: "600", color: "green" },
  timelineContainer: { marginTop: 16 },
  stepWrapper: { position: "relative", paddingLeft: 20, marginBottom: 20 },
  verticalLine: { position: "absolute", left: 9, top: -20, width: 2, height: "100%", backgroundColor: UNIVERSITY_RED, opacity: 0.2 },
  stepCard: { backgroundColor: UNIVERSITY_WHITE, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: UNIVERSITY_RED },
  stepHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  stepLabel: { fontSize: 15, fontWeight: "600" },
  statusCircle: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  stepStatus: { fontSize: 14, fontWeight: "bold", marginBottom: 4 },
  approverId: { fontSize: 12, fontStyle: "italic", color: "#555" },
  stepComment: { marginTop: 4, fontSize: 12, fontStyle: "italic", color: "#555" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  noAppText: { fontSize: 16, color: "#888", textAlign: "center" },
  loadingText: { marginTop: 8, fontSize: 16 },
  errorText: { fontSize: 18, color: "red", textAlign: 'center' },
  errorBackBtn: { marginTop: 15, padding: 10, borderWidth: 1, borderColor: UNIVERSITY_RED, borderRadius: 8 },
  descriptionCard: { backgroundColor: "#F9F9F9", padding: 12, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: UNIVERSITY_RED },
  descriptionText: { fontSize: 14, color: UNIVERSITY_RED, textAlign: "center" },
  withdrawBtn: { backgroundColor: UNIVERSITY_RED, padding: 16, borderRadius: 12, alignItems: "center", marginTop: 10, flexDirection: 'row', justifyContent: 'center' },
  withdrawBtnText: { color: "#fff", fontWeight: "800", fontSize: 16, textTransform: "uppercase" },
});