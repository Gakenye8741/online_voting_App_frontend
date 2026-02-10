// src/screens/LogoutScreen.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { useRouter } from "expo-router";
import * as Animatable from "react-native-animatable";
import AppLayout from "@/src/components/AppLayout";
import { logout } from "@/src/store/authSlice";

const LogoutScreen: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token"); // Remove JWT token
    dispatch(logout()); // Reset auth state
    router.replace("/Auth/Login"); // Redirect to login screen
  };

  const handleCancel = () => {
    router.back(); // Go back to previous screen
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <Animatable.Image
          source={require('@/assets/images/Laikipia-logo.png')}
          style={styles.logo}
          animation="bounceIn"
          duration={1200}
        />

        <Animatable.Text
          style={styles.title}
          animation="fadeInDown"
          delay={300}
        >
          Logout
        </Animatable.Text>

        <Animatable.Text
          style={styles.subtitle}
          animation="fadeInDown"
          delay={500}
        >
          Are you sure you want to log out from the Voting App?
        </Animatable.Text>

        <Animatable.View animation="fadeInUp" delay={700}>
          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animatable.View>
      </View>
    </AppLayout>
  );
};

export default LogoutScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#c8102e",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#444",
    textAlign: "center",
    marginBottom: 30,
  },
  logoutButton: {
    backgroundColor: "#c8102e",
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  cancelButton: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#c8102e",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  cancelText: {
    color: "#c8102e",
    fontWeight: "bold",
    fontSize: 18,
  },
});
