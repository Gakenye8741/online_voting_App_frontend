// src/components/AppLayout.tsx
import React, { ReactNode, useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  useEffect(() => {
    // Configure Android navigation bar
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync("#ffffff"); // white background
      NavigationBar.setButtonStyleAsync("dark"); // black buttons
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <StatusBar style="dark" backgroundColor="#ffffff" />

      {/* App Content */}
      {children}
    </View>
  );
};

export default AppLayout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff", // white screen background
  },
});
