import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Animatable from "react-native-animatable";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/src/store/authSlice";
import { useLoginMutation } from "@/src/store/Apis/Auth.Api";
import AppLayout from "@/src/components/AppLayout";

interface LoginFormInputs {
  reg_no: string;
  password: string;
}

const LoginScreen: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();
  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef<Animatable.View & View>(null);

const onLogin: SubmitHandler<LoginFormInputs> = async (data) => {
  try {
    const res: any = await login(data).unwrap();

    const userWithSchool = {
      ...res.user,
      school: res.user.school ?? null, // keep null if not set
    };

    await AsyncStorage.setItem("token", res.token);
    await AsyncStorage.setItem("user", JSON.stringify(userWithSchool));
    await AsyncStorage.setItem(
      "requireProfileCompletion",
      res.requireProfileCompletion ? "true" : "false"
    );
    await AsyncStorage.setItem(
      "requireSecretCode",
      res.requireSecretCode ? "true" : "false"
    );

    dispatch(
      setCredentials({
        user: userWithSchool,
        token: res.token,
        requireProfileCompletion: res.requireProfileCompletion,
        requireSecretCode: res.requireSecretCode,
      })
    );

    if (res.requireProfileCompletion) {
      router.replace("/Auth/complete-profile");
      return;
    }

    if (res.requireSecretCode) {
      router.replace("/Auth/secret-code");
      return;
    }

    router.replace("/(tabs)");
  } catch (err: any) {
    Alert.alert("Login failed", err.data?.error || err.message || "Unknown error");
  }
};




  return (
    <AppLayout>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animatable.View ref={formRef}>
          {/* Logo */}
          <Animatable.Image
            animation="bounceIn"
            duration={1500}
            source={require('@/assets/images/Laikipia-logo.png')}
            style={styles.logo}
          />

          {/* Titles */}
          <Animatable.Text animation="fadeInDown" delay={300} style={styles.title}>
            Welcome to the Laikipia E Voting App
          </Animatable.Text>
          <Animatable.Text animation="fadeInDown" delay={500} style={styles.subtitle}>
            Please login to continue
          </Animatable.Text>

          {/* Registration Number */}
          <Animatable.View animation="fadeInUp" delay={700}>
            <Controller
              control={control}
              name="reg_no"
              rules={{ required: "Registration number is required" }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.reg_no && styles.inputError]}
                  placeholder="Registration Number"
                  placeholderTextColor="#999"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.reg_no && <Text style={styles.error}>{errors.reg_no.message}</Text>}
          </Animatable.View>

          {/* Password */}
          <Animatable.View animation="fadeInUp" delay={900} style={styles.passwordContainer}>
            <Controller
              control={control}
              name="password"
              rules={{ required: "Password is required" }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <TextInput
                    style={[styles.input, errors.password && styles.inputError, { paddingRight: 45 }]}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye" : "eye-off"}
                      size={22}
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
          </Animatable.View>

          {/* Forgot Password */}
          <Animatable.View animation="fadeInUp" delay={1100}>
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </Animatable.View>

          {/* Login Button */}
          <Animatable.View animation="fadeInUp" delay={1300}>
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit(onLogin)}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
            </TouchableOpacity>
          </Animatable.View>

          {/* Footer */}
          <Animatable.View animation="fadeInUp" delay={1500} style={styles.footer}>
            <Text style={styles.footerText}>New here? Contact Admin to register</Text>
          </Animatable.View>
        </Animatable.View>
      </KeyboardAvoidingView>
    </AppLayout>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 25, justifyContent: "center" },
  logo: { width: 120, height: 120, alignSelf: "center", marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "bold", color: "#c8102e", textAlign: "center" },
  subtitle: { fontSize: 16, color: "#444", textAlign: "center", marginBottom: 25 },
  input: { backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, marginBottom: 10, borderWidth: 1, borderColor: "#ddd", color: "#333" },
  inputError: { borderColor: "#ff4d4f" },
  passwordContainer: { position: "relative", marginBottom: 10 },
  eyeButton: { position: "absolute", right: 10, top: 12 },
  error: { color: "#ff4d4f", marginBottom: 10, marginLeft: 5 },
  forgotPassword: { alignSelf: "flex-end", marginBottom: 20 },
  forgotPasswordText: { color: "#c8102e", fontWeight: "500" },
  button: { backgroundColor: "#c8102e", paddingVertical: 15, borderRadius: 8, alignItems: "center", marginBottom: 15 },
  buttonDisabled: { backgroundColor: "#7a0a1e" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  footer: { alignItems: "center", marginTop: 20 },
  footerText: { color: "#444", fontSize: 14 },
});
