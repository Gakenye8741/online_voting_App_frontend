import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import * as Animatable from "react-native-animatable";

// API Hooks
import { useGetPositionsByElectionQuery } from "@/src/store/Apis/Positions.Api";
import { useGetAllElectionsQuery } from "@/src/store/Apis/Election.Api";
import { 
  useCreateApplicationMutation, 
  useGetApplicationsByStudentQuery 
} from "@/src/store/Apis/Applications.Api"; 

const UNIVERSITY_RED = "#D32F2F";
const DARK_NAVY = "#1A237E";
const BG_COLOR = "#F8F9FA";
const CLEAN_WHITE = "#FFFFFF";

export default function ApplyCandidateScreen() {
  const navigation = useNavigation();
  
  // Cloudinary Config
  const cloud_name = 'dwibg4vvf';
  const preset_key = 'tickets';

  // State
  const [authState, setAuthState] = useState({
    userId: "",
    name: "",
    school: "",
    regNo: "",
    token: ""
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirmModalVisible, setConfirmModalVisible] = useState(false);

  // Form State
  const [form, setForm] = useState({
    election_id: "",
    position_id: "",
    manifesto: "",
    school: "", 
    photo_url: "",
    localFile: null as any,
  });

  // Load Auth from AsyncStorage
  useEffect(() => {
    const getStoredAuthData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        const storedToken = await AsyncStorage.getItem("token");
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setAuthState({
            userId: parsedUser.userId || parsedUser.id || "",
            name: parsedUser.name || "User",
            school: parsedUser.school || "Not Specified",
            regNo: parsedUser.regNo || "",
            token: storedToken || ""
          });
          
          setForm(prev => ({ ...prev, school: parsedUser.school || "" }));
        }
      } catch (error) {
        console.error("DEBUG: Error loading auth:", error);
      } finally {
        setIsAuthLoading(false);
      }
    };
    getStoredAuthData();
  }, []);

  // API Queries & Mutations
  const { 
    data: electionData, 
    isLoading: loadingElections, 
    refetch: refetchElections,
    isFetching: isFetchingElections 
  } = useGetAllElectionsQuery();
  
  // Get Latest Election ID
  const latestElectionId = useMemo(() => {
    if (!electionData?.elections) return "";
    const sorted = [...electionData.elections].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted[0]?.id || "";
  }, [electionData]);

  // Set default election
  useEffect(() => {
    if (latestElectionId && !form.election_id) {
      setForm(prev => ({ ...prev, election_id: latestElectionId }));
    }
  }, [latestElectionId]);

  const { 
    data: positionData, 
    isLoading: loadingPositions, 
    refetch: refetchPositions,
    isFetching: isFetchingPositions
  } = useGetPositionsByElectionQuery(
    form.election_id || latestElectionId, 
    { skip: !form.election_id && !latestElectionId }
  );

  // Fetch student application history to prevent duplicates
  const { data: existingApp, refetch: refetchApps, isFetching: isFetchingApps } = useGetApplicationsByStudentQuery(undefined, {
    skip: !authState.userId 
  });
  const [createApplication, { isLoading: isSubmitting }] = useCreateApplicationMutation();

  // Refresh logic
  const onRefresh = React.useCallback(() => {
    refetchElections();
    refetchPositions();
    refetchApps();
  }, []);

  // COLLISION CHECK
  const hasAlreadyApplied = useMemo(() => {
    if (!form.election_id || !existingApp) return false;
    const apps = Array.isArray(existingApp) ? existingApp : [existingApp];
    return apps.some((app: any) => app.election_id === form.election_id);
  }, [form.election_id, existingApp]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setForm({ 
        ...form, 
        photo_url: result.assets[0].uri,
        localFile: {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'upload.jpg',
        }
      });
    }
  };

  const activeElections = useMemo(() => {
    return electionData?.elections?.filter(e => e.status === "ongoing" || e.status === "upcoming") || [];
  }, [electionData]);

  const handleSubmit = async () => {
    if (hasAlreadyApplied) {
        Alert.alert("Protocol Violation", "Duplicate candidacy detected in the ledger.");
        return;
    }

    setConfirmModalVisible(false);
    
    try {
      setIsUploading(true);
      let finalUrl = form.photo_url;

      if (form.localFile) {
        const cloudFormData = new FormData();
        cloudFormData.append('file', form.localFile as any);
        cloudFormData.append('upload_preset', preset_key);

        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
          cloudFormData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
              setUploadProgress(percent);
            },
          }
        );
        finalUrl = response.data.secure_url;
      }

      const payload = {
        student_id: authState.userId, 
        position_id: form.position_id,
        manifesto: form.manifesto,
        photo_url: finalUrl,
        school: form.school.trim(), 
        election_id: form.election_id,
      };

      await createApplication(payload).unwrap();

      Alert.alert("Registry Updated", "Your candidacy has been broadcast to the election ledger.", [
        { text: "Return Home", onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.data?.error || err?.message || "Internal server error during submission.";
      Alert.alert("Protocol Refused", errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (isAuthLoading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color={UNIVERSITY_RED} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backChevron}>
             <Ionicons name="chevron-back" size={26} color={UNIVERSITY_RED} />
          </TouchableOpacity>
          <Image source={require('@/assets/images/Laikipia-logo.png')} style={styles.logo} />
          <View>
            <Text style={styles.headerTitle}>Apply Position</Text>
            <Text style={styles.headerSub}>ID: {authState.userId.slice(0, 8).toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={isFetchingElections || isFetchingPositions || isFetchingApps} 
              onRefresh={onRefresh} 
              tintColor={UNIVERSITY_RED}
            />
          }
        >
          <Animatable.View animation="fadeInUp" duration={1000} style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <MaterialCommunityIcons name="account-details" size={40} color={DARK_NAVY} />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.profileName}>{authState.name.toUpperCase()}</Text>
                <Text style={styles.profileSub}>{authState.regNo}</Text>
              </View>
            </View>
            <View style={styles.profileDivider} />
            <View style={styles.profileRow}>
              <View>
                <Text style={styles.profileLabel}>PRIMARY SCHOOL</Text>
                <Text style={styles.profileValue}>{authState.school}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>VERIFIED</Text>
              </View>
            </View>
          </Animatable.View>

          {hasAlreadyApplied && (
            <Animatable.View animation="shake" style={styles.warningBox}>
              <MaterialCommunityIcons name="shield-alert" size={20} color="#B71C1C" />
              <Text style={styles.warningText}>Collision detected: Candidacy already exists for this cycle.</Text>
            </Animatable.View>
          )}

          <Text style={styles.inputLabel}>Active Election Registry</Text>
          <View style={styles.pickerContainer}>
            {loadingElections ? <ActivityIndicator color={UNIVERSITY_RED} /> : (
              activeElections.map((e) => (
                <TouchableOpacity 
                  key={e.id} 
                  style={[styles.chip, form.election_id === e.id && styles.chipActive]}
                  onPress={() => setForm({...form, election_id: e.id})}
                >
                  <Text style={[styles.chipText, form.election_id === e.id && styles.chipTextActive]}>{e.name}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          <Text style={styles.inputLabel}>Available Designations</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {loadingPositions ? <ActivityIndicator color={UNIVERSITY_RED} /> : (
              positionData?.positions?.map((p: any) => (
                <TouchableOpacity 
                  key={p.id} 
                  disabled={hasAlreadyApplied}
                  style={[
                    styles.posCard, 
                    form.position_id === p.id && styles.posCardActive,
                    hasAlreadyApplied && { opacity: 0.4, backgroundColor: '#EEE' }
                  ]}
                  onPress={() => setForm({...form, position_id: p.id})}
                >
                  <MaterialCommunityIcons 
                    name={p.tier === "university" ? "seal" : "account-group"} 
                    size={24} 
                    color={form.position_id === p.id ? "#FFF" : DARK_NAVY} 
                  />
                  <Text style={[styles.posText, form.position_id === p.id && styles.posTextActive]}>{p.name}</Text>
                  <Text style={[styles.tierLabel, form.position_id === p.id && {color: '#EEE'}]}>{p.tier}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          <Text style={styles.inputLabel}>Constituency/Department</Text>
          <TextInput 
            style={[styles.input, (hasAlreadyApplied || isUploading) && styles.disabledInput]} 
            editable={!hasAlreadyApplied && !isUploading}
            value={form.school} 
            onChangeText={(v) => setForm({...form, school: v})}
            placeholder="Enter constituency..."
          />

          <Text style={[styles.inputLabel, { marginTop: 20 }]}>Biometric Portrait (ID Photo)</Text>
          <TouchableOpacity 
            style={[styles.imageUploadBox, (hasAlreadyApplied || isUploading) && { opacity: 0.5 }]} 
            onPress={pickImage}
            disabled={hasAlreadyApplied || isUploading}
          >
            {form.photo_url ? (
              <Image source={{ uri: form.photo_url }} style={styles.previewImage} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <MaterialCommunityIcons name="face-recognition" size={30} color={DARK_NAVY} />
                <Text style={styles.uploadPlaceholderText}>UPLOAD BIOMETRIC PHOTO</Text>
              </View>
            )}
            {isUploading && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator color={CLEAN_WHITE} size="large" />
                <Text style={styles.uploadPercentText}>{uploadProgress}% SYNCED</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Policy Manifesto</Text>
          <TextInput 
            style={[styles.input, styles.textArea, (hasAlreadyApplied || isUploading) && styles.disabledInput]} 
            editable={!hasAlreadyApplied && !isUploading}
            multiline 
            placeholder="Input your vision for the student body..."
            value={form.manifesto}
            onChangeText={(v) => setForm({...form, manifesto: v})}
          />

          <TouchableOpacity 
            style={[
              styles.submitBtn, 
              (isSubmitting || hasAlreadyApplied || isUploading || !form.position_id) && { backgroundColor: '#AAA' }
            ]} 
            onPress={() => setConfirmModalVisible(true)}
            disabled={isSubmitting || hasAlreadyApplied || isUploading || !form.position_id}
          >
            {isSubmitting || isUploading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>
                  {hasAlreadyApplied ? "LOCKED" : "INITIALIZE CANDIDACY"}
                </Text>
                <MaterialCommunityIcons name={hasAlreadyApplied ? "lock" : "orbit-variant"} size={20} color="#FFF" style={{ marginLeft: 10 }} />
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={isConfirmModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="shield-lock" size={30} color={UNIVERSITY_RED} />
              <Text style={styles.modalTitle}>Protocol Authentication</Text>
            </View>
            <Text style={styles.modalMessage}>
              You are about to broadcast your candidacy to the secure registry. This action is immutable and will undergo audit by the Electoral Commission.
            </Text>
            <View style={styles.summaryBox}>
                <Text style={styles.summaryText}>POSITION: {positionData?.positions?.find((p:any) => p.id === form.position_id)?.name || "Not Selected"}</Text>
                <Text style={styles.summaryText}>SCHOOL: {form.school}</Text>
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
              <Text style={styles.saveBtnText}>CONFIRM & BROADCAST</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmModalVisible(false)}>
              <Text style={styles.cancelBtnText}>ABORT MISSION</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_COLOR },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE'
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backChevron: { marginRight: 10 },
  logo: { width: 40, height: 40, resizeMode: 'contain', marginRight: 10 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: UNIVERSITY_RED, textTransform: 'uppercase' },
  headerSub: { fontSize: 10, color: '#777', fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  profileCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#E0E0E0', elevation: 2 },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  profileName: { fontSize: 16, fontWeight: '800', color: UNIVERSITY_RED },
  profileSub: { fontSize: 12, color: '#777', fontWeight: '600' },
  profileDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 15 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileLabel: { fontSize: 10, color: '#AAA', fontWeight: '900' },
  profileValue: { fontSize: 13, color: DARK_NAVY, fontWeight: '700' },
  statusBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#2E7D32', fontSize: 10, fontWeight: '900' },
  warningBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEBEE', padding: 12, borderRadius: 12, marginBottom: 20 },
  warningText: { color: '#B71C1C', fontSize: 12, fontWeight: '700', marginLeft: 8 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#888', marginBottom: 10, textTransform: 'uppercase' },
  pickerContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 25 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEE' },
  chipActive: { backgroundColor: UNIVERSITY_RED, borderColor: UNIVERSITY_RED },
  chipText: { fontSize: 12, color: '#444', fontWeight: '700' },
  chipTextActive: { color: '#FFF' },
  horizontalScroll: { marginBottom: 25 },
  posCard: { width: 140, height: 100, backgroundColor: '#FFF', borderRadius: 18, padding: 12, marginRight: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0' },
  posCardActive: { backgroundColor: UNIVERSITY_RED, borderColor: UNIVERSITY_RED },
  posText: { fontSize: 11, fontWeight: '900', color: UNIVERSITY_RED, marginTop: 6, textAlign: 'center' },
  posTextActive: { color: '#FFF' },
  tierLabel: { fontSize: 8, color: '#AAA', textTransform: 'uppercase', marginTop: 2, fontWeight: 'bold' },
  imageUploadBox: { height: 200, width: '100%', backgroundColor: '#FFF', borderRadius: 15, borderStyle: 'dashed', borderWidth: 2, borderColor: '#DDD', overflow: 'hidden', marginBottom: 20 },
  previewImage: { width: '100%', height: '100%' },
  uploadPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  uploadPlaceholderText: { color: '#888', fontWeight: '700', marginTop: 10, fontSize: 10 },
  uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  uploadPercentText: { color: '#FFF', fontSize: 14, fontWeight: '900', marginTop: 10 },
  input: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#F0F0F0', fontSize: 14, color: '#333' },
  disabledInput: { backgroundColor: '#F5F5F5', color: '#999' },
  textArea: { height: 120, textAlignVertical: 'top', marginBottom: 25 },
  submitBtn: { backgroundColor: UNIVERSITY_RED, flexDirection: 'row', height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  submitBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContainer: { backgroundColor: CLEAN_WHITE, borderRadius: 24, padding: 25 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: DARK_NAVY, marginLeft: 10 },
  modalMessage: { color: '#555', fontSize: 14, lineHeight: 20, marginBottom: 20 },
  summaryBox: { backgroundColor: '#F8F9FA', padding: 15, borderRadius: 15, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: UNIVERSITY_RED },
  summaryText: { fontSize: 12, fontWeight: '800', color: DARK_NAVY, marginBottom: 5 },
  saveBtn: { backgroundColor: UNIVERSITY_RED, height: 55, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  saveBtnText: { color: CLEAN_WHITE, fontWeight: '900', fontSize: 14 },
  cancelBtn: { height: 55, justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { color: '#888', fontWeight: '700', fontSize: 13 },
});