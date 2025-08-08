'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex justify-between items-center p-4 bg-purple-600 text-white">
      <Link href="/" className="font-bold text-lg">Finance Tracker</Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span>{user.name} ({user.role})</span>
            <button onClick={logout} className="bg-white text-purple-600 px-3 py-1 rounded">Logout</button>
          </>
        ) : (
          <>
            <Link href="/login" className="underline">Login</Link>
            <Link href="/register" className="underline">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
