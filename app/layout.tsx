// frontend/app/layout.tsx
import '../styles/globals.css';
import { ReactNode } from 'react';
import { SnackbarProvider } from '@/contexts/SnackbarContext';
import { AuthProvider } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Finance Tracker',
  description: 'Track your finances securely',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SnackbarProvider>
          <AuthProvider>
            <Navbar />
            <main className="p-6">{children}</main>
          </AuthProvider>
        </SnackbarProvider>
      </body>
    </html>
  );
}
