import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Animatable from "react-native-animatable";
import AppLayout from "@/src/components/AppLayout";
import { useRequestOtpMutation } from "@/src/store/Apis/Auth.Api";

export default function RequestOtp() {
  const router = useRouter();
  const { reason } = useLocalSearchParams(); // 'password_reset' or 'reset_code'
  const [regNo, setRegNo] = useState("");
  const [requestOtp, { isLoading }] = useRequestOtpMutation();

  const handleRequest = async () => {
    if (!regNo) {
      Alert.alert("Input Required", "Please enter your Registration Number.");
      return;
    }

    try {
      // Default to password_reset if no reason is passed
      const selectedReason = (reason as any) || "password_reset";
      
      console.log(`[E-Laikipia voting SYSTEM] Requesting OTP for ${regNo}. Reason: ${selectedReason}`);

      await requestOtp({ 
        reg_no: regNo, 
        reason: selectedReason 
      }).unwrap();

      Alert.alert("OTP Sent", "Check your email for the 6-digit code.");
      
      // Navigate to the verification screen based on the reason
      if (selectedReason === "password_reset") {
        router.push({ pathname: "/Auth/ResetPassword", params: { reg_no: regNo } });
      } else {
        router.push({ pathname: "/Auth/ResetSecretCode", params: { reg_no: regNo } });
      }
    } catch (err: any) {
      Alert.alert("Error", err.data?.message || "User not found or network error.");
    }
  };

  return (
    <AppLayout>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <Animatable.Image
              animation="bounceIn"
              duration={1500}
              source={require("@/assets/images/Laikipia-logo.png")}
              style={styles.logo}
            />
            
            <Animatable.Text animation="fadeInDown" style={styles.title}>
              System Recovery
            </Animatable.Text>
            
            <Animatable.Text animation="fadeInUp" style={styles.subtitle}>
              Enter your Registration Number to receive a verification OTP on your registered email.
            </Animatable.Text>

            <View style={styles.form}>
              <Text style={styles.label}>Registration Number</Text>
              <TextInput
                style={styles.input}
                placeholder="SC/COM/00000/22"
                placeholderTextColor="#999"
                autoCapitalize="characters"
                value={regNo}
                onChangeText={setRegNo}
              />

              <TouchableOpacity 
                style={styles.button} 
                onPress={handleRequest} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Request OTP</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => router.back()}
              >
                <Text style={styles.backButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    padding: 25,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    resizeMode: "contain",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#c8102e", // E-Laikipia voting  Primary Red
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  form: {
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#c8102e",
    padding: 18,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#c8102e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  backButton: {
    marginTop: 20,
    alignItems: "center",
  },
  backButtonText: {
    color: "#666",
    fontSize: 16,
    textDecorationLine: "underline",
  },
});