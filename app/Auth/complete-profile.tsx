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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Animatable from "react-native-animatable";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import AppLayout from "@/src/components/AppLayout";
import { useCompleteProfileMutation } from "@/src/store/Apis/Auth.Api";

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
        
        console.log("Raw Stored User:", storedUser); // Check your console!

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          
          // Make sure this matches your backend's key (reg_no)
          const fetchedRegNo = parsedUser.reg_no || parsedUser.regNo || "Not Found";
          setRegNo(fetchedRegNo);

          setName(parsedUser.name || "");
          setSchool(parsedUser.school || "");
          setEmail(parsedUser.email || "");
          
          if (parsedUser.expected_graduation) {
            const [month, year] = parsedUser.expected_graduation
              .split("/")
              .map(Number);
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
    setShowDatePicker(Platform.OS === "ios");
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
    
    // We check token here as a fallback, but RTK prepareHeaders handles it
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

      // Store updated user info from response
      await AsyncStorage.setItem("user", JSON.stringify(result.user));

      Alert.alert(
        "Success",
        "Profile completed successfully! Your personal information is safe."
      );
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Error", err.data?.message || err.message || "Failed to update profile");
    }
  };

  return (
    <AppLayout>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Animatable.Image
            animation="bounceIn"
            duration={1500}
            source={require('@/assets/images/Laikipia-logo.png')}
            style={styles.logo}
          />

          <Animatable.Text animation="fadeInDown" style={styles.title}>
            Complete Your Profile
          </Animatable.Text>
          
          {/* Displaying the Reg No from AsyncStorage */}
          <Animatable.Text animation="fadeIn" style={styles.regNoBadge}>
            Registration No: {regNo || "Loading..."}
          </Animatable.Text>

          <Animatable.Text animation="fadeInDown" style={styles.subtitle}>
            Please fill in your details. Your information will remain private and
            will not be shared during voting.
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
                  onValueChange={(itemValue) =>
                    setSchool(itemValue as any)
                  }
                >
                  <Picker.Item label="Select school" value="" />
                  {schools.map((s) => (
                    <Picker.Item key={s} label={s} value={s} />
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
                  display="spinner"
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
                {isUpdating ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit</Text>}
              </TouchableOpacity>
            </Animatable.View>
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
    alignItems: "center", 
    paddingHorizontal: 25, 
    paddingVertical: 30,
    backgroundColor: "#fff",
  },
  logo: { width: 120, height: 120, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "bold", color: "#c8102e", textAlign: "center", marginBottom: 5 },
  regNoBadge: { 
    fontSize: 14, 
    color: "#666", 
    backgroundColor: "#f0f0f0", 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 15, 
    marginBottom: 15,
    fontWeight: "600"
  },
  subtitle: { fontSize: 16, color: "#444", textAlign: "center", marginBottom: 25 },
  formContainer: { width: "100%" },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 16, fontWeight: "500", color: "#444", marginBottom: 5 },
  input: { 
    backgroundColor: "#fff", 
    borderRadius: 8, 
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    fontSize: 16, 
    borderWidth: 1, 
    borderColor: "#ddd", 
    color: "#333" 
  },
  pickerContainer: { 
    backgroundColor: "#fff", 
    borderWidth: 1, 
    borderColor: "#ddd", 
    borderRadius: 8 
  },
  button: { 
    backgroundColor: "#c8102e", 
    paddingVertical: 15, 
    borderRadius: 8, 
    alignItems: "center", 
    marginTop: 15 
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
});