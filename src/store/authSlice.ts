import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Updated to match your backend response keys: userId and regNo
interface User {
  userId: string;
  regNo: string;
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
    /**
     * Updates authentication state. 
     * Using Partial allows for updating specific fields (like just the user 
     * after profile completion) without overwriting the token.
     */
    setCredentials: (state, action: PayloadAction<Partial<AuthState>>) => {
      const { user, token, requireProfileCompletion, requireSecretCode } = action.payload;
      
      if (user !== undefined) {
        state.user = user;
      }
      if (token !== undefined) {
        state.token = token;
      }
      if (requireProfileCompletion !== undefined) {
        state.requireProfileCompletion = requireProfileCompletion;
      }
      if (requireSecretCode !== undefined) {
        state.requireSecretCode = requireSecretCode;
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