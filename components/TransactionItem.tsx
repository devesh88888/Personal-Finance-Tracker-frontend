'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSnackbar } from '@/contexts/SnackbarContext';

interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: string;
  category: string;
}

interface Props {
  transaction: Transaction;
  onDelete: (id: number) => void;
}

export default function TransactionItem({ transaction, onDelete }: Props) {
  const { token, user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = useCallback(async () => {
    if (user?.role === 'read-only') {
      showSnackbar('Read-only users cannot delete transactions', 'error');
      return;
    }
    if (deleting) return;

    const confirm = window.confirm(`Delete "${transaction.title}"?`);
    if (!confirm) return;

    setDeleting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transactions/${transaction.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await res.json() : { message: await res.text() };

      if (!res.ok) {
        const msg =
          res.status === 403
            ? 'You do not have permission to delete this.'
            : res.status === 429
            ? 'Too many requests. Please try again later.'
            : data?.message || 'Delete failed';
        showSnackbar(msg, 'error');
        return;
      }

      onDelete(transaction.id);
      showSnackbar('Transaction deleted', 'success');
    } catch {
      showSnackbar('Network error. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  }, [user?.role, deleting, token, transaction.id, transaction.title, onDelete, showSnackbar]);

  return (
    <div className="flex justify-between items-center border-b py-2">
      <div>
        <h3 className="font-semibold">{transaction.title}</h3>
        <p className="text-sm text-gray-500">
          ₹{transaction.amount} | {transaction.type} | {transaction.category}
        </p>
      </div>

      {user?.role !== 'read-only' && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`text-red-600 hover:underline ${
            deleting ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      )}
    </div>
  );
}
