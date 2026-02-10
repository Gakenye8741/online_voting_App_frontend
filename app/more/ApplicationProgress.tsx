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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";

import { useGetApplicationsByStudentQuery, useDeleteApplicationMutation } from "@/src/store/Apis/Applications.Api";
import { useGetPositionByIdQuery } from "@/src/store/Apis/Positions.Api";
import { useGetElectionByIdQuery } from "@/src/store/Apis/Election.Api";
import { useGetUserByIdQuery } from "@/src/store/Apis/User.Api";

const UNIVERSITY_RED = "#D32F2F";
const UNIVERSITY_WHITE = "#FFFFFF";

const STATUS_COLOR = {
  PENDING: "#FFA500",
  APPROVED: "#4CAF50",
  REJECTED: "#F44336",
  DEFAULT: "#777",
} as const;

export default function ApplicationProgress() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  
  // Toast Animation State
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
      description:
        "The School Dean reviews your application to ensure it meets academic standards and eligibility requirements.",
    },
    {
      label: "Accounts Officer Approval",
      status: application.accounts_status,
      comment: application.accounts_comment,
      approverName: accountsName,
      role: "Accounts Officer",
      description:
        "The Accounts Officer checks your financial status to confirm all fees are cleared for eligibility.",
    },
    {
      label: "Dean of Students Approval",
      status: application.dean_of_students_status,
      comment: application.dean_of_students_comment,
      approverName: dosName,
      role: "Dean of Students",
      description:
        "The Dean of Students verifies your conduct record and ensures compliance with student leadership guidelines.",
    },
    {
      label: "Final Approval",
      status: overallStatus,
      comment: "",
      approverName: "System",
      role: "Overall Status",
      description:
        "The system aggregates all approvals to determine if you qualify as a candidate.",
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
            stage, view your manifesto, and see the overall status of your submission.
          </Text>
        </View>

        {/* APPLICATION INFO */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Application ID:</Text>
              <Text style={styles.infoValue}>{application.id}</Text>
              <Text style={{ fontSize: 12, color: "#666" }}>
                Unique identifier for your application submission.
              </Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Position:</Text>
              <Text style={styles.infoValue}>{positionName}</Text>
              <Text style={{ fontSize: 12, color: "#666" }}>
                The student leadership position you have applied for.
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Election:</Text>
              <Text style={styles.infoValue}>{electionName}</Text>
              <Text style={{ fontSize: 12, color: "#666" }}>
                Name of the election in which you are participating.
              </Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Election Period:</Text>
              <Text style={styles.infoValue}>{electionPeriod}</Text>
              <Text style={{ fontSize: 12, color: "#666" }}>
                The official dates when the election takes place.
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>School:</Text>
              <Text style={styles.infoValue}>{application.school}</Text>
              <Text style={{ fontSize: 12, color: "#666" }}>
                The school or faculty you belong to.
              </Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Submitted At:</Text>
              <Text style={styles.infoValue}>{submittedAt}</Text>
              <Text style={{ fontSize: 12, color: "#666" }}>
                Date when your application was submitted for processing.
              </Text>
            </View>
          </View>
        </View>

        {/* MANIFESTO */}
        <View style={styles.manifestoCard}>
          <Text style={styles.manifestoLabel}>Your Manifesto</Text>
          <Text style={styles.manifestoText}>{application.manifesto}</Text>
          <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            This is your statement outlining your goals, plans, and commitments if elected.
          </Text>
        </View>

        {/* OVERALL STATUS */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Overall Status:</Text>
          <Text
            style={[
              styles.statusValue,
              { color: STATUS_COLOR[overallStatus as keyof typeof STATUS_COLOR] },
            ]}
          >
            {overallStatus}
          </Text>

          {overallStatus === "APPROVED" && (
            <Text style={styles.successMessage}>
              🎉 Congratulations! You have qualified to be a candidate.
            </Text>
          )}
          {overallStatus === "REJECTED" && (
            <Text style={styles.failureMessage}>❌ Unfortunately, you did not qualify.</Text>
          )}
        </View>

        {/* APPROVAL TIMELINE */}
        <View style={styles.timelineContainer}>
          {steps.map((step, idx) => {
            const color =
              STATUS_COLOR[step.status as keyof typeof STATUS_COLOR] ?? STATUS_COLOR.DEFAULT;

            return (
              <View key={idx} style={styles.stepWrapper}>
                {idx !== 0 && <View style={styles.verticalLine} />}
                <View style={[styles.stepCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
                  <View style={styles.stepHeader}>
                    <View style={[styles.statusCircle, { backgroundColor: color }]} />
                    <Text style={styles.stepLabel}>
                      {step.label} ({step.role})
                    </Text>
                  </View>

                  <Text style={styles.stepStatus}>Status: {step.status ?? "PENDING"}</Text>
                  <Text style={styles.approverId}>Approver: {step.approverName}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>

                  {step.comment && <Text style={styles.stepComment}>💬 {step.comment}</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {/* WITHDRAW BUTTON */}
        <TouchableOpacity 
          style={[styles.withdrawBtn, isDeleting && { opacity: 0.7 }]} 
          onPress={handleCancelApplication}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.withdrawBtnText}>Withdraw Application</Text>
            </>
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
  
  toastContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99999, alignItems: 'center' },
  toastContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, gap: 8, elevation: 10, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 5 },
  toastText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  infoCard: { backgroundColor: UNIVERSITY_WHITE, padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: UNIVERSITY_RED, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  infoColumn: { flex: 1, marginRight: 8 },
  infoLabel: { fontWeight: "600", fontSize: 16, marginBottom: 4 },
  infoValue: { fontSize: 16, color: "#333" },
  manifestoCard: { backgroundColor: UNIVERSITY_WHITE, padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: UNIVERSITY_RED, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  manifestoLabel: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  manifestoText: { fontSize: 14, color: "#333" },
  statusContainer: { marginBottom: 20, padding: 16, backgroundColor: UNIVERSITY_WHITE, borderRadius: 12, borderWidth: 1, borderColor: UNIVERSITY_RED, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statusLabel: { fontSize: 18, fontWeight: "600", marginBottom: 6 },
  statusValue: { fontSize: 18, fontWeight: "bold" },
  successMessage: { marginTop: 8, fontSize: 16, fontWeight: "600", color: "green" },
  failureMessage: { marginTop: 8, fontSize: 16, fontWeight: "600", color: "red" },
  timelineContainer: { marginTop: 16 },
  stepWrapper: { position: "relative", paddingLeft: 20, marginBottom: 20 },
  verticalLine: { position: "absolute", left: 9, top: -20, width: 2, height: "100%", backgroundColor: UNIVERSITY_RED, opacity: 0.2 },
  stepCard: { backgroundColor: UNIVERSITY_WHITE, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: UNIVERSITY_RED, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  stepHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  stepLabel: { fontSize: 16, fontWeight: "600" },
  statusCircle: { width: 14, height: 14, borderRadius: 7, marginRight: 8 },
  stepStatus: { fontSize: 14, fontWeight: "bold", marginBottom: 4 },
  approverId: { fontSize: 14, fontStyle: "italic", color: "#555" },
  stepComment: { marginTop: 4, fontSize: 13, fontStyle: "italic", color: "#555" },
  stepDescription: { marginTop: 4, fontSize: 13, color: "#333" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  noAppText: { fontSize: 18, color: "#888", textAlign: "center" },
  loadingText: { marginTop: 8, fontSize: 16 },
  errorText: { fontSize: 18, color: "red", textAlign: 'center' },
  errorBackBtn: { marginTop: 15, padding: 10, borderWidth: 1, borderColor: UNIVERSITY_RED, borderRadius: 8 },
  descriptionCard: {
    backgroundColor: "#F9F9F9",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: UNIVERSITY_RED,
  },
  descriptionText: {
    fontSize: 14,
    color: UNIVERSITY_RED,
    lineHeight: 20,
    textAlign: "center",
  },
  withdrawBtn: { backgroundColor: UNIVERSITY_RED, padding: 16, borderRadius: 12, alignItems: "center", marginTop: 10, flexDirection: 'row', justifyContent: 'center' },
  withdrawBtnText: { color: "#fff", fontWeight: "800", fontSize: 16, textTransform: "uppercase" },
});