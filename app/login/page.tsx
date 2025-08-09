'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertColor } from '@mui/material/Alert';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
  }>({ open: false, message: '', severity: 'success' });

  const handleClose = (_?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) {
      setSnackbar({
        open: true,
        message: 'Missing NEXT_PUBLIC_API_URL. Check your .env.',
        severity: 'error',
      });
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await res.json() : { message: await res.text() };

      if (res.ok) {
        login(data.user, data.token);
        setSnackbar({ open: true, message: 'Login successful!', severity: 'success' });
        setTimeout(() => router.push('/'), 800);
      } else {
        const msg =
          res.status === 429
            ? 'Too many login attempts. Please try again later.'
            : data?.message || 'Login failed';
        setSnackbar({ open: true, message: msg, severity: 'error' });
      }
    } catch {
      setSnackbar({
        open: true,
        message: 'Network error. Please try again.',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Login</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border px-3 py-2 rounded"
          placeholder="Email"
          required
          autoComplete="email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border px-3 py-2 rounded"
          placeholder="Password"
          required
          autoComplete="current-password"
        />
        <button
          type="submit"
          disabled={submitting}
          className={`bg-purple-600 text-white py-2 rounded transition ${
            submitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-purple-700'
          }`}
        >
          {submitting ? 'Logging in…' : 'Login'}
        </button>
      </form>

      {/* Snackbar Notification */}
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleClose}
        sx={{ zIndex: 1300 }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={handleClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          <span aria-live="assertive">{snackbar.message}</span>
        </MuiAlert>
      </Snackbar>
    </div>
  );
}
