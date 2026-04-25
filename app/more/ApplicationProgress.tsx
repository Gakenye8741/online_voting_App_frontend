import React, { useState, useCallback, useRef, useMemo } from "react";
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
  Image,
  Linking,
  Modal,
  Dimensions,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Entypo } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import * as Animatable from "react-native-animatable";

// --- API IMPORTS ---
import { 
  useGetApplicationsByStudentQuery, 
  useDeleteApplicationMutation 
} from "@/src/store/Apis/Applications.Api";
import { useGetPositionByIdQuery } from "@/src/store/Apis/Positions.Api";
import { useGetElectionByIdQuery } from "@/src/store/Apis/Election.Api";
import { useGetUserByIdQuery } from "@/src/store/Apis/User.Api";
import { 
  useCreateCoalitionMutation, 
  useJoinCoalitionMutation, 
  useGetCoalitionsByElectionQuery 
} from "@/src/store/Apis/Coalition.Api";

// --- CONSTANTS & THEME ---
const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");
const UNIVERSITY_RED = "#D32F2F";
const UNIVERSITY_WHITE = "#FFFFFF";
const LIGHT_RED_BG = "#FFF5F5";
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCertModalVisible, setCertModalVisible] = useState(false);
  
  const [coalitionName, setCoalitionName] = useState("");
  const [coalitionAcronym, setCoalitionAcronym] = useState("");
  const [coalitionSlogan, setCoalitionSlogan] = useState("");

  const toastY = useRef(new Animated.Value(-100)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  // FETCH DATA
  const { data: appsResponse, isLoading, isError, refetch } = useGetApplicationsByStudentQuery();
  const [deleteApplication, { isLoading: isDeleting }] = useDeleteApplicationMutation();

  // EXTRACT SINGLE APPLICATION
  const application = useMemo(() => {
    if (!appsResponse) return null;
    return Array.isArray(appsResponse) ? appsResponse[0] : appsResponse;
  }, [appsResponse]);

  const { data: positionData, refetch: refetchPosition } = useGetPositionByIdQuery(
    application?.position_id ?? "",
    { skip: !application?.position_id }
  );

  const { data: electionData, refetch: refetchElection } = useGetElectionByIdQuery(
    application?.election_id ?? "",
    { skip: !application?.election_id }
  );
  
  const { data: deanUser } = useGetUserByIdQuery(application?.school_dean_id ?? "", {
    skip: !application?.school_dean_id,
  });
  const { data: accountsUser } = useGetUserByIdQuery(application?.accounts_officer_id ?? "", {
    skip: !application?.accounts_officer_id,
  });
  const { data: dosUser } = useGetUserByIdQuery(application?.dean_of_students_id ?? "", {
    skip: !application?.dean_of_students_id,
  });

  const deanName = deanUser?.user?.name ?? "School Dean";
  const accountsName = accountsUser?.user?.name ?? "Accounts Officer";
  const dosName = dosUser?.user?.name ?? "Dean of Students";

  const positionName = positionData?.position?.name ?? "Loading...";
  const electionName = electionData?.election?.name ?? application?.election_name ?? "University Election";

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchPosition(), refetchElection()]);
    setRefreshing(false);
    showToast();
  }, [refetch, refetchPosition, refetchElection]);

  const handleCancelApplication = () => {
    if (!application) return;
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
              Alert.alert("Error", "Failed to withdraw application.");
            }
          } 
        },
      ]
    );
  };

  const openDocument = (url: string | null | undefined) => {
    if (url) {
      Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open document link."));
    } else {
      Alert.alert("Not Found", "No document URL attached to this application.");
    }
  };

  const downloadClearance = async () => {
    const certMessage = `LAIKIPIA UNIVERSITY ELECTORAL BOARD\n\nThis is to certify that ${application?.student_id} has been officially cleared for the position of ${positionName} in the upcoming ${electionName}.\n\nCertificate ID: ${application?.id.split('-')[0].toUpperCase()}\nStatus: APPROVED`;
    try {
      await Share.share({ message: certMessage, title: 'Clearance Certificate' });
    } catch (error) {
      Alert.alert("Error", "Could not process sharing.");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={UNIVERSITY_RED} />
        <Text style={styles.loadingText}>Loading your application...</Text>
      </SafeAreaView>
    );
  }

  if (isError || !application) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>
          {!application ? "No application found for this account." : "Error loading application data."}
        </Text>
        <TouchableOpacity style={styles.errorBackBtn} onPress={() => navigation.goBack()}>
          <Text style={{ color: UNIVERSITY_WHITE, fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const overallStatus = application.overall_status ?? "PENDING";
  const submittedAt = application.created_at
    ? new Date(application.created_at).toLocaleString()
    : "Unknown";

  const steps = [
    {
      label: "School Dean Approval",
      status: application.school_dean_status,
      comment: application.school_dean_comment,
      approverName: deanName,
      icon: "school-outline",
    },
    {
      label: "Accounts Officer Approval",
      status: application.accounts_status,
      comment: application.accounts_comment,
      approverName: accountsName,
      icon: "cash-outline",
    },
    {
      label: "Dean of Students Approval",
      status: application.dean_of_students_status,
      comment: application.dean_of_students_comment,
      approverName: dosName,
      icon: "people-outline",
    },
    {
      label: "Final Status",
      status: overallStatus,
      comment: overallStatus === "APPROVED" ? "Congratulations! You are officially cleared." : "Awaiting final system synchronization.",
      approverName: "University IEB",
      icon: "checkmark-done-circle-outline",
    },
  ];

  const RenderVettingStep = ({ step, idx }: { step: any, idx: number }) => {
    const color = STATUS_COLOR[step.status as keyof typeof STATUS_COLOR] ?? STATUS_COLOR.DEFAULT;
    const isLast = idx === steps.length - 1;
    return (
      <View style={styles.stepWrapper}>
        {!isLast && <View style={styles.verticalLine} />}
        <View style={styles.stepIndicator}>
            <View style={[styles.statusCircle, { backgroundColor: color, borderColor: color + '40', borderWidth: 4 }]}>
                 <Ionicons name={step.icon as any} size={14} color="#fff" />
            </View>
        </View>
        <View style={[styles.stepCard, { borderLeftColor: color }]}>
          <View style={styles.stepHeaderRow}>
            <Text style={styles.stepLabel}>{step.label}</Text>
            <View style={[styles.miniBadge, { backgroundColor: color + '20' }]}>
                <Text style={[styles.miniBadgeText, { color: color }]}>{step.status ?? "PENDING"}</Text>
            </View>
          </View>
          <Text style={styles.approverText}>Reviewer: <Text style={{fontWeight: '700'}}>{step.approverName}</Text></Text>
          {step.comment ? (
            <View style={styles.commentBox}>
                <Text style={styles.stepComment}>"{step.comment}"</Text>
            </View>
          ) : (
            <Text style={styles.pendingComment}>Awaiting review and feedback...</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* SYNC TOAST */}
      <Animated.View style={[styles.toastContainer, { opacity: toastOpacity, transform: [{ translateY: toastY }] }]}>
        <LinearGradient colors={[UNIVERSITY_RED, "#B71C1C"]} style={styles.toastContent}>
          <Ionicons name="sync-circle" size={18} color="#fff" />
          <Text style={styles.toastText}>Sync Complete</Text>
        </LinearGradient>
      </Animated.View>

      {/* NAVBAR */}
      <View style={styles.navbar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backChevron}>
             <Ionicons name="chevron-back" size={26} color={UNIVERSITY_RED} />
          </TouchableOpacity>
          <Image source={require('@/assets/images/Laikipia-logo.png')} style={styles.logo} />
          <View>
            <Text style={styles.headerTitle}>{electionName}</Text>
            <Text style={styles.headerSub}>NODE: {application.id.slice(0, 8).toUpperCase()}</Text>
          </View>
        </View>
        
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="reload-circle-outline" size={24} color={UNIVERSITY_RED} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[UNIVERSITY_RED]} />}
        contentContainerStyle={styles.container}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      >
        <Animatable.Text animation="fadeInLeft" style={styles.header}>Application Details</Animatable.Text>
        
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionText}>
            This terminal provides live status tracking for your candidacy in the <Text style={{fontWeight: 'bold', color: UNIVERSITY_RED}}>{electionName}</Text>. Ensure all departments approve your profile before the deadline.
          </Text>
        </View>

        {overallStatus === "APPROVED" && (
          <TouchableOpacity style={styles.clearanceBanner} onPress={() => setCertModalVisible(true)}>
             <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.clearanceGradient}>
                <View style={styles.clearanceInfo}>
                  <FontAwesome5 name="award" size={24} color="#fff" />
                  <View style={{marginLeft: 15}}>
                    <Text style={styles.clearanceTitle}>OFFICIALLY CLEARED</Text>
                    <Text style={styles.clearanceSub}>Tap to view certificate</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
             </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.profileSection}>
            <View style={styles.profileHeader}>
                <View style={styles.imageContainer}>
                    {application.photo_url ? (
                        <Image source={{ uri: application.photo_url }} style={styles.candidatePhoto} />
                    ) : (
                        <View style={styles.photoPlaceholder}>
                            <Ionicons name="person" size={40} color={UNIVERSITY_RED} />
                        </View>
                    )}
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.candIdLabel}>APPLICATION ID</Text>
                    <Text style={styles.candIdValue}>{application.id.split('-')[0].toUpperCase()}</Text>
                    <View style={[styles.badge, { backgroundColor: STATUS_COLOR[overallStatus as keyof typeof STATUS_COLOR] }]}>
                        <Text style={styles.badgeText}>{overallStatus}</Text>
                    </View>
                </View>
            </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>RUNNING POSITION</Text>
              <Text style={styles.infoValue}>{positionName}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>SCHOOL / FACULTY</Text>
              <Text style={styles.infoValue}>{application.school}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>SUBMISSION DATE</Text>
              <Text style={styles.infoValue}>{submittedAt}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>CANDIDATE TYPE</Text>
              <Text style={styles.infoValue}>Full Delegate</Text>
            </View>
          </View> 
          
          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>ELECTION NAME</Text>
              <Text style={styles.infoValue}>{electionName}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>APPLICATION ID</Text>
              <Text style={styles.infoValue}>{application.id.split('-')[0].toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.manifestoCard}>
          <View style={styles.cardHeader}>
             <Ionicons name="document-text-outline" size={20} color={UNIVERSITY_RED} />
             <Text style={styles.manifestoLabel}>My Manifesto Preview</Text>
          </View>
          <Text style={styles.manifestoText}>{application.manifesto}</Text>
          <View style={styles.manifestoFooter}>
             <Text style={styles.footerInfoText}>This content will be visible to all voters during election day.</Text>
          </View>
        </View>

        <View style={styles.sectionHeaderAlt}>
            <Text style={styles.sectionTitleAlt}>Vetting Roadmap</Text>
            <View style={styles.pulseContainer}>
                <View style={styles.pulse} />
                <Text style={styles.liveText}>LIVE UPDATES</Text>
            </View>
        </View>

        <View style={styles.timelineContainer}>
          {steps.map((step, idx) => <RenderVettingStep key={idx} step={step} idx={idx} />)}
        </View>

        <View style={styles.regulationsBox}>
            <Text style={styles.regTitle}>Electoral Regulations</Text>
            <View style={styles.regItem}>
               <Entypo name="dot-single" size={20} color="#666" />
               <Text style={styles.regText}>All candidates must maintain disciplinary records.</Text>
            </View>
            <View style={styles.regItem}>
               <Entypo name="dot-single" size={20} color="#666" />
               <Text style={styles.regText}>Approval from Accounts signifies fee clearance.</Text>
            </View>
            <TouchableOpacity onPress={() => Linking.openURL('https://laikipia.ac.ke/elections')}>
                <Text style={styles.readMore}>Read Full Constitution</Text>
            </TouchableOpacity>
        </View>

        <TouchableOpacity 
            style={[styles.withdrawBtn, isDeleting && { opacity: 0.7 }]} 
            onPress={handleCancelApplication} 
            disabled={isDeleting}
        >
          {isDeleting ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Ionicons name="trash-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.withdrawBtnText}>Withdraw Application</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.footerNote}>
            Strict Warning: Application withdrawal is irreversible. You will be disqualified from running for any other post in this election cycle once you proceed.
        </Text>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={isCertModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
              <View style={styles.certCard}>
                  <View style={styles.certHeader}>
                      <Text style={styles.certHeaderText}>Official Clearance</Text>
                      <TouchableOpacity onPress={() => setCertModalVisible(false)}>
                          <Ionicons name="close" size={24} color="#333" />
                      </TouchableOpacity>
                  </View>
                  <View style={styles.certBody}>
                      <Image source={require('@/assets/images/Laikipia-logo.png')} style={styles.uniLogo} />
                      <Text style={styles.uniName}>LAIKIPIA UNIVERSITY</Text>
                      <Text style={styles.certType}>ELECTORAL CLEARANCE CERTIFICATE</Text>
                      <View style={styles.certDivider} />
                      <Text style={styles.certContent}>
                          This is to certify that <Text style={{fontWeight: 'bold'}}>{application.student_id}</Text> is duly cleared to contest for the position of <Text style={{fontWeight: 'bold'}}>{positionName}</Text> in the {electionName}.
                      </Text>
                      <View style={styles.certSignature}>
                          <Text style={styles.sigText}>Digitally Verified by IEB System</Text>
                          <Text style={styles.sigDate}>{new Date().toLocaleDateString()}</Text>
                      </View>
                  </View>
                  <TouchableOpacity style={styles.downloadBtn} onPress={downloadClearance}>
                      <Ionicons name="download-outline" size={20} color="#fff" style={{marginRight: 10}} />
                      <Text style={styles.downloadBtnText}>Share/Save Certificate</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: UNIVERSITY_WHITE },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: UNIVERSITY_WHITE },
  loadingText: { marginTop: 15, color: "#666", fontSize: 16, fontWeight: "500" },
  errorText: { color: UNIVERSITY_RED, fontSize: 16, textAlign: "center", paddingHorizontal: 40, marginBottom: 20 },
  errorBackBtn: { backgroundColor: UNIVERSITY_RED, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 10 },
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backChevron: { marginRight: 10 },
  logo: { width: 35, height: 35, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: UNIVERSITY_RED },
  headerSub: { fontSize: 10, color: '#999', fontWeight: 'bold', marginTop: 2 },
  refreshBtn: { padding: 5 },
  container: { padding: 20 },
  header: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 15 },
  descriptionCard: { backgroundColor: LIGHT_RED_BG, padding: 15, borderRadius: 12, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: UNIVERSITY_RED },
  descriptionText: { color: '#555', fontSize: 14, lineHeight: 20 },
  clearanceBanner: { marginBottom: 20, borderRadius: 12, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  clearanceGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  clearanceInfo: { flexDirection: 'row', alignItems: 'center' },
  clearanceTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  clearanceSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  profileSection: { backgroundColor: '#fff', borderRadius: 15, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#f0f0f0' },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  imageContainer: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', backgroundColor: '#f9f9f9', borderWidth: 3, borderColor: UNIVERSITY_RED + '20' },
  candidatePhoto: { width: '100%', height: '100%' },
  photoPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  headerInfo: { marginLeft: 20, flex: 1 },
  candIdLabel: { fontSize: 10, color: '#999', fontWeight: 'bold', marginBottom: 4 },
  candIdValue: { fontSize: 20, fontWeight: '800', color: '#1a1a1a', marginBottom: 8 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  infoCard: { backgroundColor: '#fcfcfc', borderRadius: 15, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#f0f0f0' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  infoColumn: { flex: 1 },
  infoLabel: { fontSize: 10, color: '#999', fontWeight: 'bold', marginBottom: 5 },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#333' },
  docLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: UNIVERSITY_RED + '10', padding: 12, borderRadius: 10, marginTop: 10 },
  docLinkText: { color: UNIVERSITY_RED, fontSize: 13, fontWeight: '700', marginLeft: 10 },
  manifestoCard: { backgroundColor: '#fff', borderRadius: 15, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#f0f0f0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  manifestoLabel: { fontSize: 15, fontWeight: '800', color: '#1a1a1a', marginLeft: 10 },
  manifestoText: { fontSize: 14, color: '#555', lineHeight: 22, fontStyle: 'italic' },
  manifestoFooter: { marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f5f5f5' },
  footerInfoText: { fontSize: 11, color: '#999', textAlign: 'center' },
  sectionHeaderAlt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitleAlt: { fontSize: 18, fontWeight: '800', color: '#1a1a1a' },
  pulseContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  pulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginRight: 8 },
  liveText: { fontSize: 10, fontWeight: 'bold', color: '#666' },
  timelineContainer: { marginBottom: 30 },
  stepWrapper: { flexDirection: 'row', marginBottom: 5 },
  verticalLine: { position: 'absolute', left: 19, top: 40, bottom: 0, width: 2, backgroundColor: '#f0f0f0' },
  stepIndicator: { width: 40, alignItems: 'center' },
  statusCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  stepCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 20, marginLeft: 10, borderWidth: 1, borderColor: '#f0f0f0', borderLeftWidth: 5 },
  stepHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  stepLabel: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  miniBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  miniBadgeText: { fontSize: 9, fontWeight: 'bold' },
  approverText: { fontSize: 12, color: '#777', marginBottom: 10 },
  commentBox: { backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#ddd' },
  stepComment: { fontSize: 13, color: '#444', fontStyle: 'italic' },
  pendingComment: { fontSize: 12, color: '#bbb', fontStyle: 'italic' },
  regulationsBox: { backgroundColor: '#f5f5f5', borderRadius: 15, padding: 20, marginBottom: 25 },
  regTitle: { fontSize: 16, fontWeight: '800', color: '#333', marginBottom: 12 },
  regItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  regText: { fontSize: 13, color: '#666', flex: 1 },
  readMore: { color: UNIVERSITY_RED, fontWeight: '700', fontSize: 13, marginTop: 10, textAlign: 'right' },
  withdrawBtn: { backgroundColor: UNIVERSITY_RED, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, marginBottom: 15 },
  withdrawBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footerNote: { fontSize: 12, color: '#999', textAlign: 'center', lineHeight: 18, paddingHorizontal: 10 },
  toastContainer: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', zIndex: 100 },
  toastContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, elevation: 5 },
  toastText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  certCard: { backgroundColor: '#fff', width: '100%', borderRadius: 20, padding: 25 },
  certHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  certHeaderText: { fontSize: 18, fontWeight: '800', color: '#333' },
  certBody: { alignItems: 'center', borderWidth: 2, borderColor: '#f0f0f0', padding: 20, borderRadius: 15, marginBottom: 20 },
  uniLogo: { width: 60, height: 60, marginBottom: 10 },
  uniName: { fontSize: 16, fontWeight: '800', color: UNIVERSITY_RED, marginBottom: 5 },
  certType: { fontSize: 12, fontWeight: 'bold', color: '#555', letterSpacing: 1, marginBottom: 15 },
  certDivider: { width: '80%', height: 1, backgroundColor: '#eee', marginBottom: 15 },
  certContent: { textAlign: 'center', fontSize: 14, color: '#444', lineHeight: 22, marginBottom: 20 },
  certSignature: { alignItems: 'center', marginTop: 10 },
  sigText: { fontSize: 11, color: '#777', fontWeight: '600' },
  sigDate: { fontSize: 10, color: '#999', marginTop: 4 },
  downloadBtn: { backgroundColor: '#1A237E', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 12 },
  downloadBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});