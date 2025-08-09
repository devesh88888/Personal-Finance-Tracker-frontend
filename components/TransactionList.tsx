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

  // 🔢 Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

      const list = Array.isArray(data)
        ? (data as Transaction[])
        : Array.isArray((data as any)?.transactions)
        ? ((data as any).transactions as Transaction[])
        : [];

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

  // ✅ Derived pagination values
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

  // 🗑️ Delete handler adjusts page if needed
  const handleDelete = useCallback(
    (id: number) => {
      setTransactions((prev) => {
        const next = prev.filter((t) => t.id !== id);
        const nextTotalPages = Math.max(1, Math.ceil(next.length / pageSize));
        if (currentPage > nextTotalPages) {
          setPage(nextTotalPages);
        }
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

  // Render small pagination controls
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

        {/* Simple page numbers (up to 7 buttons). For larger sets, condense with ellipsis */}
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
            // Window around current page if there are many pages
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
            // keep the top of current slice visible
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
          {/* Virtualized list for current page only */}
          <List
            height={Math.min(400, Math.max(1, paged.length) * 72)} // avoid large empty space on small pages
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
