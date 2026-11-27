import { configureStore } from "@reduxjs/toolkit";
import { bankingApi } from "@/store/api/bankingApi";
import authReducer from "@/store/slices/authSlice";
import accountReducer from "@/store/slices/accountSlice";
import transactionReducer from "@/store/slices/transactionSlice";
import loanReducer from "@/store/slices/loanSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    account: accountReducer,
    transaction: transactionReducer,
    loan: loanReducer,
    [bankingApi.reducerPath]: bankingApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(bankingApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
