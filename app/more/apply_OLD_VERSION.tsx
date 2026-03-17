import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
  Animated,
  Platform,
  StatusBar,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { useGetAllElectionsQuery } from "@/src/store/Apis/Election.Api";
import { useGetAllPositionsQuery } from "@/src/store/Apis/Positions.Api";
import { useCreateApplicationMutation, useGetApplicationsByStudentQuery } from "@/src/store/Apis/Applications.Api";

// ---------- TYPES FOR NAVIGATION ----------
type RootStackParamList = {
  ApplicationPage: undefined;
  ApplicationProgress: { application: any };
};

type ApplicationPageNavigationProp = NavigationProp<RootStackParamList, "ApplicationPage">;

// ---------- CONSTANTS ----------
const SCHOOLS = [
  "Science",
  "Education",
  "Business",
  "Humanities and Developmental_Studies",
  "TVET",
];

const STATUS_COLOR = {
  PENDING: "#FFA500",
  APPROVED: "#4CAF50",
  REJECTED: "#F44336",
  DEFAULT: "#000",
} as const;

// ---------- COMPONENT ----------
export default function ApplicationPage() {
  const scrollRef = useRef<ScrollView>(null);
  const navigation = useNavigation<ApplicationPageNavigationProp>();

  const [selectedElectionId, setSelectedElectionId] = useState<string>("");
  const [selectedPositionId, setSelectedPositionId] = useState<string>("");
  const [manifesto, setManifesto] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<string>(SCHOOLS[0]);
  const [studentId, setStudentId] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  // Toast Animation State
  const toastY = useRef(new Animated.Value(-100)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const { data: electionsData } = useGetAllElectionsQuery();
  const { data: positionsData } = useGetAllPositionsQuery();
  const [createApplication, { isLoading }] = useCreateApplicationMutation();
  const { data: myApplications, refetch: refetchApplications } = useGetApplicationsByStudentQuery();

  // ---------- Toast Logic ----------
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

  // ---------- Fetch user ----------
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem("user");
        if (!userStr) return Alert.alert("Error", "User not found in storage");
        const user = JSON.parse(userStr);
        setStudentId(user.id);
        setSelectedSchool(user.school || SCHOOLS[0]);
      } catch (err) {
        console.log("Error fetching user:", err);
        Alert.alert("Error", "Failed to fetch user info");
      }
    };
    fetchUser();
  }, []);

  // ---------- Filter positions ----------
  const filteredPositions = useMemo(() => {
    if (!selectedElectionId || !positionsData?.positions) return [];
    return positionsData.positions.filter(
      (pos) => pos.election_id.toString() === selectedElectionId.toString()
    );
  }, [selectedElectionId, positionsData]);

  // ---------- Group by tier ----------
  const grouped = useMemo(
    () => ({
      university: filteredPositions.filter((p) => p.tier === "university"),
      school: filteredPositions.filter((p) => p.tier === "school"),
    }),
    [filteredPositions]
  );

  // ---------- Pull-to-refresh ----------
  const onRefresh = async () => {
    setRefreshing(true);
    await refetchApplications();
    showToast();
    setRefreshing(false);
  };

  // ---------- Submit application ----------
  const handleSubmit = async () => {
    if (!selectedElectionId || !selectedPositionId || !manifesto || !selectedSchool) {
      return Alert.alert("Error", "Please fill all fields");
    }

    if (!studentId) return Alert.alert("Error", "User ID not found");

    const payload = {
      student_id: studentId,
      position_id: selectedPositionId,
      manifesto,
      documents_url: [
        "https://example.com/doc1.pdf",
        "https://example.com/doc2.pdf",
      ],
      school: selectedSchool,
      election_id: selectedElectionId,
    };

    try {
      const res = await createApplication(payload).unwrap();
      Alert.alert("Success", res.message || "Application submitted!");
      setSelectedElectionId("");
      setSelectedPositionId("");
      setManifesto("");
      setSelectedSchool(SCHOOLS[0]);
      refetchApplications();
    } catch (err: any) {
      if (err.data?.error?.includes("already applied")) {
        Alert.alert(
          "Duplicate Application",
          "You have already applied for this position. Please wait for approval."
        );
      } else {
        Alert.alert("Error", err.data?.message || "Something went wrong");
      }
    }
  };

  // ---------- Render Approval Stepper ----------
  const renderApprovalStepper = (app: any) => {
    const steps = [
      { label: "School Dean", status: app.school_dean_status, comment: app.school_dean_comment },
      { label: "Accounts Officer", status: app.accounts_status, comment: app.accounts_comment },
      { label: "Dean of Students", status: app.dean_of_students_status, comment: app.dean_of_students_comment },
      { label: "Overall", status: app.overall_status, comment: "" },
    ];

    return (
      <View style={styles.stepperContainer}>
        {steps.map((step, idx) => (
          <View key={idx} style={styles.stepContainer}>
            <View
              style={[
                styles.stepCircle,
                { backgroundColor: STATUS_COLOR[(step.status as keyof typeof STATUS_COLOR) || "DEFAULT"] },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.stepLabel}>{step.label}</Text>
              {step.comment ? <Text style={styles.stepComment}>{step.comment}</Text> : null}
            </View>
            {idx < steps.length - 1 && <View style={styles.stepLine} />}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar barStyle="dark-content" />

      {/* REFRESH TOAST */}
      <Animated.View style={[styles.toastContainer, { opacity: toastOpacity, transform: [{ translateY: toastY }] }]}>
        <LinearGradient colors={["#D32F2F", "#B71C1C"]} style={styles.toastContent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Ionicons name="cloud-done" size={18} color="#fff" />
          <Text style={styles.toastText}>Applications Updated</Text>
        </LinearGradient>
      </Animated.View>

      {/* HEADER WITH BACK ARROW */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="#D32F2F" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Application Portal</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        ref={scrollRef}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#D32F2F"]} />}
      >
        {/* <Text style={styles.title}>📝 Application Portal</Text> */}
        <Text style={styles.subtitle}>
          Welcome! Submit your application for the upcoming elections and track your progress.
        </Text>

        <Text style={styles.header}>Candidate Application</Text>

        {/* Election Picker */}
        <Text style={styles.label}>Choose Election</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedElectionId}
            onValueChange={(value) => {
              setSelectedElectionId(value);
              setSelectedPositionId("");
            }}
          >
            <Picker.Item label="-- Select Election --" value="" />
            {electionsData?.elections?.map((election) => (
              <Picker.Item key={election.id} label={election.name} value={election.id} />
            ))}
          </Picker>
        </View>

        {/* Position Selection */}
        <Text style={styles.label}>Choose Position</Text>
        {filteredPositions.length === 0 ? (
          <Text style={styles.noData}>No positions found for this election.</Text>
        ) : (
          <>
            {grouped.university.length > 0 && (
              <>
                <Text style={styles.groupTitle}>University Level</Text>
                {grouped.university.map((pos) => (
                  <TouchableOpacity
                    key={pos.id}
                    style={[styles.positionCard, selectedPositionId === pos.id && styles.selectedCard]}
                    onPress={() => setSelectedPositionId(pos.id)}
                  >
                    <Text style={styles.positionName}>{pos.name}</Text>
                    <Text style={styles.positionDesc}>{pos.description || "No description"}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
            {grouped.school.length > 0 && (
              <>
                <Text style={styles.groupTitle}>School Level</Text>
                {grouped.school.map((pos) => (
                  <TouchableOpacity
                    key={pos.id}
                    style={[styles.positionCard, selectedPositionId === pos.id && styles.selectedCard]}
                    onPress={() => setSelectedPositionId(pos.id)}
                  >
                    <Text style={styles.positionName}>{pos.name}</Text>
                    <Text style={styles.positionDesc}>{pos.description || "No description"}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        )}

        <Text style={styles.label}>Manifesto</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={4}
          value={manifesto}
          onChangeText={setManifesto}
          placeholder="Write your manifesto..."
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>School</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={selectedSchool} onValueChange={(value) => setSelectedSchool(value)}>
            {SCHOOLS.map((school) => (
              <Picker.Item key={school} label={school} value={school} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity
          style={[styles.button, (!studentId || isLoading) && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={!studentId || isLoading}
        >
          <Text style={styles.buttonText}>{isLoading ? "Submitting..." : "Submit Application"}</Text>
        </TouchableOpacity>

        {/* History Cards - Text header removed as requested */}
        {(myApplications?.candidates || []).map((app: any) => (
          <View key={app.id} style={styles.applicationCard}>
            <Text style={styles.positionName}>Position ID: {app.position_id}</Text>
            <Text style={{ marginVertical: 4 }}>Manifesto: {app.manifesto}</Text>
            {renderApprovalStepper(app)}
            <TouchableOpacity
              style={[styles.button, { marginTop: 15, backgroundColor: "#333" }]}
              onPress={() => navigation.navigate("ApplicationProgress", { application: app })}
            >
              <Text style={styles.buttonText}>View Full Progress</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  navbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: "#eee" },
  backButton: { padding: 8 },
  navTitle: { fontSize: 18, fontWeight: "800", color: "#D32F2F", textTransform: "uppercase" },
  scrollContent: { padding: 20 },
  toastContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99999, alignItems: 'center' },
  toastContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, gap: 8, elevation: 10, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 5 },
  toastText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: "900", color: "#D32F2F", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 25, lineHeight: 20 },
  header: { fontSize: 22, fontWeight: "800", color: "#D32F2F", marginBottom: 15 },
  label: { fontSize: 15, fontWeight: "700", marginVertical: 8, color: "#333" },
  pickerContainer: { borderWidth: 1.5, borderRadius: 12, borderColor: "#eee", marginBottom: 15, backgroundColor: "#f9f9f9" },
  noData: { color: "#999", fontSize: 14, marginBottom: 10, fontStyle: "italic" },
  groupTitle: { fontSize: 16, fontWeight: "800", marginTop: 15, marginBottom: 5, color: "#D32F2F", textTransform: "uppercase" },
  positionCard: { padding: 15, marginVertical: 6, borderWidth: 1.5, borderColor: "#eee", borderRadius: 12, backgroundColor: "#fff" },
  selectedCard: { borderColor: "#D32F2F", backgroundColor: "#FFF5F5" },
  positionName: { fontSize: 16, fontWeight: "700", color: "#D32F2F" },
  positionDesc: { fontSize: 13, color: "#666", marginTop: 4 },
  input: { borderWidth: 1.5, borderColor: "#eee", borderRadius: 12, padding: 15, fontSize: 14, color: "#000", marginBottom: 15, backgroundColor: "#f9f9f9", textAlignVertical: "top" },
  button: { backgroundColor: "#D32F2F", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15, textTransform: "uppercase" },
  applicationCard: { padding: 18, borderWidth: 1, borderColor: "#eee", borderRadius: 15, marginBottom: 15, backgroundColor: "#fff", elevation: 3, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 },
  stepperContainer: { flexDirection: "row", alignItems: "center", marginTop: 15 },
  stepContainer: { flexDirection: "row", alignItems: "center", flex: 1 },
  stepCircle: { width: 14, height: 14, borderRadius: 7, marginRight: 6 },
  stepLine: { flex: 1, height: 2, backgroundColor: "#eee", marginHorizontal: 4 },
  stepLabel: { fontSize: 11, color: "#444", fontWeight: "600" },
  stepComment: { fontSize: 10, color: "#888", fontStyle: "italic" },
});