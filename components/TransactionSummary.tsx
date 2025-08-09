'use client';

import { useMemo } from 'react';

interface Transaction {
  id: number;
  title: string;
  amount: number | string;
  type: 'income' | 'expense' | string;
  category: string;
}

interface Props {
  transactions: Transaction[];
}

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n);

export default function TransactionSummary({ transactions }: Props) {
  const { income, expense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const t of transactions) {
      const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
      if (!Number.isFinite(amount) || amount <= 0) continue;

      if (t.type === 'income') income += amount;
      else if (t.type === 'expense') expense += amount;
    }

    return { income, expense, balance: income - expense };
  }, [transactions]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded border">
      <div className="flex items-center justify-between sm:block">
        <span className="text-sm text-gray-600">💰 Income</span>
        <div className="text-green-600 font-semibold">{formatINR(income)}</div>
      </div>

      <div className="flex items-center justify-between sm:block">
        <span className="text-sm text-gray-600">🧾 Expenses</span>
        <div className="text-red-600 font-semibold">{formatINR(expense)}</div>
      </div>

      <div className="flex items-center justify-between sm:block">
        <span className="text-sm text-gray-600">🧮 Balance</span>
        <div
          className={`font-semibold ${
            balance >= 0 ? 'text-green-700' : 'text-red-700'
          }`}
        >
          {formatINR(balance)}
        </div>
      </div>
    </div>
  );
}
