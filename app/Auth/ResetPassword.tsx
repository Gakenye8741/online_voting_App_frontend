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
import { Ionicons } from "@expo/vector-icons";
import AppLayout from "@/src/components/AppLayout";
import { useVerifyResetPasswordMutation } from "@/src/store/Apis/Auth.Api";

export default function ResetPassword() {
  const router = useRouter();
  const { reg_no } = useLocalSearchParams();
  
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [verifyResetPassword, { isLoading }] = useVerifyResetPasswordMutation();

  const handleReset = async () => {
    if (!otp || !newPassword) {
      Alert.alert("Input Required", "Please fill in all fields.");
      return;
    }

    if (otp.length !== 6) {
      Alert.alert("Invalid OTP", "The OTP must be 6 digits.");
      return;
    }

    try {
      console.log(`[E-Laikipia Voting SYSTEM] Verifying reset for: ${reg_no}`);
      
      await verifyResetPassword({
        reg_no: reg_no as string,
        otp,
        new_password: newPassword,
      }).unwrap();

      Alert.alert(
        "Success", 
        "Password updated successfully! You can now log in with your new password."
      );
      
      router.replace("/Auth/Login");
    } catch (err: any) {
      console.error("[E-Laikipia Voting SYSTEM] Reset Failed:", err);
      Alert.alert(
        "Verification Failed", 
        err.data?.message || "Invalid OTP or request expired."
      );
    }
  };

  return (
    <AppLayout>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined} 
        style={styles.mainContainer}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          centerContent={true}
        >
          <View style={styles.formWrapper}>
            <Animatable.Image
              animation="bounceIn"
              duration={1500}
              source={require("@/assets/images/Laikipia-logo.png")}
              style={styles.logo}
            />
            
            <Animatable.View animation="fadeInDown" style={styles.header}>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Verify identity for: <Text style={styles.regHighlight}>{reg_no}</Text>
              </Text>
            </Animatable.View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>6-Digit OTP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Secure Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordField}
                    placeholder="Enter new password"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)} 
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={22} 
                      color="#999" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.button, isLoading && styles.buttonDisabled]} 
                onPress={handleReset} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Update Password</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => router.replace("/Auth/Login")}
              >
                <Text style={styles.cancelButtonText}>Cancel and Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center", 
    paddingVertical: 40,
  },
  formWrapper: {
    width: "100%",
    paddingHorizontal: 25,
    alignItems: "center",
  },
  logo: {
    width: 110,
    height: 110,
    marginBottom: 15,
    resizeMode: "contain",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#c8102e",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
    textAlign: "center",
  },
  regHighlight: {
    fontWeight: "bold",
    color: "#333",
  },
  form: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#fcfcfc",
    borderWidth: 1.5,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fcfcfc",
    borderWidth: 1.5,
    borderColor: "#eee",
    borderRadius: 12,
  },
  passwordField: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    paddingRight: 15,
  },
  button: {
    backgroundColor: "#c8102e",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: "#e57373",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: 20,
    alignItems: "center",
    padding: 10,
  },
  cancelButtonText: {
    color: "#888",
    fontSize: 15,
    textDecorationLine: "underline",
  },
});