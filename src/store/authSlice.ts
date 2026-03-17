import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface User {
  id: string;
  reg_no: string;
  name: string;
  role: string;
  school: string | null;
  email?: string;
  expected_graduation?: string;
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
    // Changed to Partial<AuthState> so you can update just the user 
    // after completing the profile without losing the token.
    setCredentials: (state, action: PayloadAction<Partial<AuthState>>) => {
      if (action.payload.user !== undefined) {
        state.user = action.payload.user;
      }
      if (action.payload.token !== undefined) {
        state.token = action.payload.token;
      }
      if (action.payload.requireProfileCompletion !== undefined) {
        state.requireProfileCompletion = action.payload.requireProfileCompletion;
      }
      if (action.payload.requireSecretCode !== undefined) {
        state.requireSecretCode = action.payload.requireSecretCode;
      }
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