import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  isAuthenticated: boolean;
  role: "ADMIN" | "STAFF" | "CUSTOMER" | null;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  role: null,
  userId: null,
  userName: null,
  userEmail: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSessionUser: (
      state,
      action: PayloadAction<{
        userId: string;
        userName: string;
        userEmail: string;
        role: "ADMIN" | "STAFF" | "CUSTOMER";
      } | null>
    ) => {
      if (action.payload) {
        state.isAuthenticated = true;
        state.userId = action.payload.userId;
        state.userName = action.payload.userName;
        state.userEmail = action.payload.userEmail;
        state.role = action.payload.role;
        state.error = null;
      } else {
        state.isAuthenticated = false;
        state.userId = null;
        state.userName = null;
        state.userEmail = null;
        state.role = null;
      }
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setSessionUser, setAuthLoading, setAuthError } = authSlice.actions;
export default authSlice.reducer;
