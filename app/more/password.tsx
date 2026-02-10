// app/Auth/UpdatePassword.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Animatable from "react-native-animatable";
import { Ionicons } from "@expo/vector-icons";
import AppLayout from "@/src/components/AppLayout";
import { useUpdatePasswordMutation } from "@/src/store/Apis/Auth.Api";

export default function UpdatePasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [regNo, setRegNo] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [updatePassword] = useUpdatePasswordMutation();

  // Load reg_no and token
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      const storedToken = await AsyncStorage.getItem("token");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setRegNo(parsedUser.reg_no);
      }
      if (storedToken) setToken(storedToken);
    };
    loadUser();
  }, []);

  const handleSubmit = async () => {
    if (!password || !confirmPassword) {
      Alert.alert("Incomplete", "Please fill both fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }
    if (!regNo || !token) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    setLoading(true);
    try {
      const res: any = await updatePassword({ reg_no: regNo, password }).unwrap();
      Alert.alert("Success", res.message || "Password updated successfully!");
      router.replace("/(tabs)"); // Go back to Home
    } catch (err: any) {
      console.log("Update password error:", err);
      Alert.alert("Error", err?.data?.error || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animatable.View animation="fadeInDown" style={styles.innerContainer}>
          {/* Logo */}
          <Animatable.Image
            animation="bounceIn"
            duration={1500}
            source={require('@/assets/images/Laikipia-logo.png')}
            style={styles.logo}
          />

          {/* Title */}
          <Animatable.Text animation="fadeInDown" delay={300} style={styles.title}>
            Update Your Password
          </Animatable.Text>

          {/* New Password */}
          <Animatable.View animation="fadeInUp" delay={500} style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text>{showPassword ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </Animatable.View>

          {/* Confirm Password */}
          <Animatable.View animation="fadeInUp" delay={700} style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor="#999"
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirm(!showConfirm)}
            >
              <Text>{showConfirm ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </Animatable.View>

          {/* Buttons */}
          <Animatable.View animation="fadeInUp" delay={900} style={{ width: "100%" }}>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update Password</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.replace("/(tabs)")}
              disabled={loading}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animatable.View>
        </Animatable.View>
      </KeyboardAvoidingView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    paddingHorizontal: 25,
  },
  innerContainer: {
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#c8102e",
    marginBottom: 25,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    position: "relative",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    width: "100%",
  },
  eyeButton: {
    position: "absolute",
    right: 10,
    top: 12,
  },
  button: {
    backgroundColor: "#c8102e",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
    width: "100%", // full width
  },
  buttonDisabled: {
    backgroundColor: "#7a0a1e",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  cancelButton: {
    borderWidth: 2,
    borderColor: "#c8102e",
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    width: "100%", // full width
  },
  cancelText: {
    color: "#c8102e",
    fontWeight: "700",
    fontSize: 18,
  },
});
