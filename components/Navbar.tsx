'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout(); // shows snackbar in AuthContext
      router.push('/login');
    } finally {
      setLoggingOut(false);
    }
  }, [logout, router, loggingOut]);

  const linkCls = (href: string) =>
    `hover:underline ${pathname === href ? 'font-semibold underline' : ''}`;

  // ✅ Normalize role so "Admin", " admin " etc. all work
  const normalizedRole = useMemo(
    () => (user?.role ? String(user.role).trim().toLowerCase() : ''),
    [user?.role]
  );
  const isAdmin = normalizedRole === 'admin';

  return (
    <nav className="flex justify-between items-center p-4 bg-purple-600 text-white">
      <Link href="/" className="font-bold text-lg">
        Finance Tracker
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link
              href="/dashboard"
              className={linkCls('/dashboard')}
              aria-current={pathname === '/dashboard' ? 'page' : undefined}
            >
              Dashboard
            </Link>

            <Link
              href="/transactions"
              className={linkCls('/transactions')}
              aria-current={pathname === '/transactions' ? 'page' : undefined}
            >
              Transactions
            </Link>

            {/* Admin-only link (case-insensitive) */}
            {isAdmin && (
              <Link
                href="/admin/users"
                className={linkCls('/admin/users')}
                aria-current={pathname === '/admin/users' ? 'page' : undefined}
              >
                Manage Users
              </Link>
            )}

            <span className="hidden sm:flex items-center gap-2">
              <span>{user.name}</span>
              <span className="rounded bg-white/20 px-2 py-0.5 text-xs capitalize">
                {normalizedRole || 'user'}
              </span>
            </span>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className={`bg-white text-purple-600 px-3 py-1 rounded ${
                loggingOut ? 'opacity-60 cursor-not-allowed' : 'hover:bg-purple-100 transition'
              }`}
            >
              {loggingOut ? 'Logging out…' : 'Logout'}
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className={linkCls('/login')}
              aria-current={pathname === '/login' ? 'page' : undefined}
            >
              Login
            </Link>
            <Link
              href="/register"
              className={linkCls('/register')}
              aria-current={pathname === '/register' ? 'page' : undefined}
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
