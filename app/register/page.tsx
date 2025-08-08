'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Registered! Please login.');
        router.push('/login');
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (err) {
      alert('Registration error');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border px-3 py-2 rounded" placeholder="Name" required />
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="border px-3 py-2 rounded" placeholder="Email" required />
        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="border px-3 py-2 rounded" placeholder="Password" required />
        <button type="submit" className="bg-purple-600 text-white py-2 rounded">Register</button>
      </form>
    </div>
  );
}
