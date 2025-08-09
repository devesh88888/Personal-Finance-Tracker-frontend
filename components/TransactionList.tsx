'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSnackbar } from '@/contexts/SnackbarContext';
import TransactionItem from './TransactionItem';
import TransactionSummary from './TransactionSummary';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';

interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: string;
  category: string;
}

export default function TransactionList() {
  const { token } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await res.json() : await res.text();

      if (!res.ok) {
        const msg =
          res.status === 429
            ? 'Too many requests. Please try again later.'
            : (isJson && (data as any)?.message) || 'Failed to fetch transactions';
        showSnackbar(msg, 'error');
        setTransactions([]);
        return;
      }

      // Accept both shapes:
      // 1) Array of transactions
      // 2) { transactions: [...] }
      const list = Array.isArray(data)
        ? (data as Transaction[])
        : Array.isArray((data as any)?.transactions)
        ? ((data as any).transactions as Transaction[])
        : [];

      setTransactions(list);
    } catch {
      showSnackbar('Network error while fetching transactions', 'error');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [token, showSnackbar]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = useCallback((id: number) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showSnackbar('Transaction deleted', 'success');
  }, [showSnackbar]);

  const itemKey = useCallback((index: number, items: Transaction[]) => items[index].id, []);

  const Row = useCallback(
    ({ index, style }: ListChildComponentProps) => (
      <div style={style}>
        <TransactionItem transaction={transactions[index]} onDelete={handleDelete} />
      </div>
    ),
    [transactions, handleDelete]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <TransactionSummary transactions={transactions} />
        <button
          onClick={fetchTransactions}
          className="text-sm text-purple-600 hover:underline"
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading transactions…</p>
      ) : transactions.length === 0 ? (
        <p className="text-gray-500">No transactions yet.</p>
      ) : (
        <List
          height={400}
          itemCount={transactions.length}
          itemSize={72}
          width="100%"
          itemKey={(index) => itemKey(index, transactions)}
        >
          {Row}
        </List>
      )}
    </div>
  );
}
