// src/utils/themeStorage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_KEY = "@theme_mode";
const ACCENT_KEY = "@theme_accent";

export const saveThemeMode = async (mode: string) => {
  try {
    await AsyncStorage.setItem(THEME_KEY, mode);
  } catch (e) {
    console.warn("Failed to save theme mode:", e);
  }
};

export const loadThemeMode = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(THEME_KEY);
  } catch (e) {
    console.warn("Failed to load theme mode:", e);
    return null;
  }
};

export const saveAccent = async (accent: string) => {
  try {
    await AsyncStorage.setItem(ACCENT_KEY, accent);
  } catch (e) {
    console.warn("Failed to save accent:", e);
  }
};

export const loadAccent = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(ACCENT_KEY);
  } catch (e) {
    console.warn("Failed to load accent:", e);
    return null;
  }
};
