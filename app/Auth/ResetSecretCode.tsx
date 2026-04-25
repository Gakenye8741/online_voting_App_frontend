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
import { useVerifyResetSecretCodeMutation } from "@/src/store/Apis/Auth.Api";

export default function ResetSecretCode() {
  const router = useRouter();
  const { reg_no } = useLocalSearchParams();
  
  const [otp, setOtp] = useState("");
  const [newSecretCode, setNewSecretCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  
  const [verifyResetSecretCode, { isLoading }] = useVerifyResetSecretCodeMutation();

  const handleReset = async () => {
    if (!otp || !newSecretCode) {
      Alert.alert("Input Required", "Please fill in all fields.");
      return;
    }

    if (otp.length !== 6) {
      Alert.alert("Invalid OTP", "The OTP must be 6 digits.");
      return;
    }

    try {
      await verifyResetSecretCode({
        reg_no: reg_no as string,
        otp,
        new_secret_code: newSecretCode,
      }).unwrap();

      Alert.alert(
        "Success", 
        "Secret Code updated! Keep this code safe as it is required for casting your vote."
      );
      
      router.replace("/(tabs)");
    } catch (err: any) {
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
        >
          <View style={styles.contentWrapper}>
            <Animatable.Image
              animation="bounceIn"
              duration={1500}
              source={require("@/assets/images/Laikipia-logo.png")}
              style={styles.logo}
            />
            
            <Animatable.View animation="fadeInDown" style={styles.header}>
              <Text style={styles.title}>Reset Secret Code</Text>
              <Text style={styles.subtitle}>
                Verification for: <Text style={styles.regHighlight}>{reg_no}</Text>
              </Text>
            </Animatable.View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>6-Digit OTP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Check your email"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Voting Secret Code</Text>
                <View style={styles.codeWrapper}>
                  <TextInput
                    style={styles.codeField}
                    placeholder="Enter new secret code"
                    placeholderTextColor="#999"
                    secureTextEntry={!showCode}
                    value={newSecretCode}
                    onChangeText={setNewSecretCode}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowCode(!showCode)} 
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showCode ? "eye-off" : "eye"} 
                      size={22} 
                      color="#999" 
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.infoText}>This code is used to authorize your votes.</Text>
              </View>

              <TouchableOpacity 
                style={[styles.button, isLoading && styles.buttonDisabled]} 
                onPress={handleReset} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Update Secret Code</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => router.back()}
              >
                <Text style={styles.cancelButtonText}>Go Back</Text>
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
    justifyContent: "center", // Perfectly centers content vertically
    paddingVertical: 40,
  },
  contentWrapper: {
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
    color: "#444",
    marginBottom: 8,
    textTransform: "uppercase",
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
  codeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fcfcfc",
    borderWidth: 1.5,
    borderColor: "#eee",
    borderRadius: 12,
  },
  codeField: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    paddingRight: 15,
  },
  infoText: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
    fontStyle: "italic",
  },
  button: {
    backgroundColor: "#c8102e",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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