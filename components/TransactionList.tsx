'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSnackbar } from '@/contexts/SnackbarContext';
import TransactionItem from './TransactionItem';
import TransactionSummary from './TransactionSummary';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';

interface Transaction {
  id: number;
  title: string;      // treated as "job name"
  amount: number;
  type: string;       // 'income' | 'expense'
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
  const { token, loaded } = useAuth();
  const { showSnackbar } = useSnackbar();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔎 name (job title) search
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // 🧮 filters
  const [minAmt, setMinAmt] = useState<string>('');              // inclusive
  const [maxAmt, setMaxAmt] = useState<string>('');              // inclusive
  const [typeFilter, setTypeFilter] = useState<'all'|'income'|'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const hasFetchedRef = useRef(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /** -------- Fetch transactions -------- */
  const fetchTransactions = useCallback(async () => {
    if (!loaded) return;
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
          } catch {}
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
  /** ------------------------------------- */

  useEffect(() => {
    if (!loaded) return;
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchTransactions();
  }, [loaded, fetchTransactions]);

  // Debounce the title query
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 200);
    return () => clearTimeout(id);
  }, [query]);

  // Unique categories for dropdown (from fetched data)
  const categories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      const c = (t.category || '').trim();
      if (c) set.add(c);
    });
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [transactions]);

  // Combined filtering (title + amount range + type + category)
  const filtered = useMemo(() => {
    const min = minAmt.trim() === '' ? Number.NEGATIVE_INFINITY : Number(minAmt);
    const max = maxAmt.trim() === '' ? Number.POSITIVE_INFINITY : Number(maxAmt);

    return transactions.filter((t) => {
      if (debouncedQuery && !t.title.toLowerCase().includes(debouncedQuery)) return false;

      const amtOk = t.amount >= min && t.amount <= max;
      if (!amtOk) return false;

      if (typeFilter !== 'all' && t.type.toLowerCase() !== typeFilter) return false;

      if (categoryFilter !== 'all' && t.category.toLowerCase() !== categoryFilter.toLowerCase())
        return false;

      return true;
    });
  }, [transactions, debouncedQuery, minAmt, maxAmt, typeFilter, categoryFilter]);

  // reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, minAmt, maxAmt, typeFilter, categoryFilter]);

  // Pagination derived values
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

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

  const clearFilters = () => {
    setQuery('');
    setMinAmt('');
    setMaxAmt('');
    setTypeFilter('all');
    setCategoryFilter('all');
  };

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
      {/* Top bar: summary + controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TransactionSummary transactions={transactions} />

        <div className="flex flex-wrap items-center gap-2">
          {/* Job name search */}
          <label className="sr-only" htmlFor="job-search">Search jobs</label>
          <input
            id="job-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs by name…"
            className="border rounded px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />

          {/* Amount range */}
          <div className="flex items-center gap-1">
            <label className="sr-only" htmlFor="min-amt">Min amount</label>
            <input
              id="min-amt"
              type="number"
              inputMode="decimal"
              value={minAmt}
              onChange={(e) => setMinAmt(e.target.value)}
              placeholder="Min ₹"
              className="border rounded px-2 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <span className="text-gray-500">–</span>
            <label className="sr-only" htmlFor="max-amt">Max amount</label>
            <input
              id="max-amt"
              type="number"
              inputMode="decimal"
              value={maxAmt}
              onChange={(e) => setMaxAmt(e.target.value)}
              placeholder="Max ₹"
              className="border rounded px-2 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          {/* Type filter */}
          <label className="sr-only" htmlFor="type-filter">Type</label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all'|'income'|'expense')}
            className="border rounded px-2 py-1.5 text-sm"
          >
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          {/* Category filter */}
          <label className="sr-only" htmlFor="category-filter">Category</label>
          <select
            id="category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border rounded px-2 py-1.5 text-sm max-w-[12rem]"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All categories' : c}
              </option>
            ))}
          </select>

          {/* Clear + Refresh */}
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:underline"
            title="Clear all filters"
          >
            Clear
          </button>

          <button
            onClick={fetchTransactions}
            className="text-sm text-purple-600 hover:underline disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <p className="text-gray-500">Loading transactions…</p>
      ) : total === 0 ? (
        debouncedQuery || minAmt || maxAmt || typeFilter !== 'all' || categoryFilter !== 'all' ? (
          <p className="text-gray-500">No results match your filters.</p>
        ) : (
          <p className="text-gray-500">No transactions yet.</p>
        )
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
