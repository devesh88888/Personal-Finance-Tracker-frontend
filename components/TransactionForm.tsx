'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  onAdd: () => void;
}

export default function TransactionForm({ onAdd }: Props) {
  const { token, user } = useAuth();
  const [form, setForm] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount),
      }),
    });

    if (res.ok) {
      setForm({ title: '', amount: '', type: 'expense', category: '' });
      onAdd();
    } else {
      alert('Failed to add transaction');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-6">
      <div className="flex gap-4">
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="border px-3 py-2 rounded w-full"
          placeholder="Title"
          required
          disabled={user?.role === 'read-only'}
        />
        <input
          type="number"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="border px-3 py-2 rounded w-full"
          placeholder="Amount"
          required
          disabled={user?.role === 'read-only'}
        />
      </div>
      <div className="flex gap-4">
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="border px-3 py-2 rounded w-full"
          disabled={user?.role === 'read-only'}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input
          type="text"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="border px-3 py-2 rounded w-full"
          placeholder="Category"
          required
          disabled={user?.role === 'read-only'}
        />
      </div>
      {user?.role !== 'read-only' && (
        <button className="bg-purple-600 text-white px-4 py-2 rounded">Add Transaction</button>
      )}
    </form>
  );
}
