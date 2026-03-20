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

import * as Notifications from "expo-notifications";
import AppLayout from "@/src/components/AppLayout";
import { useRegisterPushTokenMutation } from "@/src/store/Apis/Notification.Api";

interface LoginFormInputs {
  reg_no: string;
  password: string;
}

const LoginScreen: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();
  const [registerPush] = useRegisterPushTokenMutation();
  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef<Animatable.View & View>(null);

  const getPushToken = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") return null;

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (error) {
      console.error("Error getting push token", error);
      return null;
    }
  };

  const onLogin: SubmitHandler<LoginFormInputs> = async (data) => {
    try {
      const res: any = await login(data).unwrap();

      const userWithSchool = {
        ...res.user,
        school: res.user.school ?? null,
      };

      // 1. Storage updates
      await Promise.all([
        AsyncStorage.setItem("token", res.token),
        AsyncStorage.setItem("user", JSON.stringify(userWithSchool)),
        AsyncStorage.setItem("requireProfileCompletion", res.requireProfileCompletion ? "true" : "false"),
        AsyncStorage.setItem("requireSecretCode", res.requireSecretCode ? "true" : "false"),
      ]);

      // 2. CRITICAL: Update Redux state BEFORE registering the push token
      // This ensures the API headers have the bearer token for the next call
      dispatch(
        setCredentials({
          user: userWithSchool,
          token: res.token,
          requireProfileCompletion: !!res.requireProfileCompletion,
          requireSecretCode: !!res.requireSecretCode,
        })
      );

      // 3. Register Push Token (Silent failure to allow login)
      const deviceToken = await getPushToken();
      if (deviceToken && (res.user.id || res.user._id)) {
        try {
          await registerPush({
            userId: res.user.id || res.user._id,
            pushToken: deviceToken,
          }).unwrap();
        } catch (pushErr) {
          console.warn("Push token sync failed, but proceeding with login:", pushErr);
        }
      }

      // 4. Navigation logic
      if (res.requireProfileCompletion) {
        router.replace("/Auth/complete-profile");
      } else if (res.requireSecretCode) {
        router.replace("/Auth/secret-code");
      } else {
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      const errorMessage = err.data?.message || err.data?.error || err.message || "Unknown error";
      Alert.alert("Login failed", errorMessage);
    }
  };

  return (
    <AppLayout>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animatable.View ref={formRef} style={{ width: '100%' }}>
          <Animatable.Image
            animation="bounceIn"
            duration={1500}
            source={require('@/assets/images/Laikipia-logo.png')}
            style={styles.logo}
          />

          <Animatable.Text animation="fadeInDown" delay={300} style={styles.title}>
            Welcome to the Laikipia E-Voting App
          </Animatable.Text>
          <Animatable.Text animation="fadeInDown" delay={500} style={styles.subtitle}>
            Please login to continue
          </Animatable.Text>

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
                  autoCapitalize="none"
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.reg_no && <Text style={styles.error}>{errors.reg_no.message}</Text>}
          </Animatable.View>

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

          <Animatable.View animation="fadeInUp" delay={1100}>
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={1300}>
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit(onLogin)}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
            </TouchableOpacity>
          </Animatable.View>

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
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 25, justifyContent: "center", alignItems: 'center' },
  logo: { width: 120, height: 120, alignSelf: "center", marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "bold", color: "#c8102e", textAlign: "center" },
  subtitle: { fontSize: 16, color: "#444", textAlign: "center", marginBottom: 25 },
  input: { backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, marginBottom: 10, borderWidth: 1, borderColor: "#ddd", color: "#333" },
  inputError: { borderColor: "#ff4d4f" },
  passwordContainer: { position: "relative", marginBottom: 10, width: '100%' },
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