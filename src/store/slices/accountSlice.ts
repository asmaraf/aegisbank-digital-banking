import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AccountState {
  activeAccountId: string | null;
  searchQuery: string;
  loading: boolean;
  error: string | null;
}

const initialState: AccountState = {
  activeAccountId: null,
  searchQuery: "",
  loading: false,
  error: null,
};

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    setActiveAccountId: (state, action: PayloadAction<string | null>) => {
      state.activeAccountId = action.payload;
    },
    setAccountSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setAccountLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setAccountError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setActiveAccountId,
  setAccountSearchQuery,
  setAccountLoading,
  setAccountError,
} = accountSlice.actions;
export default accountSlice.reducer;
