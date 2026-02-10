// src/store/themeSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { saveAccent, saveThemeMode } from "../utils/themeStorage";


interface ThemeState {
  mode: "light" | "dark" | "system";
  accent: string;
}

const initialState: ThemeState = {
  mode: "light",
  accent: "#ff3366",
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setMode: (state, action: PayloadAction<"light" | "dark" | "system">) => {
      state.mode = action.payload;
      saveThemeMode(action.payload);
    },
    setAccent: (state, action: PayloadAction<string>) => {
      state.accent = action.payload;
      saveAccent(action.payload);
    },
    loadTheme: (state, action: PayloadAction<{ mode: string; accent: string }>) => {
      state.mode = action.payload.mode as any;
      state.accent = action.payload.accent;
    },
  },
});

export const { setMode, setAccent, loadTheme } = themeSlice.actions;
export default themeSlice.reducer;
