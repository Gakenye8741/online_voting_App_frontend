// src/components/ThemedWrapper.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../store";

export default function ThemedWrapper({ children }: { children: React.ReactNode }) {
  const theme = useSelector((state: RootState) => state.theme.mode);

  return (
    <View style={[
      styles.container,
      { backgroundColor: theme === "dark" ? "#111" : "#fefefe" }
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }
});
