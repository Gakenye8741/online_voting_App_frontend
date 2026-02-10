// app/theme.tsx
import React, { useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/src/store";
import { setMode, setAccent } from "@/src/store/themeSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";

const accentColors = ["#ff3366", "#6a0dad", "#007aff", "#00c853", "#ff9100", "#9c27b0"];

const THEME_MODE_KEY = "@theme_mode";
const ACCENT_KEY = "@theme_accent";

export default function ThemeScreen() {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.theme.mode);
  const accent = useSelector((state: RootState) => state.theme.accent);

  // Load saved theme from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      const savedMode = (await AsyncStorage.getItem(THEME_MODE_KEY)) || "light";
      const savedAccent = (await AsyncStorage.getItem(ACCENT_KEY)) || "#ff3366";
      dispatch(setMode(savedMode as any));
      dispatch(setAccent(savedAccent));
    })();
  }, []);

  const handleModeChange = async (mode: "light" | "dark" | "system") => {
    dispatch(setMode(mode));
    await AsyncStorage.setItem(THEME_MODE_KEY, mode);
  };

  const handleAccentChange = async (color: string) => {
    dispatch(setAccent(color));
    await AsyncStorage.setItem(ACCENT_KEY, color);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme === "dark" ? "#111" : "#fefefe" }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}>
        <Text style={styles.header}>Themes & Appearance</Text>

        {/* Theme Mode */}
        <Text style={styles.sectionTitle}>Theme Mode</Text>
        {["light", "dark", "system"].map((modeOption) => (
          <Pressable
            key={modeOption}
            style={[
              styles.item,
              theme === modeOption && { borderColor: accent, borderWidth: 2 },
            ]}
            onPress={() => handleModeChange(modeOption as any)}
          >
            <Text style={[styles.itemText, { color: theme === "dark" ? "#fff" : "#333" }]}>
              {modeOption.charAt(0).toUpperCase() + modeOption.slice(1)}
            </Text>
            {theme === modeOption && <Text style={{ color: accent }}>✓</Text>}
          </Pressable>
        ))}

        {/* Accent Colors */}
        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Accent Color</Text>
        <View style={styles.colorContainer}>
          {accentColors.map((color) => (
            <Pressable
              key={color}
              style={[
                styles.colorCircle,
                { backgroundColor: color },
                accent === color && { borderWidth: 3, borderColor: "#333" },
              ]}
              onPress={() => handleAccentChange(color)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { fontSize: 24, fontWeight: "700", color: "#ff3366", marginVertical: 20 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#999", marginBottom: 12 },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  itemText: { fontSize: 16 },
  colorContainer: { flexDirection: "row", flexWrap: "wrap", gap: 15 },
  colorCircle: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
});
