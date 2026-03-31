"use client"

import React from "react"
import { SessionProvider } from "next-auth/react"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "./ThemeContext"
import { AuthProvider } from "./AuthContext"
import { FavoritesProvider } from "./FavoritesContext"

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    <AuthProvider>
                        <FavoritesProvider>
                            {children}
                        </FavoritesProvider>
                    </AuthProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </SessionProvider>
    )
}
