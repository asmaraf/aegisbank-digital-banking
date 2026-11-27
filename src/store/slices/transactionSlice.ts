import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface TransactionState {
  search: string;
  typeFilter: string;
  statusFilter: string;
  startDate: string;
  endDate: string;
  flaggedOnly: boolean;
  page: number;
  loading: boolean;
  error: string | null;
}

const initialState: TransactionState = {
  search: "",
  typeFilter: "",
  statusFilter: "",
  startDate: "",
  endDate: "",
  flaggedOnly: false,
  page: 1,
  loading: false,
  error: null,
};

const transactionSlice = createSlice({
  name: "transaction",
  initialState,
  reducers: {
    setTransactionFilters: (
      state,
      action: PayloadAction<Partial<Omit<TransactionState, "loading" | "error">>>
    ) => {
      Object.assign(state, action.payload);
      if (action.payload.page === undefined) {
        state.page = 1;
      }
    },
    resetTransactionFilters: () => initialState,
    setTransactionLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setTransactionError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setTransactionFilters,
  resetTransactionFilters,
  setTransactionLoading,
  setTransactionError,
} = transactionSlice.actions;
export default transactionSlice.reducer;
