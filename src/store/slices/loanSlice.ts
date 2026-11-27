import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface LoanState {
  selectedLoanId: string | null;
  statusFilter: string;
  loading: boolean;
  error: string | null;
}

const initialState: LoanState = {
  selectedLoanId: null,
  statusFilter: "ALL",
  loading: false,
  error: null,
};

const loanSlice = createSlice({
  name: "loan",
  initialState,
  reducers: {
    setSelectedLoanId: (state, action: PayloadAction<string | null>) => {
      state.selectedLoanId = action.payload;
    },
    setLoanStatusFilter: (state, action: PayloadAction<string>) => {
      state.statusFilter = action.payload;
    },
    setLoanLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setLoanError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setSelectedLoanId,
  setLoanStatusFilter,
  setLoanLoading,
  setLoanError,
} = loanSlice.actions;
export default loanSlice.reducer;
