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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// API Hooks
import { useGetAllPositionsQuery } from "@/src/store/Apis/Positions.Api";
import { useGetAllElectionsQuery } from "@/src/store/Apis/Election.Api";
import { 
  useCreateApplicationMutation, 
  useGetApplicationsByStudentQuery 
} from "@/src/store/Apis/Applications.Api"; 

const UNIVERSITY_RED = "#D32F2F";
const DARK_NAVY = "#D32F2F";
const BG_COLOR = "#F8F9FA";
const DEFAULT_PHOTO = "https://picsum.photos/200";

export default function ApplyCandidateScreen() {
  const navigation = useNavigation();
  
  // Auth State
  const [authState, setAuthState] = useState({
    userId: "",
    name: "",
    school: "",
    regNo: "",
    token: ""
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Form State
  const [form, setForm] = useState({
    election_id: "",
    position_id: "",
    manifesto: "",
    school: "", 
    photo_url: "",
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
        console.error("Error loading auth:", error);
      } finally {
        setIsAuthLoading(false);
      }
    };
    getStoredAuthData();
  }, []);

  // API Queries
  const { data: electionData, isLoading: loadingElections } = useGetAllElectionsQuery();
  const { data: positionData, isLoading: loadingPositions } = useGetAllPositionsQuery();
  const { data: existingApp, isLoading: loadingCheck } = useGetApplicationsByStudentQuery();
  const [createApplication, { isLoading: isSubmitting }] = useCreateApplicationMutation();

  // Logic: Check if user already applied for the selected election
  const hasAlreadyApplied = useMemo(() => {
    if (!form.election_id || !existingApp) return false;
    // backend returns a single application object for 'me'
    return existingApp.election_id === form.election_id;
  }, [form.election_id, existingApp]);

  const activeElections = useMemo(() => {
    return electionData?.elections?.filter(e => e.status === "ongoing" || e.status === "upcoming") || [];
  }, [electionData]);

  const handleSubmit = async () => {
    if (hasAlreadyApplied) {
      return Alert.alert("Already Applied", "You have already submitted an application for this election.");
    }

    if (!form.election_id || !form.position_id || !form.manifesto || !form.school) {
      return Alert.alert("Required Fields", "Please complete all sections.");
    }

    try {
      const payload = {
        student_id: authState.userId, 
        position_id: form.position_id,
        manifesto: form.manifesto,
        photo_url: form.photo_url || DEFAULT_PHOTO,
        school: form.school.trim(), 
        election_id: form.election_id,
      };

      await createApplication(payload).unwrap();

      Alert.alert("Success", "Application Submitted Successfully!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      const errorMessage = err?.data?.error || err?.data?.message || "Failed to submit.";
      Alert.alert("Submission Failed", errorMessage);
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={DARK_NAVY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Position Application</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* USER DETAILS SECTION */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <MaterialCommunityIcons name="account-circle" size={40} color={DARK_NAVY} />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.profileName}>{authState.name}</Text>
                <Text style={styles.profileSub}>{authState.regNo || authState.userId.slice(0, 10)}</Text>
              </View>
            </View>
            <View style={styles.profileDivider} />
            <View style={styles.profileRow}>
              <View>
                <Text style={styles.profileLabel}>PRIMARY SCHOOL</Text>
                <Text style={styles.profileValue}>{authState.school}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>ACTIVE VOTER</Text>
              </View>
            </View>
          </View>

          {/* 1. Election Selection */}
          <Text style={styles.inputLabel}>Choose Election</Text>
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

          {/* DUPLICATE WARNING */}
          {hasAlreadyApplied && (
            <View style={styles.warningBox}>
              <MaterialCommunityIcons name="alert-circle" size={20} color="#B71C1C" />
              <Text style={styles.warningText}>You already have an application for this election.</Text>
            </View>
          )}

          {/* 2. Position Selection */}
          <Text style={styles.inputLabel}>Target Position</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {loadingPositions ? <ActivityIndicator color={UNIVERSITY_RED} /> : (
              positionData?.positions?.map((p) => (
                <TouchableOpacity 
                  key={p.id} 
                  disabled={hasAlreadyApplied}
                  style={[
                    styles.posCard, 
                    form.position_id === p.id && styles.posCardActive,
                    hasAlreadyApplied && { opacity: 0.5 }
                  ]}
                  onPress={() => setForm({...form, position_id: p.id})}
                >
                  <MaterialCommunityIcons 
                    name={p.tier === "university" ? "bank" : "school"} 
                    size={24} 
                    color={form.position_id === p.id ? "#FFF" : DARK_NAVY} 
                  />
                  <Text style={[styles.posText, form.position_id === p.id && styles.posTextActive]}>{p.name}</Text>
                  <Text style={[styles.tierLabel, form.position_id === p.id && {color: '#EEE'}]}>{p.tier}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* 3. Filing School */}
          <Text style={styles.inputLabel}>Filing School</Text>
          <TextInput 
            style={[styles.input, hasAlreadyApplied && styles.disabledInput]} 
            editable={!hasAlreadyApplied}
            value={form.school} 
            onChangeText={(v) => setForm({...form, school: v})}
            placeholder="e.g. Science"
          />

          {/* 4. Photo URL */}
          <Text style={[styles.inputLabel, { marginTop: 20 }]}>Photo URL</Text>
          <View style={styles.urlInputRow}>
            <TextInput 
              style={[styles.input, { flex: 1 }, hasAlreadyApplied && styles.disabledInput]} 
              editable={!hasAlreadyApplied}
              placeholder="Paste Image URL"
              value={form.photo_url}
              onChangeText={(v) => setForm({...form, photo_url: v})}
            />
            <TouchableOpacity 
              style={[styles.defaultBtn, hasAlreadyApplied && { opacity: 0.6 }]} 
              disabled={hasAlreadyApplied}
              onPress={() => setForm({...form, photo_url: DEFAULT_PHOTO})}
            >
              <Text style={styles.defaultBtnText}>Default</Text>
            </TouchableOpacity>
          </View>

          {/* 5. Manifesto */}
          <Text style={styles.inputLabel}>Manifesto</Text>
          <TextInput 
            style={[styles.input, styles.textArea, hasAlreadyApplied && styles.disabledInput]} 
            editable={!hasAlreadyApplied}
            multiline 
            placeholder="Describe your vision..."
            value={form.manifesto}
            onChangeText={(v) => setForm({...form, manifesto: v})}
          />

          {/* 6. Submit Button */}
          <TouchableOpacity 
            style={[
              styles.submitBtn, 
              (isSubmitting || hasAlreadyApplied) && { backgroundColor: '#AAA' }
            ]} 
            onPress={handleSubmit}
            disabled={isSubmitting || hasAlreadyApplied}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>
                  {hasAlreadyApplied ? "APPLICATION SUBMITTED" : "SUBMIT APPLICATION"}
                </Text>
                <MaterialCommunityIcons name="send" size={20} color="#FFF" style={{ marginLeft: 10 }} />
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_COLOR },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#FFF' },
  backBtn: { padding: 8, borderRadius: 12, backgroundColor: '#F5F5F5' },
  headerTitle: { fontSize: 16, fontWeight: '900', color: DARK_NAVY, textTransform: 'uppercase' },
  scrollContent: { padding: 20 },
  
  // Profile Section
  profileCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#E0E0E0', elevation: 2 },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  profileName: { fontSize: 18, fontWeight: '800', color: DARK_NAVY },
  profileSub: { fontSize: 12, color: '#777', fontWeight: '600' },
  profileDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 15 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileLabel: { fontSize: 10, color: '#AAA', fontWeight: '900' },
  profileValue: { fontSize: 14, color: DARK_NAVY, fontWeight: '700' },
  statusBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#1E88E5', fontSize: 10, fontWeight: '900' },

  // Warnings
  warningBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEBEE', padding: 12, borderRadius: 12, marginBottom: 20 },
  warningText: { color: '#B71C1C', fontSize: 12, fontWeight: '700', marginLeft: 8 },

  // Inputs
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#888', marginBottom: 10, textTransform: 'uppercase' },
  pickerContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 25 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEE' },
  chipActive: { backgroundColor: UNIVERSITY_RED, borderColor: UNIVERSITY_RED },
  chipText: { fontSize: 13, color: '#444', fontWeight: '700' },
  chipTextActive: { color: '#FFF' },
  
  horizontalScroll: { marginBottom: 25 },
  posCard: { width: 130, height: 100, backgroundColor: '#FFF', borderRadius: 18, padding: 12, marginRight: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0' },
  posCardActive: { backgroundColor: DARK_NAVY, borderColor: DARK_NAVY },
  posText: { fontSize: 11, fontWeight: '900', color: DARK_NAVY, marginTop: 6, textAlign: 'center' },
  posTextActive: { color: '#FFF' },
  tierLabel: { fontSize: 8, color: '#AAA', textTransform: 'uppercase', marginTop: 2, fontWeight: 'bold' },

  urlInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  defaultBtn: { backgroundColor: DARK_NAVY, paddingHorizontal: 15, height: 50, borderRadius: 12, justifyContent: 'center' },
  defaultBtnText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  
  input: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#F0F0F0', fontSize: 14, color: '#333' },
  disabledInput: { backgroundColor: '#F5F5F5', color: '#999' },
  textArea: { height: 120, textAlignVertical: 'top', marginBottom: 25 },
  
  submitBtn: { backgroundColor: UNIVERSITY_RED, flexDirection: 'row', height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  submitBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
});