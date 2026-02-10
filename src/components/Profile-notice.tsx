import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileNotice({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Ionicons name="alert-circle" size={24} color="#c8102e" />
      <Text style={styles.text}>
        Your profile is incomplete — tap to complete now
      </Text>
      <Ionicons name="chevron-forward" size={20} color="#333" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#080203ff",
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ffccd2",
  },
  text: {
    flex: 1,
    marginLeft: 10,
    color: "#c8102e",
    fontWeight: "700",
  },
});
