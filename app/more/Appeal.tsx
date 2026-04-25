import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  Ionicons, 
  Feather,
  Octicons
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import * as Animatable from "react-native-animatable";

// --- API HOOKS ---
import { useGetApplicationsByStudentQuery } from "@/src/store/Apis/Applications.Api";
import { useSubmitAppealMutation, useGetAllAppealsQuery } from "@/src/store/Apis/Appeal.Api";

const UNIVERSITY_RED = "#D32F2F";
const DARK_NAVY = "#1A237E";
const WARNING_GOLD = "#FFA500";

export default function FinalApplicationTerminal() {
  const navigation = useNavigation();
  
  // Cloudinary Config
  const cloud_name = 'dwibg4vvf';
  const preset_key = 'tickets';
  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`;

  // --- STATE ---
  const [refreshing, setRefreshing] = useState(false);
  const [isAppealing, setIsAppealing] = useState(false);
  const [appealReason, setAppealReason] = useState("");
  const [supportingDoc, setSupportingDoc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [authState, setAuthState] = useState({ token: "" });

  // --- DATA FETCHING ---
  const { data: application, isLoading: loadingApp, refetch: refetchApp } = useGetApplicationsByStudentQuery();
  const { data: appealsData, refetch: refetchAppeals } = useGetAllAppealsQuery();
  const [submitAppeal, { isLoading: isSubmitting }] = useSubmitAppealMutation();

  useEffect(() => {
    const loadAuth = async () => {
      const storedToken = await AsyncStorage.getItem("token");
      if (storedToken) setAuthState({ token: storedToken });
    };
    loadAuth();
  }, []);

  const rejectionDetails = useMemo(() => {
    if (!application) return null;
    if (application.school_dean_status === "REJECTED") return { stage: "SCHOOL_DEAN", label: "School Dean", comment: application.school_dean_comment };
    if (application.accounts_status === "REJECTED") return { stage: "ACCOUNTS", label: "Accounts Office", comment: application.accounts_comment };
    if (application.dean_of_students_status === "REJECTED") return { stage: "DEAN_OF_STUDENTS", label: "Dean of Students", comment: application.dean_of_students_comment };
    return { stage: "DEAN_OF_STUDENTS", label: "Review Board", comment: "Application requires clarification." };
  }, [application]);

  const activeAppeal = useMemo(() => {
    return appealsData?.appeals?.find(a => a.application_id === application?.id);
  }, [appealsData, application]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchApp(), refetchAppeals()]);
    setRefreshing(false);
  }, []);

  const handleUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', { uri: result.assets[0].uri, type: 'image/jpeg', name: 'appeal_evidence.jpg' } as any);
      formData.append('upload_preset', preset_key);

      try {
        const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
        const data = await response.json();
        setSupportingDoc(data.secure_url);
        Alert.alert("Success", "Evidence uploaded to Cloudinary.");
      } catch (err) {
        Alert.alert("Error", "Cloudinary upload failed.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const submitFinalAppeal = async () => {
    if (!appealReason.trim()) return Alert.alert("Required", "Please explain your appeal case.");
    try {
      await submitAppeal({
        application_id: application!.id,
        rejected_stage: rejectionDetails?.stage || "DEAN_OF_STUDENTS",
        reason: appealReason,
        supporting_document_url: supportingDoc || "",
      }).unwrap();
      
      Alert.alert("Case Logged", "Your appeal has been submitted successfully.");
      setIsAppealing(false);
      refetchAppeals();
    } catch (e) {
      Alert.alert("Error", "Failed to submit appeal.");
    }
  };

  if (loadingApp) return <ActivityIndicator style={{flex:1}} color={UNIVERSITY_RED} size="large" />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header with Logo */}
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color={UNIVERSITY_RED} />
          </TouchableOpacity>
          <Image 
            source={require('@/assets/images/Laikipia-logo.png')} 
            style={styles.headerLogo} 
          />
          <Text style={styles.navTitle}>Appeal Page</Text>
        </View>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="sync" size={22} color={UNIVERSITY_RED} />
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={{ padding: 20 }}>
        
        {/* ACTION: APPROVED */}
        {application?.overall_status === "APPROVED" && (
          <Animatable.View animation="bounceIn" style={styles.approvedCard}>
            <LinearGradient colors={[UNIVERSITY_RED, "#757575"]} style={styles.gradientHeader}>
              <Ionicons name="checkmark-done-circle" size={56} color="#fff" />
              <Text style={styles.approvedTitle}>CANDIDACY APPROVED</Text>
            </LinearGradient>
            <View style={styles.approvedContent}>
              <Text style={styles.actionNeededText}>✓ NO ACTION NEEDED</Text>
              <Text style={styles.approvedSub}>
                Your application has passed all vetting stages. No further action is required from you at this time.
              </Text>
            </View>
          </Animatable.View>
        )}

        {/* ACTION: REJECTED */}
        {application?.overall_status === "REJECTED" && (
          <View>
            <View style={styles.rejectionBox}>
              <View style={styles.row}>
                <Octicons name="stop" size={24} color={UNIVERSITY_RED} />
                <Text style={styles.rejectionLabel}>REJECTED AT {rejectionDetails?.label.toUpperCase()}</Text>
              </View>
              <Text style={styles.commentTxt}>"{rejectionDetails?.comment || "Documentation failure."}"</Text>
            </View>

            {activeAppeal ? (
              <View style={styles.pendingBox}>
                <Feather name="activity" size={20} color={WARNING_GOLD} />
                <Text style={styles.pendingText}>Active Appeal: Currently being reviewed.</Text>
              </View>
            ) : (
              <View>
                {!isAppealing ? (
                  <TouchableOpacity style={styles.appealBtn} onPress={() => setIsAppealing(true)}>
                    <Text style={styles.appealBtnTxt}>Apply for an Appeal</Text>
                  </TouchableOpacity>
                ) : (
                  <Animatable.View animation="fadeInUp" style={styles.appealForm}>
                    <Text style={styles.formLabel}>Justification / Reason</Text>
                    <TextInput 
                      style={styles.textArea}
                      placeholder="Type your justification here..."
                      multiline
                      value={appealReason}
                      onChangeText={setAppealReason}
                    />

                    <Text style={styles.formLabel}>Supporting Evidence</Text>
                    <TouchableOpacity style={styles.uploadArea} onPress={handleUpload} disabled={isUploading}>
                      {isUploading ? <ActivityIndicator color={UNIVERSITY_RED} /> : (
                        supportingDoc ? (
                          <View style={styles.imagePreviewContainer}>
                            <Image source={{ uri: supportingDoc }} style={styles.previewImage} />
                            <View style={styles.changeOverlay}>
                               <Text style={styles.changeText}>TAP TO CHANGE IMAGE</Text>
                            </View>
                          </View>
                        ) : (
                          <View style={styles.uploadPlaceholder}>
                            <Feather name="upload-cloud" size={32} color="#ccc" />
                            <Text style={styles.uploadHint}>Upload Clearance Certificate</Text>
                          </View>
                        )
                      )}
                    </TouchableOpacity>

                    <View style={styles.actionRow}>
                      <TouchableOpacity onPress={() => setIsAppealing(false)}><Text style={styles.cancelTxt}>Back</Text></TouchableOpacity>
                      <TouchableOpacity style={styles.submitBtn} onPress={submitFinalAppeal} disabled={isSubmitting}>
                        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnTxt}>Submit Appeal</Text>}
                      </TouchableOpacity>
                    </View>
                  </Animatable.View>
                )}
              </View>
            )}
          </View>
        )}

        {/* POSITION INFO */}
        <View style={styles.infoCard}>
          <View style={styles.dateContainer}>
            <Feather name="calendar" size={14} color="#888" style={{ marginRight: 6 }} />
            <Text style={styles.dateLabel}>Applied: </Text>
            <Text style={styles.dateValue}>
              {application?.updated_at 
                ? new Date(application.updated_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : "Pending..."}
            </Text>
          </View>
          <Text style={styles.infoSub}>School: {application?.school}</Text>
          <View style={[styles.badge, { backgroundColor: UNIVERSITY_RED }]}>
            <Text style={styles.badgeTxt}>Overall Status: {application?.overall_status || "PENDING"}</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  navLeft: { flexDirection: 'row', alignItems: 'center' },
  headerLogo: { width: 32, height: 32, marginLeft: 10, marginRight: 10, borderRadius: 6 },
  navTitle: { fontSize: 17, fontWeight: '800', color: '#333' },
  
  approvedCard: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', elevation: 6, marginBottom: 20 },
  gradientHeader: { padding: 40, alignItems: 'center' },
  approvedTitle: { color: '#fff', fontWeight: '900', fontSize: 20, marginTop: 15, letterSpacing: 1 },
  approvedContent: { padding: 25, alignItems: 'center' },
  actionNeededText: { color: UNIVERSITY_RED, fontWeight: '900', fontSize: 16, marginBottom: 12 },
  approvedSub: { textAlign: 'center', color: '#555', lineHeight: 22, fontSize: 14 },

  rejectionBox: { backgroundColor: '#FFF1F1', padding: 20, borderRadius: 18, borderLeftWidth: 6, borderLeftColor: UNIVERSITY_RED, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  rejectionLabel: { color: UNIVERSITY_RED, fontWeight: '900', marginLeft: 10, fontSize: 14 },
  commentTxt: { fontStyle: 'italic', color: '#444', lineHeight: 20 },

  pendingBox: { flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: '#FFF9C4', borderRadius: 15 },
  pendingText: { marginLeft: 10, fontWeight: '800', color: '#856404', fontSize: 13 },

  appealBtn: { backgroundColor: DARK_NAVY, padding: 20, borderRadius: 15, alignItems: 'center' },
  appealBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },

  appealForm: { backgroundColor: '#fff', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#eee', elevation: 2 },
  formLabel: { fontSize: 11, fontWeight: '900', color: '#999', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  textArea: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 15, height: 110, textAlignVertical: 'top', marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
  
  uploadArea: { height: 200, borderRadius: 15, borderWidth: 2, borderStyle: 'dashed', borderColor: '#ddd', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 25 },
  imagePreviewContainer: { width: '100%', height: '100%' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  changeOverlay: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, alignItems: 'center' },
  changeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  uploadPlaceholder: { alignItems: 'center' },
  uploadHint: { fontSize: 12, color: '#999', marginTop: 12, fontWeight: '600' },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  submitBtn: { backgroundColor: UNIVERSITY_RED, paddingHorizontal: 30, paddingVertical: 14, borderRadius: 12, elevation: 4 },
  submitBtnTxt: { color: '#fff', fontWeight: '900' },
  cancelTxt: { color: '#bbb', fontWeight: '800' },

  infoCard: { backgroundColor: '#fff', padding: 25, borderRadius: 20, marginTop: 20, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  infoSub: { color: '#777', marginBottom: 15, fontWeight: '600' },
  badge: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 25 },
  badgeTxt: { color: '#fff', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  dateLabel: { fontSize: 12, fontWeight: '600', color: '#666' },
  dateValue: { fontSize: 12, fontWeight: '700', color: '#333' },
});