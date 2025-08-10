'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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

interface ApiError {
  message?: string;
}

/** ---------- Helpers ---------- */
const isNumeric = (v: unknown) =>
  typeof v === 'number' ||
  (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v)));

type TxLoose = {
  id: number | string;
  title: string;
  amount: number | string;
  type: string;
  category: string;
};

const coerceTx = (t: TxLoose): Transaction => ({
  id: Number(t.id),
  title: String(t.title ?? ''),
  amount: Number(t.amount),
  type: String(t.type ?? ''),
  category: String(t.category ?? ''),
});
/** -------------------------------- */

export default function TransactionList() {
  const { token } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const hasFetchedRef = useRef(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchTransactions = useCallback(async () => {
    if (!token) {
      showSnackbar('No auth token. Please sign in.', 'error');
      setTransactions([]);
      return;
    }

    setLoading(true);
    try {
      const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
      const url = `${base}/api/transactions`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const ct = res.headers.get('content-type') || '';
      if (!res.ok) {
        let msg: string | undefined;
        if (ct.includes('application/json')) {
          try {
            const err = await res.json();
            msg = err?.message;
          } catch {}
        } else {
          msg = await res.text();
        }
        showSnackbar(msg || `Failed to fetch transactions (${res.status})`, 'error');
        setTransactions([]);
        return;
      }

      let parsed: any = ct.includes('application/json') ? await res.json() : {};
      const rawList: any[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.transactions)
        ? parsed.transactions
        : [];

      const list: Transaction[] = rawList
        .filter(
          (t) =>
            isNumeric(t.id) &&
            typeof t.title === 'string' &&
            isNumeric(t.amount) &&
            typeof t.type === 'string' &&
            typeof t.category === 'string'
        )
        .map(coerceTx);

      setTransactions(list);
      setPage(1);
    } catch (err) {
      console.error('[transactions] fetch error:', err);
      showSnackbar('Network error while fetching transactions', 'error');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [token, showSnackbar]);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchTransactions();
  }, [fetchTransactions]);

  // Pagination derived values
  const total = transactions.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return transactions.slice(start, start + pageSize);
  }, [transactions, currentPage, pageSize]);

  const from = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = total === 0 ? 0 : Math.min(currentPage * pageSize, total);

  const performDelete = useCallback(
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

  const Row = useCallback(
    ({ index, style }: ListChildComponentProps) => (
      <div style={style}>
        <TransactionItem transaction={paged[index]} onDelete={performDelete} />
      </div>
    ),
    [paged, performDelete]
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
          className="text-sm text-purple-600 hover:underline disabled:opacity-50"
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
            itemKey={(index) => paged[index].id}
          >
            {Row}
          </List>
          <Pagination />
        </>
      )}
    </div>
  );
}

