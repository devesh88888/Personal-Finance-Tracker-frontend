'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSnackbar } from '@/contexts/SnackbarContext';

interface Props {
  onAdd: () => void;
}

export default function TransactionForm({ onAdd }: Props) {
  const { token, user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: '',
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (user?.role === 'read-only') {
      showSnackbar('Read-only users cannot add transactions', 'error');
      return;
    }

    const amountNum = parseFloat(form.amount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      showSnackbar('Please enter a valid amount greater than 0', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          amount: amountNum,
          type: form.type,
          category: form.category.trim(),
        }),
      });

      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await res.json() : { message: await res.text() };

      if (!res.ok) {
        const message =
          res.status === 429
            ? 'Too many requests. Please try again later.'
            : data?.message || 'Failed to add transaction';
        showSnackbar(message, 'error');
        return;
      }

      // Success
      setForm({ title: '', amount: '', type: 'expense', category: '' });
      showSnackbar('Transaction added!', 'success');
      onAdd(); // refresh list
    } catch {
      showSnackbar('Network error. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [form, token, user?.role, submitting, onAdd, showSnackbar]);

  const disabled = user?.role === 'read-only' || submitting;

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
          disabled={disabled}
        />
        <input
          type="number"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="border px-3 py-2 rounded w-full"
          placeholder="Amount"
          min="0"
          step="0.01"
          required
          disabled={disabled}
        />
      </div>

      <div className="flex gap-4">
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="border px-3 py-2 rounded w-full"
          disabled={disabled}
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
          disabled={disabled}
        />
      </div>

      {user?.role !== 'read-only' && (
        <button
          type="submit"
          disabled={disabled}
          className={`bg-purple-600 text-white px-4 py-2 rounded ${
            disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-purple-700 transition'
          }`}
        >
          {submitting ? 'Adding…' : 'Add Transaction'}
        </button>
      )}
    </form>
  );
}
