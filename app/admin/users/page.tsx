'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error' as 'success' | 'error',
  });

  const handleClose = () => setSnackbar((prev) => ({ ...prev, open: false }));

  useEffect(() => {
    // Guard: only admins
    const role = (user?.role || '').trim().toLowerCase();
    if (role !== 'admin') {
      setSnackbar({ open: true, message: 'Access denied', severity: 'error' });
      return;
    }

    let cancelled = false;

    const fetchUsers = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const isJson = res.headers.get('content-type')?.includes('application/json');
        const payload = isJson ? await res.json() : { message: await res.text() };

        if (!res.ok) {
          const msg = (payload as { message?: string })?.message || 'Failed to fetch users';
          throw new Error(msg);
        }

        if (!cancelled) setUsers(payload as User[]);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'An unknown error occurred';
        if (!cancelled) setSnackbar({ open: true, message: msg, severity: 'error' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchUsers();
    return () => {
      cancelled = true;
    };
  }, [token, user]);

  // Non-admin view
  if ((user?.role || '').trim().toLowerCase() !== 'admin') {
    return (
      <>
        <p className="text-red-600">You are not authorized to view this page.</p>
        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleClose}
        >
          <MuiAlert onClose={handleClose} severity={snackbar.severity} variant="filled">
            {snackbar.message}
          </MuiAlert>
        </Snackbar>
      </>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">All Users</h2>
        <span className="text-sm text-gray-500">{loading ? 'Loading…' : `Total: ${users.length}`}</span>
      </div>

      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="border border-gray-200 p-2">ID</th>
              <th className="border border-gray-200 p-2">Name</th>
              <th className="border border-gray-200 p-2">Email</th>
              <th className="border border-gray-200 p-2">Role</th>
              <th className="border border-gray-200 p-2">Created At</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="odd:bg-white even:bg-gray-50">
                <td className="border border-gray-200 p-2">{u.id}</td>
                <td className="border border-gray-200 p-2">{u.name}</td>
                <td className="border border-gray-200 p-2">{u.email}</td>
                <td className="border border-gray-200 p-2 capitalize">{u.role}</td>
                <td className="border border-gray-200 p-2">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
            {users.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Snackbar */}
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleClose}
      >
        <MuiAlert onClose={handleClose} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </div>
  );
}
