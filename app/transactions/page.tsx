'use client';

import { Suspense, lazy, useState } from 'react';

const TransactionForm = lazy(() => import('@/components/TransactionForm'));
const TransactionList = lazy(() => import('@/components/TransactionList'));

export default function TransactionsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Transactions</h1>

      <Suspense fallback={<p>Loading form...</p>}>
        <TransactionForm onAdd={() => setRefreshKey(prev => prev + 1)} />
      </Suspense>

      <Suspense fallback={<p>Loading transactions...</p>}>
        <TransactionList key={refreshKey} />
      </Suspense>
    </div>
  );
}
