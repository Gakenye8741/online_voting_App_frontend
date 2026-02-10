import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSetSecretCodeMutation } from "@/src/store/Apis/Auth.Api";
import { useRouter } from "expo-router";
import * as Animatable from "react-native-animatable";

const SetSecretCodeScreen: React.FC = () => {
  const [secretCode, setSecretCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [setCode, { isLoading }] = useSetSecretCodeMutation();
  const router = useRouter();
  const formRef = useRef<Animatable.View & View>(null);

 const handleSetCode = async () => {
  if (!secretCode) {
    Alert.alert("Error", "Please enter a secret code.");
    formRef.current?.shake?.(800);
    return;
  }

  try {
    const res: any = await setCode({ secret_code: secretCode }).unwrap();

    Alert.alert("Success", res.message || "Secret code set successfully!");

    // Check if profile completion is required after setting secret code
    if (res.requireProfileCompletion) {
      router.replace("/Auth/complete-profile");
    } else {
      router.replace("/(tabs)");
    }

  } catch (err: any) {
    formRef.current?.shake?.(800);
    Alert.alert("Failed", err.data?.error || err.message);
  }
};


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Animatable.View ref={formRef}>
        <Animatable.Text animation="fadeInDown" style={styles.title}>
          Set Your Secret Code
        </Animatable.Text>
        <Animatable.Text animation="fadeInDown" delay={200} style={styles.subtitle}>
          This code will be required for secure voting.
        </Animatable.Text>

        <Animatable.View animation="fadeInUp" delay={400} style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter secret code"
            placeholderTextColor="#999"
            secureTextEntry={!showPassword}
            value={secretCode}
            onChangeText={setSecretCode}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text>{showPassword ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" delay={600}>
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSetCode}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Set Secret Code</Text>}
          </TouchableOpacity>
        </Animatable.View>
      </Animatable.View>
    </KeyboardAvoidingView>
  );
};

export default SetSecretCodeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    paddingHorizontal: 25,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#c8102e",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 25,
    color: "#444",
  },
  inputContainer: {
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
  },
  eyeButton: {
    position: "absolute",
    right: 10,
    top: 12,
  },
  button: {
    backgroundColor: "#c8102e",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#7a0a1e",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});
