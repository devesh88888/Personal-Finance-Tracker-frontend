'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSnackbar } from '@/contexts/SnackbarContext';

interface Props {
  onAdd: () => void; // parent should refetch on success
}

export default function TransactionForm({ onAdd }: Props) {
  const { token, user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    amount: '',
    type: 'expense' as 'expense' | 'income',
    category: '',
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!token) {
      showSnackbar('You need to sign in first', 'error');
      return;
    }
    if (user?.role === 'read-only') {
      showSnackbar('Read-only users cannot add transactions', 'error');
      return;
    }

    const amountNum = Number(form.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      showSnackbar('Please enter a valid amount greater than 0', 'error');
      return;
    }

    const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
    const url = `${base}/api/transactions`;

    // tracer: confirm this form is the one sending the request
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[TransactionForm] POST', url);
    }

    setSubmitting(true);
    try {
      const res = await fetch(url, {
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

      const ct = res.headers.get('content-type') || '';
      if (!res.ok) {
        let message: string | undefined;
        if (ct.includes('application/json')) {
          try {
            const body = (await res.json()) as { message?: string };
            message = body?.message;
          } catch { /* ignore */ }
        } else {
          try {
            message = await res.text();
          } catch { /* ignore */ }
        }
        showSnackbar(message || `Failed to add transaction (${res.status})`, 'error');
        return;
      }

      // success
      setForm({ title: '', amount: '', type: 'expense', category: '' });
      showSnackbar('Transaction added!', 'success');
      onAdd(); // parent refetches list
    } catch {
      showSnackbar('Network error. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [form, token, user?.role, submitting, showSnackbar, onAdd]);

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
          onChange={(e) => setForm({ ...form, type: e.target.value as 'expense' | 'income' })}
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
