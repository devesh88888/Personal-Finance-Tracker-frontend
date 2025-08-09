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
  type: 'income' | 'expense' | string;
  category: string;
}

type ApiError = { message?: string };

type TransactionsEnvelope = { transactions: Transaction[] };

function isApiError(v: unknown): v is ApiError {
  return typeof v === 'object' && v !== null && 'message' in v;
}

function isTransaction(v: unknown): v is Transaction {
  if (typeof v !== 'object' || v === null) return false;
  const t = v as Record<string, unknown>;
  return (
    typeof t.id === 'number' &&
    typeof t.title === 'string' &&
    typeof t.amount === 'number' &&
    typeof t.type === 'string' &&
    typeof t.category === 'string'
  );
}

function isTransactionArray(v: unknown): v is Transaction[] {
  return Array.isArray(v) && v.every(isTransaction);
}

function isTransactionsEnvelope(v: unknown): v is TransactionsEnvelope {
  return (
    typeof v === 'object' &&
    v !== null &&
    'transactions' in v &&
    isTransactionArray((v as { transactions: unknown }).transactions)
  );
}

export default function TransactionList() {
  const { token } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchTransactions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const isJson = res.headers.get('content-type')?.includes('application/json') ?? false;
      const payload: unknown = isJson ? await res.json() : await res.text();

      if (!res.ok) {
        const msg =
          res.status === 429
            ? 'Too many requests. Please try again later.'
            : (isApiError(payload) && payload.message) || 'Failed to fetch transactions';
        showSnackbar(msg, 'error');
        setTransactions([]);
        return;
      }

      let list: Transaction[] = [];
      if (isTransactionArray(payload)) {
        list = payload;
      } else if (isTransactionsEnvelope(payload)) {
        list = payload.transactions;
      } else {
        // Unexpected shape; keep empty and notify
        showSnackbar('Unexpected response format for transactions', 'error');
        list = [];
      }

      setTransactions(list);
      setPage(1); // reset to first page on new data
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

  // Derived pagination values
  const total = transactions.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return transactions.slice(start, end);
  }, [transactions, currentPage, pageSize]);

  const from = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = total === 0 ? 0 : Math.min(currentPage * pageSize, total);

  // Delete handler adjusts page if needed
  const handleDelete = useCallback(
    (id: number) => {
      setTransactions((prev) => {
        const next = prev.filter((t) => t.id !== id);
        const nextTotalPages = Math.max(1, Math.ceil(next.length / pageSize));
        if (currentPage > nextTotalPages) setPage(nextTotalPages);
        return next;
      });
      showSnackbar('Transaction deleted', 'success');
    },
    [showSnackbar, currentPage, pageSize]
  );

  const itemKey = useCallback((index: number, items: Transaction[]) => items[index].id, []);

  const Row = useCallback(
    ({ index, style }: ListChildComponentProps) => (
      <div style={style}>
        <TransactionItem transaction={paged[index]} onDelete={handleDelete} />
      </div>
    ),
    [paged, handleDelete]
  );

  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  const Pagination = () => (
    <div className="flex items-center justify-between text-sm mt-2">
      <div className="text-gray-600">
        Showing <span className="font-medium">{from}</span>–<span className="font-medium">{to}</span> of{' '}
        <span className="font-medium">{total}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="px-2 py-1 border rounded disabled:opacity-50"
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Prev
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
            let pageNum: number;
            if (totalPages <= 7) {
              pageNum = i + 1;
            } else {
              const start = Math.max(1, Math.min(currentPage - 3, totalPages - 6));
              pageNum = start + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => goTo(pageNum)}
                className={`px-2 py-1 rounded border ${
                  currentPage === pageNum ? 'bg-purple-600 text-white border-purple-600' : ''
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          className="px-2 py-1 border rounded disabled:opacity-50"
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>

        <select
          value={pageSize}
          onChange={(e) => {
            const newSize = Number(e.target.value);
            setPageSize(newSize);
            const firstIndex = (currentPage - 1) * pageSize;
            const newPage = Math.floor(firstIndex / newSize) + 1;
            setPage(newPage);
          }}
          className="ml-2 border rounded px-2 py-1"
        >
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
      </div>
    </div>
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
        <>
          <List
            height={Math.min(400, Math.max(1, paged.length) * 72)}
            itemCount={paged.length}
            itemSize={72}
            width="100%"
            itemKey={(index) => itemKey(index, paged)}
          >
            {Row}
          </List>
          <Pagination />
        </>
      )}
    </div>
  );
}
