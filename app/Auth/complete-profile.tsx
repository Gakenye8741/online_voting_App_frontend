// app/Auth/CompleteProfile.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Animatable from "react-native-animatable";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import AppLayout from "@/src/components/AppLayout";
import { useCompleteProfileMutation } from "@/src/store/Apis/Auth.Api";

const { height: screenHeight } = Dimensions.get("window");

const schools = [
  "Science",
  "Education",
  "Business",
  "Humanities and Developmental_Studies",
  "TVET",
];

export default function CompleteProfile() {
  const router = useRouter();
  const [completeProfile, { isLoading: isUpdating }] = useCompleteProfileMutation();

  const [name, setName] = useState("");
  const [school, setSchool] = useState<
    "Science" | "Education" | "Business" | "Humanities and Developmental_Studies" | "TVET" | ""
  >("");
  const [email, setEmail] = useState("");
  const [expectedGraduation, setExpectedGraduation] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [regNo, setRegNo] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        const storedUser = await AsyncStorage.getItem("user");
        
        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          const fetchedRegNo = parsedUser.reg_no || parsedUser.regNo || "Not Found";
          setRegNo(fetchedRegNo);
          setName(parsedUser.name || "");
          setSchool(parsedUser.school || "");
          setEmail(parsedUser.email || "");
          
          if (parsedUser.expected_graduation) {
            const [month, year] = parsedUser.expected_graduation.split("/").map(Number);
            setExpectedGraduation(new Date(year, month - 1));
          }
        }
      } catch (err) {
        console.log("Error loading user from storage:", err);
      }
    };
    loadUserData();
  }, []);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false); 
    if (selectedDate) setExpectedGraduation(selectedDate);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${year}`;
  };

  const handleSubmit = async () => {
    if (!name || !school || !email || !expectedGraduation) {
      Alert.alert("Incomplete", "Please fill all fields.");
      return;
    }
    if (!token) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    try {
      const result = await completeProfile({
        name,
        school: school as any,
        email,
        expected_graduation: formatDate(expectedGraduation),
      }).unwrap();

      // Update storage with the new user profile data
      await AsyncStorage.setItem("user", JSON.stringify(result.user));
      
      // Redirect to the secret code page instead of tabs
      router.replace("/Auth/secret-code");
    } catch (err: any) {
      Alert.alert("Error", err.data?.message || err.message || "Failed to update profile");
    }
  };

  return (
    <AppLayout>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#fff" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.innerWrapper}>
            <Animatable.Image
              animation="bounceIn"
              duration={1500}
              source={require('@/assets/images/Laikipia-logo.png')}
              style={styles.logo}
            />

            <Animatable.Text animation="fadeInDown" style={styles.title}>
              Complete Your Profile
            </Animatable.Text>
            
            <Animatable.Text animation="fadeIn" style={styles.regNoBadge}>
              Registration No: {regNo || "Loading..."}
            </Animatable.Text>

            <Animatable.Text animation="fadeInDown" style={styles.subtitle}>
              Please fill in your details. Your information will remain private.
            </Animatable.Text>

            <View style={styles.formContainer}>
              <Animatable.View animation="fadeInUp" delay={200} style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#999"
                />
              </Animatable.View>

              <Animatable.View animation="fadeInUp" delay={400} style={styles.inputContainer}>
                <Text style={styles.label}>School</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={school}
                    onValueChange={(itemValue) => setSchool(itemValue as any)}
                    dropdownIconColor="#c8102e"
                    style={styles.picker}
                  >
                    <Picker.Item label="Select school" value="" color="#999" />
                    {schools.map((s) => (
                      <Picker.Item key={s} label={s.replace(/_/g, " ")} value={s} color="#000" />
                    ))}
                  </Picker>
                </View>
              </Animatable.View>

              <Animatable.View animation="fadeInUp" delay={600} style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                />
              </Animatable.View>

              <Animatable.View animation="fadeInUp" delay={800} style={styles.inputContainer}>
                <Text style={styles.label}>Expected Graduation</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={{ color: expectedGraduation ? "#000" : "#999", fontSize: 16 }}>
                    {formatDate(expectedGraduation) || "Select month/year"}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={expectedGraduation || new Date()}
                    mode="date"
                    is24Hour={true}
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleDateChange}
                  />
                )}
              </Animatable.View>

              <Animatable.View animation="fadeInUp" delay={1000}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleSubmit}
                  disabled={isUpdating}
                >
                  {isUpdating ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit Details</Text>}
                </TouchableOpacity>
              </Animatable.View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  innerWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 25, 
    paddingVertical: 30,
    minHeight: screenHeight * 0.8,
    justifyContent: 'center'
  },
  logo: { width: 90, height: 90, marginBottom: 15 },
  title: { fontSize: 24, fontWeight: "bold", color: "#c8102e", textAlign: "center", marginBottom: 5 },
  regNoBadge: { 
    fontSize: 14, 
    color: "#666", 
    backgroundColor: "#f5f5f5", 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    marginBottom: 15,
    fontWeight: "700",
    borderWidth: 1,
    borderColor: "#eee"
  },
  subtitle: { fontSize: 14, color: "#555", textAlign: "center", marginBottom: 25, lineHeight: 20 },
  formContainer: { width: "100%" },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: "700", color: "#333", marginBottom: 6 },
  input: { 
    backgroundColor: "#fff", 
    borderRadius: 12, 
    paddingHorizontal: 15, 
    height: 55,
    justifyContent: 'center',
    fontSize: 16, 
    borderWidth: 1.5, 
    borderColor: "#f0f0f0", 
    color: "#000"
  },
  pickerContainer: { 
    backgroundColor: "#fff", 
    borderWidth: 1.5, 
    borderColor: "#f0f0f0", 
    borderRadius: 12,
    height: 55,
    justifyContent: 'center',
    overflow: 'hidden'
  },
  picker: {
    width: "100%",
    color: "#000",
    marginLeft: Platform.OS === 'android' ? -5 : 0
  },
  button: { 
    backgroundColor: "#c8102e", 
    height: 55,
    borderRadius: 12, 
    alignItems: "center", 
    justifyContent: 'center',
    marginTop: 15,
    elevation: 3,
    shadowColor: "#c8102e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
});