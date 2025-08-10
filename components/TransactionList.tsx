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

/* ---------- Loose API typing (no `any`) ---------- */
type ApiTxUnknown = Record<string, unknown>;
type ApiTxArray = ApiTxUnknown[];
type ApiEnvelope = { transactions: ApiTxArray };

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

const isApiTxUnknown = (v: unknown): v is ApiTxUnknown => isObject(v);

const isApiTxArray = (v: unknown): v is ApiTxArray =>
  Array.isArray(v) && v.every(isApiTxUnknown);

const isApiEnvelope = (v: unknown): v is ApiEnvelope =>
  isObject(v) && 'transactions' in v && isApiTxArray((v as { transactions: unknown }).transactions);

const toNumber = (v: unknown): number =>
  typeof v === 'number'
    ? v
    : typeof v === 'string' && v.trim() !== ''
    ? Number(v)
    : 0;

const toString = (v: unknown): string =>
  typeof v === 'string' ? v : String(v ?? '');
/* ------------------------------------------------ */

export default function TransactionList() {
  const { token, loaded } = useAuth(); // 👈 use loaded guard
  const { showSnackbar } = useSnackbar();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const hasFetchedRef = useRef(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /** -------- Fetch transactions (tolerant, no `any`) -------- */
  const fetchTransactions = useCallback(async () => {
    if (!loaded) return; // 👈 wait for hydration
    if (!token) {
      showSnackbar('No auth token. Please sign in.', 'error');
      setTransactions([]);
      return;
    }

    setLoading(true);
    try {
      const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
      const url = `${base}/api/transactions`;

      if (process.env.NODE_ENV !== 'production') {
        // tracer: confirm which file fires the request
        // eslint-disable-next-line no-console
        console.log('[TransactionList] GET', url);
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const ct = res.headers.get('content-type') || '';

      if (!res.ok) {
        let message: string | undefined;
        if (ct.includes('application/json')) {
          try {
            const errJson = (await res.json()) as { message?: string };
            message = errJson?.message;
          } catch {
            /* ignore */
          }
        } else {
          message = await res.text();
        }
        showSnackbar(message || `Failed to fetch transactions (${res.status})`, 'error');
        setTransactions([]);
        return;
      }

      const parsed: unknown = ct.includes('application/json') ? await res.json() : {};

      const raw: ApiTxArray = isApiTxArray(parsed)
        ? parsed
        : isApiEnvelope(parsed)
        ? parsed.transactions
        : [];

      const list: Transaction[] = raw.map((t) => ({
        id: toNumber(t.id),
        title: toString(t.title),
        amount: toNumber(t.amount),
        type: toString(t.type),
        category: toString(t.category),
      }));

      setTransactions(list);
      setPage(1);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[transactions] fetch error:', err);
      showSnackbar('Network error while fetching transactions', 'error');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [loaded, token, showSnackbar]);
  /** -------------------------------------------------------- */

  useEffect(() => {
    if (!loaded) return;                // 👈 wait for hydration
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchTransactions();
  }, [loaded, fetchTransactions]);

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

  if (!loaded) {
    return <p className="text-gray-500">Loading…</p>;
  }

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
