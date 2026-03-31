"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from './ThemeContext';
import { FavoritesProvider } from './FavoritesContext';
import { AuthProvider } from './AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <AuthProvider>
          <FavoritesProvider>
            {children}
          </FavoritesProvider>
        </AuthProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}