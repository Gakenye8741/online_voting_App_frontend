import React, { useState, useCallback, useRef, useEffect } from "react";
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

export interface CandidateApplication {
  id: string;
  student_id: string;
  position_id: string;
  position_name?: string;
  election_id: string;
  election_name?: string;
  manifesto: string;
  photo_url: string;
  documents_url?: string | null; 
  school: string;
  school_dean_status?: "PENDING" | "APPROVED" | "REJECTED";
  accounts_status?: "PENDING" | "APPROVED" | "REJECTED";
  dean_of_students_status?: "PENDING" | "APPROVED" | "REJECTED";
  overall_status?: "PENDING" | "APPROVED" | "REJECTED";
  school_dean_comment?: string | null;
  accounts_comment?: string | null;
  dean_of_students_comment?: string | null;
  school_dean_id?: string;
  accounts_officer_id?: string;
  dean_of_students_id?: string;
  coalition_id?: string;
  coalition_name?: string;
  created_at?: string; 
  updated_at?: string;
}

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

  const { data: application, isLoading, isError, refetch } = useGetApplicationsByStudentQuery();
  const [deleteApplication, { isLoading: isDeleting }] = useDeleteApplicationMutation();

  const { data: positionData, refetch: refetchPosition } = useGetPositionByIdQuery(
    application?.position_id ?? "",
    { skip: !application?.position_id }
  );

  const { data: electionData, refetch: refetchElection } = useGetElectionByIdQuery(
    application?.election_id ?? "",
    { skip: !application?.election_id }
  );

  const [createCoalition, { isLoading: isCreatingCoalition }] = useCreateCoalitionMutation();
  const [joinCoalition, { isLoading: isJoiningCoalition }] = useJoinCoalitionMutation();
  const { data: electionCoalitions } = useGetCoalitionsByElectionQuery(application?.election_id ?? "", {
    skip: !application?.election_id || application?.overall_status !== "APPROVED"
  });

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

  const isPresident = positionData?.position?.name?.toLowerCase().includes("president") && 
                     !positionData?.position?.name?.toLowerCase().includes("vice");

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

  const handleCreateCoalitionSubmit = async () => {
    if (!coalitionName || !coalitionAcronym) {
      Alert.alert("Error", "Please fill in the Coalition Name and Acronym");
      return;
    }
    if (!application) return;
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
    if (!application) return;
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

  const positionName = positionData?.position?.name ?? "Loading...";
  const electionName = electionData?.election?.name ?? "Loading...";
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

  const RenderCoalitionForm = () => (
    <View style={styles.createForm}>
      <Text style={styles.formTitle}>Coalition Info</Text>
      <TextInput style={styles.input} placeholder="Full Name (e.g. Alliance for Progress)" value={coalitionName} onChangeText={setCoalitionName} />
      <TextInput style={styles.input} placeholder="Acronym (max 5 chars)" value={coalitionAcronym} onChangeText={setCoalitionAcronym} maxLength={5} autoCapitalize="characters" />
      <TextInput style={styles.input} placeholder="Official Slogan" value={coalitionSlogan} onChangeText={setCoalitionSlogan} />
      <View style={styles.formButtons}>
         <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreateForm(false)}>
            <Text style={{color: '#666', fontWeight: 'bold'}}>Cancel</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.submitBtn} onPress={handleCreateCoalitionSubmit}>
            {isCreatingCoalition ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{color: '#fff', fontWeight: 'bold'}}>Create</Text>}
         </TouchableOpacity>
      </View>
    </View>
  );

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

      {/* UPDATED NAVBAR WITH LOGO AND CHEVRON */}
      <View style={styles.navbar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backChevron}>
             <Ionicons name="chevron-back" size={26} color={UNIVERSITY_RED} />
          </TouchableOpacity>
          <Image source={require('@/assets/images/Laikipia-logo.png')} style={styles.logo} />
          <View>
            <Text style={styles.headerTitle}>Vetting Terminal</Text>
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
            This terminal provides live status tracking for your candidacy in the {electionName}. Ensure all departments approve your profile before the deadline.
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

        {overallStatus === "APPROVED" && (
          <View style={styles.coalitionSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="handshake" size={24} color={UNIVERSITY_RED} />
              <Text style={styles.sectionTitle}>Coalition Hub</Text>
            </View>

            {application.coalition_id ? (
              <View style={styles.joinedCoalitionBox}>
                <View style={{flex: 1}}>
                    <Text style={styles.joinedLabel}>MEMBER OF:</Text>
                    <Text style={styles.joinedName}>{application.coalition_name || "Assigned Coalition"}</Text>
                    <Text style={styles.joinedSub}>Your candidacy is part of this strategic team.</Text>
                </View>
                <MaterialCommunityIcons name="shield-check" size={30} color="rgba(255,255,255,0.5)" />
              </View>
            ) : isPresident ? (
              <View>
                {!showCreateForm ? (
                  <TouchableOpacity style={styles.primaryActionBtn} onPress={() => setShowCreateForm(true)}>
                    <LinearGradient colors={[UNIVERSITY_RED, "#B71C1C"]} style={styles.btnGradient}>
                      <Ionicons name="add-circle-outline" size={20} color="#fff" style={{marginRight: 8}} />
                      <Text style={styles.btnText}>CREATE COALITION</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : <RenderCoalitionForm /> }
              </View>
            ) : (
              <View>
                <Text style={styles.promptText}>Join a registered coalition to participate in group campaigns.</Text>
                {electionCoalitions?.coalitions?.length === 0 ? (
                  <View style={styles.emptyBox}>
                     <Ionicons name="alert-circle-outline" size={24} color="#AAA" />
                     <Text style={styles.noData}>No coalitions formed yet.</Text>
                  </View>
                ) : (
                  electionCoalitions?.coalitions?.map((c: any) => (
                    <TouchableOpacity key={c.id} style={styles.coalitionJoinItem} onPress={() => handleJoinSubmit(c.id)}>
                      <View style={{flex: 1}}>
                        <Text style={styles.cName}>{c.name} ({c.acronym})</Text>
                        <Text style={styles.cSlogan}>"{c.slogan || "No slogan provided"}"</Text>
                      </View>
                      {isJoiningCoalition ? <ActivityIndicator color={UNIVERSITY_RED} /> : <Ionicons name="chevron-forward" size={20} color={UNIVERSITY_RED} />}
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>
        )}

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

          <TouchableOpacity 
            style={styles.docLink} 
            onPress={() => openDocument(application.photo_url || application.documents_url)}
          >
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
               <Ionicons name="document-attach-outline" size={18} color={UNIVERSITY_RED} />
               <Text style={styles.docLinkText}>Audit Submitted Documents</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={UNIVERSITY_RED} />
          </TouchableOpacity>
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
                          This is to certify that <Text style={{fontWeight: 'bold'}}>{application.student_id}</Text> is duly cleared to contest for the position of <Text style={{fontWeight: 'bold'}}>{positionName}</Text> in the 2026 Student Elections.
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
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: UNIVERSITY_RED, fontWeight: "600" },
  errorText: { fontSize: 16, color: "#666", marginBottom: 20 },
  errorBackBtn: { backgroundColor: UNIVERSITY_RED, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  
  // NAVBAR UPDATED
  navbar: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 16, 
    height: 70, 
    backgroundColor: UNIVERSITY_WHITE, 
    borderBottomWidth: 1, 
    borderBottomColor: "#eee" 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backChevron: { marginRight: 8 },
  logo: { width: 42, height: 42, resizeMode: 'contain', marginRight: 10 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: UNIVERSITY_RED, textTransform: 'uppercase' },
  headerSub: { fontSize: 10, color: '#777', fontWeight: 'bold' },
  refreshBtn: { padding: 5 },

  container: { padding: 16, paddingBottom: 40 },
  header: { fontSize: 24, fontWeight: "900", color: UNIVERSITY_RED, marginBottom: 8 },
  descriptionCard: { backgroundColor: '#F9F9F9', padding: 12, borderRadius: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: UNIVERSITY_RED },
  descriptionText: { color: '#555', fontSize: 13, lineHeight: 18 },
  
  profileSection: { backgroundColor: LIGHT_RED_BG, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#FFEBEE' },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  imageContainer: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 2, borderColor: UNIVERSITY_RED },
  candidatePhoto: { width: '100%', height: '100%' },
  photoPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  headerInfo: { marginLeft: 16, flex: 1 },
  candIdLabel: { fontSize: 10, fontWeight: '800', color: '#999', letterSpacing: 1 },
  candIdValue: { fontSize: 18, fontWeight: '900', color: UNIVERSITY_RED, marginBottom: 8 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  clearanceBanner: { marginBottom: 20, borderRadius: 12, overflow: 'hidden', elevation: 3 },
  clearanceGradient: { padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clearanceInfo: { flexDirection: 'row', alignItems: 'center' },
  clearanceTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },
  clearanceSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },

  coalitionSection: { backgroundColor: LIGHT_RED_BG, borderRadius: 15, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#FFEBEE' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: UNIVERSITY_RED, marginLeft: 10 },
  joinedCoalitionBox: { backgroundColor: UNIVERSITY_RED, padding: 20, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  joinedLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  joinedName: { color: '#fff', fontSize: 22, fontWeight: '900', marginVertical: 4 },
  joinedSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  primaryActionBtn: { borderRadius: 12, overflow: 'hidden' },
  btnGradient: { padding: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  promptText: { fontSize: 13, color: '#666', marginBottom: 15 },
  coalitionJoinItem: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  cName: { fontWeight: '800', fontSize: 15, color: UNIVERSITY_RED },
  cSlogan: { fontSize: 12, color: '#888', fontStyle: 'italic' },
  emptyBox: { alignItems: 'center', padding: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#AAA', borderRadius: 10 },
  
  createForm: { backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#DDD' },
  formTitle: { fontWeight: '800', marginBottom: 10, color: UNIVERSITY_RED },
  input: { borderBottomWidth: 1, borderBottomColor: '#DDD', paddingVertical: 8, marginBottom: 15, fontSize: 14 },
  formButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { padding: 10 },
  submitBtn: { backgroundColor: UNIVERSITY_RED, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  noData: { textAlign: 'center', color: '#AAA', marginTop: 5, fontSize: 13 },
  
  toastContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99999, alignItems: 'center' },
  toastContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, gap: 8 },
  toastText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  
  infoCard: { backgroundColor: UNIVERSITY_WHITE, padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F5F5F5' },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  infoColumn: { flex: 1 },
  infoLabel: { fontWeight: "700", fontSize: 10, color: '#AAA', textTransform: 'uppercase', marginBottom: 4 },
  infoValue: { fontSize: 14, color: '#333', fontWeight: '800' },
  docLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  docLinkText: { color: UNIVERSITY_RED, fontWeight: '700', fontSize: 13, marginLeft: 8 },
  
  manifestoCard: { backgroundColor: UNIVERSITY_WHITE, padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#F5F5F5' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  manifestoLabel: { fontSize: 15, fontWeight: "800", color: UNIVERSITY_RED },
  manifestoText: { fontSize: 14, color: "#555", lineHeight: 22 },
  manifestoFooter: { marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f9f9f9' },
  footerInfoText: { fontSize: 11, color: '#AAA', fontStyle: 'italic' },

  sectionHeaderAlt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  sectionTitleAlt: { fontSize: 18, fontWeight: '800', color: DARK_NAVY },
  pulseContainer: { flexDirection: 'row', alignItems: 'center' },
  pulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: UNIVERSITY_RED, marginRight: 6 },
  liveText: { fontSize: 10, fontWeight: '900', color: UNIVERSITY_RED },

  timelineContainer: { paddingLeft: 10 },
  stepWrapper: { flexDirection: 'row', paddingBottom: 25 },
  verticalLine: { position: 'absolute', left: 12, top: 25, bottom: 0, width: 2, backgroundColor: '#EEE' },
  stepIndicator: { width: 26, alignItems: 'center' },
  statusCircle: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  stepCard: { flex: 1, marginLeft: 15, backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#EEE', borderLeftWidth: 4 },
  stepHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  stepLabel: { fontSize: 14, fontWeight: '800', color: DARK_NAVY },
  miniBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  miniBadgeText: { fontSize: 9, fontWeight: '900' },
  approverText: { fontSize: 11, color: '#777', marginBottom: 8 },
  commentBox: { backgroundColor: '#F9F9F9', padding: 8, borderRadius: 8 },
  stepComment: { fontSize: 12, color: '#444', fontStyle: 'italic' },
  pendingComment: { fontSize: 11, color: '#AAA', fontStyle: 'italic' },

  regulationsBox: { backgroundColor: '#F5F5F5', padding: 15, borderRadius: 12, marginBottom: 20 },
  regTitle: { fontWeight: '800', color: '#444', marginBottom: 10 },
  regItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  regText: { fontSize: 12, color: '#666' },
  readMore: { fontSize: 12, color: UNIVERSITY_RED, fontWeight: '700', marginTop: 8 },

  withdrawBtn: { backgroundColor: UNIVERSITY_RED, height: 55, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  withdrawBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  footerNote: { fontSize: 11, color: '#AAA', textAlign: 'center', paddingHorizontal: 20, lineHeight: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  certCard: { backgroundColor: '#FFF', borderRadius: 20, width: '100%', overflow: 'hidden' },
  certHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  certHeaderText: { fontWeight: '900', color: DARK_NAVY, fontSize: 16 },
  certBody: { padding: 30, alignItems: 'center' },
  uniLogo: { width: 70, height: 70, resizeMode: 'contain', marginBottom: 15 },
  uniName: { fontSize: 18, fontWeight: '900', color: UNIVERSITY_RED },
  certType: { fontSize: 11, fontWeight: '700', color: '#777', marginTop: 5, letterSpacing: 1 },
  certDivider: { width: '80%', height: 1, backgroundColor: '#EEE', marginVertical: 20 },
  certContent: { textAlign: 'center', fontSize: 14, lineHeight: 22, color: '#333' },
  certSignature: { marginTop: 30, alignItems: 'center' },
  sigText: { fontSize: 11, fontWeight: 'bold', color: '#2E7D32' },
  sigDate: { fontSize: 10, color: '#AAA', marginTop: 4 },
  downloadBtn: { backgroundColor: UNIVERSITY_RED, padding: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  downloadBtnText: { color: '#FFF', fontWeight: '800' }
});