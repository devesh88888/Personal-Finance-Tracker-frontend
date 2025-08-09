'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertColor } from '@mui/material/Alert';

type Role = 'user' | 'read-only' | 'admin';

export default function RegisterPage() {
  const [form, setForm] = useState<{ name: string; email: string; password: string; role: Role }>({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
  }>({ open: false, message: '', severity: 'success' });

  const handleClose = (_e?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // simple client-side guards
    if (!form.name.trim() || !form.email.trim()) {
      setSnackbar({ open: true, message: 'Name and email are required', severity: 'error' });
      return;
    }
    if (form.password.length < 6) {
      setSnackbar({ open: true, message: 'Password must be at least 6 characters', severity: 'error' });
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) {
      setSnackbar({ open: true, message: 'Missing NEXT_PUBLIC_API_URL. Check your .env.', severity: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // normalize role defensively
        body: JSON.stringify({ ...form, role: (form.role || 'user').toLowerCase() as Role }),
      });

      const isJson = res.headers.get('content-type')?.includes('application/json');
      const payload = isJson ? await res.json() : { message: await res.text() };

      if (res.ok) {
        setSnackbar({ open: true, message: 'Registered! Please login.', severity: 'success' });
        setTimeout(() => router.push('/login'), 800);
      } else {
        const msg =
          res.status === 429
            ? 'Too many attempts. Please try again later.'
            : payload?.message || 'Registration failed';
        setSnackbar({ open: true, message: msg, severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Registration error. Please try again.', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Register</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border px-3 py-2 rounded"
          placeholder="Name"
          required
          autoComplete="name"
        />

        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="border px-3 py-2 rounded"
          placeholder="Email"
          required
          autoComplete="email"
        />

        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="border px-3 py-2 rounded"
          placeholder="Password (min 6 chars)"
          required
          autoComplete="new-password"
        />

        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
          className="border px-3 py-2 rounded"
        >
          <option value="user">User</option>
          <option value="read-only">Read-only</option>
          <option value="admin">Admin</option>
        </select>

        <button
          type="submit"
          disabled={submitting}
          className={`bg-purple-600 text-white py-2 rounded ${
            submitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-purple-700 transition'
          }`}
        >
          {submitting ? 'Registering…' : 'Register'}
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
        <MuiAlert elevation={6} variant="filled" onClose={handleClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          <span aria-live="assertive">{snackbar.message}</span>
        </MuiAlert>
      </Snackbar>
    </div>
  );
}
