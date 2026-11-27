"use client";

import React, { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { Provider } from "react-redux";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { store } from "@/store/store";
import { useAppDispatch } from "@/store/hooks";
import { setSessionUser } from "@/store/slices/authSlice";

function SessionSync({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (session?.user) {
      dispatch(
        setSessionUser({
          userId: session.user.id,
          userName: session.user.name,
          userEmail: session.user.email,
          role: session.user.role,
        })
      );
    } else {
      dispatch(setSessionUser(null));
    }
  }, [session, dispatch]);

  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <Provider store={store}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <SessionSync>{children}</SessionSync>
          <Toaster richColors position="top-right" closeButton />
        </ThemeProvider>
      </Provider>
    </SessionProvider>
  );
}
