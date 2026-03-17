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
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";

import { useGetAllElectionsQuery } from "@/src/store/Apis/Election.Api";
import { useGetAllPositionsQuery } from "@/src/store/Apis/Positions.Api";
import { useCreateApplicationMutation, useGetApplicationsByStudentQuery } from "@/src/store/Apis/Applications.Api";

// ---------- TYPES ----------
type RootStackParamList = {
  ApplicationPage: undefined;
  ApplicationProgress: { application: any };
};

type ApplicationPageNavigationProp = NavigationProp<RootStackParamList, "ApplicationPage">;

const SCHOOLS = ["Science", "Education", "Business", "Humanities and Developmental_Studies", "TVET"];
const STATUS_COLORS: any = { PENDING: "#FFA500", APPROVED: "#4CAF50", REJECTED: "#F44336" };

// Cloudinary Constants
const CLOUD_NAME = 'dc7dvxjkx';
const PRESET_KEY = 'eLaikipia';

export default function ApplicationPage() {
  const scrollRef = useRef<ScrollView>(null);
  const navigation = useNavigation<ApplicationPageNavigationProp>();

  // Form State
  const [selectedElectionId, setSelectedElectionId] = useState<string>("");
  const [selectedPositionId, setSelectedPositionId] = useState<string>("");
  const [manifesto, setManifesto] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<string>(SCHOOLS[0]);
  const [studentId, setStudentId] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  
  // Image State
  const [image, setImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // API Hooks
  const { data: electionsData } = useGetAllElectionsQuery();
  const { data: positionsData } = useGetAllPositionsQuery();
  const [createApplication, { isLoading: isSubmitting }] = useCreateApplicationMutation();
  const { data: myApplications, refetch: refetchApplications } = useGetApplicationsByStudentQuery();

  // ---------- Image Picker ----------
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permissions needed to upload photo.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: false, // Set to false to prevent Network Errors on Android
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // ---------- Cloudinary Upload (Optimized for Android) ----------
  const uploadToCloudinary = async () => {
    if (!image) throw new Error("Please select an image first");

    const formData = new FormData();
    const uriParts = image.split('.');
    const fileType = uriParts[uriParts.length - 1];

    // Create file object for FormData
    // @ts-ignore
    formData.append('file', {
      uri: Platform.OS === 'android' ? image : image.replace('file://', ''),
      name: `photo.${fileType}`,
      type: `image/${fileType}`,
    });
    
    formData.append('upload_preset', PRESET_KEY);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data.secure_url;
    } catch (error: any) {
      console.error("Cloudinary Error:", error.response?.data || error.message);
      throw new Error("Image upload failed. Ensure your preset is 'Unsigned' in Cloudinary.");
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          setStudentId(user.id);
          setSelectedSchool(user.school || SCHOOLS[0]);
        }
      } catch (err) { console.log(err); }
    };
    fetchUser();
  }, []);

  const filteredPositions = useMemo(() => {
    if (!selectedElectionId || !positionsData?.positions) return [];
    return positionsData.positions.filter((pos) => pos.election_id.toString() === selectedElectionId.toString());
  }, [selectedElectionId, positionsData]);

  const grouped = useMemo(() => ({
    university: filteredPositions.filter((p) => p.tier === "university"),
    school: filteredPositions.filter((p) => p.tier === "school"),
  }), [filteredPositions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchApplications();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!selectedElectionId || !selectedPositionId || !manifesto || !image) {
      return Alert.alert("Missing Info", "Please provide a photo, manifesto, and select a position.");
    }

    setIsUploading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const photoUrl = await uploadToCloudinary();

      const payload = {
        student_id: studentId,
        position_id: selectedPositionId,
        manifesto,
        photo_url: photoUrl,
        school: selectedSchool,
        election_id: selectedElectionId,
      };

      await createApplication(payload).unwrap();
      Alert.alert("Success 🎉", "Your application has been submitted for review.");
      
      setManifesto("");
      setImage(null);
      refetchApplications();
    } catch (err: any) {
      Alert.alert("Submission Failed", err.message || "Something went wrong");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Progress Overlay */}
      <Modal transparent visible={isUploading || isSubmitting}>
        <View style={styles.overlay}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color="#D32F2F" />
            <Text style={styles.loaderText}>{isUploading ? "Uploading Photo..." : "Submitting..."}</Text>
          </View>
        </View>
      </Modal>

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
        <Text style={styles.header}>Run for Office</Text>
        <Text style={styles.subtitle}>Fill in the details below to start your political journey.</Text>

        <View style={styles.card}>
            <Text style={styles.label}>1. Select Election</Text>
            <View style={styles.pickerContainer}>
            <Picker
                selectedValue={selectedElectionId}
                onValueChange={(v) => { setSelectedElectionId(v); setSelectedPositionId(""); }}
            >
                <Picker.Item label="-- Choose Election --" value="" />
                {electionsData?.elections?.map((e: any) => (
                <Picker.Item key={e.id} label={e.name} value={e.id} />
                ))}
            </Picker>
            </View>

            <Text style={styles.label}>2. Candidate Photo</Text>
            <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
            {image ? (
                <Image source={{ uri: image }} style={styles.preview} />
            ) : (
                <View style={{ alignItems: 'center' }}>
                <Ionicons name="camera-outline" size={40} color="#D32F2F" />
                <Text style={{ color: '#666', marginTop: 8, fontWeight: '600' }}>Tap to upload portrait</Text>
                </View>
            )}
            </TouchableOpacity>

            <Text style={styles.label}>3. Choose Position</Text>
            {filteredPositions.length === 0 ? (
            <Text style={styles.noData}>Select an election to see positions.</Text>
            ) : (
            <View style={styles.posGrid}>
                {[...grouped.university, ...grouped.school].map((pos: any) => (
                <TouchableOpacity
                    key={pos.id}
                    style={[styles.posCard, selectedPositionId === pos.id && styles.selected]}
                    onPress={() => setSelectedPositionId(pos.id)}
                >
                    <Ionicons 
                        name={selectedPositionId === pos.id ? "checkbox" : "square-outline"} 
                        size={20} 
                        color={selectedPositionId === pos.id ? "#D32F2F" : "#999"} 
                    />
                    <Text style={[styles.posName, selectedPositionId === pos.id && {color: '#D32F2F'}]}>
                        {pos.name}
                    </Text>
                </TouchableOpacity>
                ))}
            </View>
            )}

            <Text style={styles.label}>4. Manifesto</Text>
            <TextInput
            style={styles.input}
            multiline
            value={manifesto}
            onChangeText={setManifesto}
            placeholder="What is your vision for this role?"
            placeholderTextColor="#999"
            />

            <TouchableOpacity
                style={[styles.button, (isSubmitting || isUploading) && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={isSubmitting || isUploading}
            >
                <Text style={styles.btnText}>Submit Application</Text>
                <Ionicons name="send" size={18} color="#fff" style={{marginLeft: 8}} />
            </TouchableOpacity>
        </View>

        {/* My Applications Section */}
        {myApplications?.candidates && myApplications.candidates.length > 0 && (
            <>
                <Text style={[styles.header, {marginTop: 30}]}>Your Applications</Text>
                {myApplications.candidates.map((app: any) => (
                <View key={app.id} style={styles.appCard}>
                    <View style={styles.appHeader}>
                        <View>
                            <Text style={styles.appPosName}>{app.position_id}</Text>
                            <Text style={styles.appDate}>{new Date().toLocaleDateString()}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[app.overall_status] + '20' }]}>
                            <Text style={[styles.statusText, { color: STATUS_COLORS[app.overall_status] }]}>
                                {app.overall_status}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.progressBtn}
                        onPress={() => navigation.navigate("ApplicationProgress", { application: app })}
                    >
                        <Text style={styles.progressBtnText}>Track Progress</Text>
                        <Ionicons name="chevron-forward" size={16} color="#666" />
                    </TouchableOpacity>
                </View>
                ))}
            </>
        )}
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  navbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, height: 60, backgroundColor: "#fff", elevation: 2 },
  backButton: { padding: 8 },
  navTitle: { fontSize: 18, fontWeight: "800", color: "#D32F2F" },
  scrollContent: { padding: 20 },
  header: { fontSize: 24, fontWeight: "900", color: "#1A1A1A" },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  label: { fontSize: 15, fontWeight: "700", marginBottom: 8, marginTop: 15, color: "#333" },
  pickerContainer: { borderWidth: 1, borderRadius: 12, borderColor: "#E0E0E0", backgroundColor: "#F9F9F9", overflow: 'hidden' },
  imageBox: { height: 180, borderWidth: 2, borderStyle: 'dashed', borderColor: '#D32F2F40', borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF5F5', overflow: 'hidden' },
  preview: { width: '100%', height: '100%' },
  posGrid: { marginTop: 5 },
  posCard: { flexDirection: 'row', alignItems: 'center', padding: 12, marginVertical: 4, borderWidth: 1, borderColor: "#EEE", borderRadius: 10, backgroundColor: '#fff' },
  selected: { borderColor: "#D32F2F", backgroundColor: "#FFF5F5" },
  posName: { fontSize: 14, fontWeight: "600", color: "#444", marginLeft: 10 },
  input: { borderWidth: 1, borderColor: "#E0E0E0", borderRadius: 12, padding: 15, height: 120, backgroundColor: "#F9F9F9", textAlignVertical: "top", fontSize: 15 },
  button: { backgroundColor: "#D32F2F", padding: 18, borderRadius: 12, alignItems: "center", marginTop: 20, flexDirection: 'row', justifyContent: 'center' },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  noData: { color: "#999", fontStyle: "italic", marginVertical: 10 },
  
  // App History Styles
  appCard: { backgroundColor: '#fff', borderRadius: 15, padding: 16, marginTop: 12, borderLeftWidth: 5, borderLeftColor: '#D32F2F' },
  appHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  appPosName: { fontSize: 16, fontWeight: '800', color: '#333' },
  appDate: { fontSize: 12, color: '#999' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '800' },
  progressBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  progressBtnText: { fontSize: 13, fontWeight: '600', color: '#666' },

  // Loader Overlay
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  loaderCard: { backgroundColor: '#fff', padding: 30, borderRadius: 20, alignItems: 'center', width: '70%' },
  loaderText: { marginTop: 15, fontWeight: '700', color: '#333' }
});