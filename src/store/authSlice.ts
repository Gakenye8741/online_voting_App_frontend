import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface User {
  id: string;
  reg_no: string;
  name: string;
  role: string;
  school: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  requireProfileCompletion: boolean;
  requireSecretCode: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  requireProfileCompletion: false,
  requireSecretCode: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthState>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.requireProfileCompletion = action.payload.requireProfileCompletion;
      state.requireSecretCode = action.payload.requireSecretCode;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.requireProfileCompletion = false;
      state.requireSecretCode = false;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
