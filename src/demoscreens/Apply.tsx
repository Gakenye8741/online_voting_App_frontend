import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Modal,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import ConfettiCannon from "react-native-confetti-cannon";

const positions = [
  { name: "President", eligibility: "Minimum 60% average grade, leadership experience" },
  { name: "Vice President", eligibility: "Minimum 55% average grade, leadership experience" },
  { name: "Secretary", eligibility: "Minimum 50% average grade" },
  { name: "Treasurer", eligibility: "Minimum 50% average grade" },
  { name: "Sports Rep", eligibility: "Active in sports club" },
  { name: "Cultural Rep", eligibility: "Active in cultural activities" },
];

const deputyRoles = ["Vice President", "Secretary", "Treasurer"];

type ApprovalStage = {
  name: string;
  status: "Pending" | "Approved" | "Rejected";
  comment?: string;
  timestamp?: string;
};

type Candidate = {
  name: string;
  position: string;
};

export default function ApplyPositionScreen() {
  // Candidate info
  const [step, setStep] = useState(0);
  const [name] = useState("John Doe");
  const [admission] = useState("ADM2025-00123");
  const [department] = useState("Computer Science");
  const [year] = useState("4th Year");

  // Form fields
  const [position, setPosition] = useState<string | null>(null);
  const [manifesto, setManifesto] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  // Coalition
  const [coalition, setCoalition] = useState<{ position: string; name: string }[]>([]);

  // Approval workflow
  const stagesInitial: ApprovalStage[] = [
    { name: "Finance Office", status: "Pending" },
    { name: "Dean of Students", status: "Pending" },
    { name: "Dean", status: "Pending" },
  ];
  const [stages, setStages] = useState(stagesInitial);
  const stageAnim = useRef(stages.map(() => new Animated.Value(0))).current;

  // Modal & Confetti
  const [modalVisible, setModalVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Dummy approved candidates for dropdown
  const [approvedCandidates, setApprovedCandidates] = useState<Candidate[]>([
    { name: "Alice Kimani", position: "Vice President" },
    { name: "Brian Mwangi", position: "Secretary" },
    { name: "Carol Wanjiku", position: "Treasurer" },
    { name: "David Otieno", position: "Vice President" },
  ]);

  // Image pickers
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return alert("Permission is required!");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setAvatar(result.assets[0].uri);
  };
  const handleCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return alert("Permission is required!");
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setAvatar(result.assets[0].uri);
  };

  const animateStage = (index: number) => {
    Animated.timing(stageAnim[index], {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  const handleNext = () => {
    if (step === 1 && !position) return Alert.alert("Error", "Please select a position.");
    if (step === 2 && manifesto.length < 50)
      return Alert.alert("Error", "Manifesto must be at least 50 characters.");
    setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => (prev > 0 ? prev - 1 : 0));

  const handleSubmit = () => {
    if (!position || manifesto.length < 50) return;
    setModalVisible(true);

    // Auto-approve workflow for testing
    stagesInitial.forEach((stage, index) => {
      setTimeout(() => {
        setStages((prev) =>
          prev.map((s, i) =>
            i === index
              ? { ...s, status: "Approved", comment: "Approved", timestamp: new Date().toLocaleString() }
              : s
          )
        );
        animateStage(index);
      }, 10000 * (index + 1));
    });
  };

  const isFullyApproved = stages.every((s) => s.status === "Approved");

  // Handle coalition selection
  const updateCoalitionMember = (role: string, candidateName: string) => {
    setCoalition((prev) => [
      ...prev.filter((d) => d.position !== role),
      { position: role, name: candidateName },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {showConfetti && <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} fadeOut />}
      <LinearGradient colors={["#ff3366", "#ff6688"]} style={styles.header}>
        <Text style={styles.headerTitle}>Apply for Position</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((step + 1) / 5) * 100}%` }]} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Step 0: Personal Info */}
        {step === 0 && (
          <>
            <Text style={styles.stepTitle}>Your Info</Text>
            {[["Full Name", name], ["Admission Number", admission], ["Department", department], ["Year/Class", year]].map(
              ([label, value], idx) => (
                <View key={idx} style={styles.inputGroup}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInput style={styles.input} value={value as string} editable={false} />
                </View>
              )
            )}
          </>
        )}

        {/* Step 1: Position */}
        {step === 1 && (
          <>
            <Text style={styles.stepTitle}>Select Position</Text>
            {positions.map((pos) => (
              <View key={pos.name} style={{ marginBottom: 8 }}>
                <TouchableOpacity
                  style={[styles.optionButton, position === pos.name && styles.optionButtonSelected]}
                  onPress={() => setPosition(pos.name)}
                >
                  <Text style={[styles.optionText, position === pos.name && styles.optionTextSelected]}>{pos.name}</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 12, color: "#555" }}>{pos.eligibility}</Text>
              </View>
            ))}
          </>
        )}

        {/* Step 2: Manifesto */}
        {step === 2 && (
          <>
            <Text style={styles.stepTitle}>Manifesto</Text>
            <TextInput
              style={[styles.input, { height: 120 }]}
              value={manifesto}
              onChangeText={setManifesto}
              multiline
              placeholder="Write your manifesto (min 50 characters)..."
            />
          </>
        )}

        {/* Step 3: Avatar Upload & Submit */}
        {step === 3 && (
          <>
            <Text style={styles.stepTitle}>Upload Photo</Text>
            <View style={styles.avatarSection}>
              <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                  <Text style={styles.avatarPlaceholder}>📸 Select from Gallery</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCamera} style={{ marginTop: 10 }}>
                <Text style={{ color: "#fff", fontWeight: "600" }}>📷 Take Photo</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Submit Application</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Step 4: Coalition building (only after full approval for President) */}
        {position === "President" && isFullyApproved && step >= 4 && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.stepTitle}>Build Your Coalition</Text>
            {deputyRoles.map((role) => (
              <View key={role} style={{ marginBottom: 12 }}>
                <Text style={{ fontWeight: "600" }}>{role}</Text>
                <View style={styles.dropdownWrapper}>
                  <Text>Select candidate:</Text>
                  {approvedCandidates
                    .filter((c) => c.position === role)
                    .map((c, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.dropdownOption}
                        onPress={() => updateCoalitionMember(role, c.name)}
                      >
                        <Text>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
                {coalition.find((d) => d.position === role) && (
                  <Text style={{ marginTop: 4, color: "#555" }}>
                    Selected: {coalition.find((d) => d.position === role)?.name}
                  </Text>
                )}
              </View>
            ))}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => setShowConfetti(true)}
            >
              <Text style={styles.submitButtonText}>Finalize Coalition</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Navigation Buttons */}
        {step < 4 && (
          <View style={styles.navButtons}>
            {step > 0 && (
              <TouchableOpacity style={styles.navButton} onPress={handleBack}>
                <Text style={styles.navButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            {step < 3 && (
              <TouchableOpacity style={[styles.navButton, { backgroundColor: "#ff3366" }]} onPress={handleNext}>
                <Text style={[styles.navButtonText, { color: "#fff" }]}>Next</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Approval Tracker */}
        <View style={{ marginTop: 30 }}>
          <Text style={styles.trackerHeader}>Approval Process</Text>
          {stages.map((stage, idx) => {
            const scale = stageAnim[idx].interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
            return (
              <Animated.View key={idx} style={[styles.stageContainer, { transform: [{ scale }] }]}>
                <Text style={styles.stageName}>{stage.name}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    stage.status === "Approved"
                      ? styles.statusApproved
                      : stage.status === "Rejected"
                      ? styles.statusRejected
                      : styles.statusPending,
                  ]}
                >
                  <Text style={styles.statusText}>{stage.status}</Text>
                </View>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Application Submitted!</Text>
            <Text style={styles.modalText}>
              Your application for <Text style={{ fontWeight: "700" }}>{position}</Text> has been received.
            </Text>
            <Text style={styles.modalText}>It will be reviewed by the relevant authorities.</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false); // <-- Fix modal close
                setStep(4);
              }}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { paddingVertical: 20, paddingHorizontal: 20, alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 10 },
  progressBar: { height: 6, width: "100%", backgroundColor: "#ffb6c1", borderRadius: 4 },
  progressFill: { height: "100%", backgroundColor: "#fff", borderRadius: 4 },
  content: { padding: 20 },
  stepTitle: { fontSize: 18, fontWeight: "700", color: "#ff3366", marginBottom: 15 },
  avatarSection: { alignItems: "center", marginBottom: 20 },
  avatarWrapper: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: "#ff3366", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  avatar: { width: "100%", height: "100%", borderRadius: 50 },
  avatarPlaceholder: { fontSize: 16, color: "#ff3366", textAlign: "center" },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 5 },
  input: { borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 12, fontSize: 16 },
  optionButton: { padding: 10, borderRadius: 12, borderWidth: 1, borderColor: "#ff3366", marginVertical: 5 },
  optionButtonSelected: { backgroundColor: "#ff3366" },
  optionText: { color: "#ff3366", fontWeight: "600", textAlign: "center" },
  optionTextSelected: { color: "#fff" },
  submitButton: { backgroundColor: "#ff3366", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 10 },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  navButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  navButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: "#ff3366" },
  navButtonText: { fontWeight: "700", fontSize: 16, color: "#ff3366" },
  trackerHeader: { fontSize: 18, fontWeight: "700", color: "#ff3366", marginBottom: 10 },
  stageContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 15, borderRadius: 12, backgroundColor: "#f7f7f7", marginBottom: 10 },
  stageName: { fontSize: 16, fontWeight: "600", flex: 1 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusApproved: { backgroundColor: "#2ecc71" },
  statusRejected: { backgroundColor: "#ff3366" },
  statusPending: { backgroundColor: "#f0ad4e" },
  statusText: { color: "#fff", fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalCard: { width: "90%", backgroundColor: "#fff", borderRadius: 20, padding: 20, alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#ff3366", marginBottom: 10 },
  modalText: { fontSize: 16, color: "#333", textAlign: "center", marginBottom: 10 },
  modalButton: { backgroundColor: "#ff3366", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  modalButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  dropdownWrapper: { borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 10 },
  dropdownOption: { paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: "#eee" },
});
