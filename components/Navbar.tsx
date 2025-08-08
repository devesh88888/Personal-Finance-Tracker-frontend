'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login'); // Redirect to login page
  };

  return (
    <nav className="flex justify-between items-center p-4 bg-purple-600 text-white">
      <Link href="/" className="font-bold text-lg">Finance Tracker</Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            {/* Authenticated navigation buttons */}
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/transactions" className="hover:underline">Transactions</Link>

            <span>{user.name} ({user.role})</span>
            <button
              onClick={handleLogout}
              className="bg-white text-purple-600 px-3 py-1 rounded"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            {/* Guest links */}
            <Link href="/login" className="underline">Login</Link>
            <Link href="/register" className="underline">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
