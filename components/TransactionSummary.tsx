'use client';

import { useMemo } from 'react';

interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: string;
  category: string;
}

interface Props {
  transactions: Transaction[];
}

export default function TransactionSummary({ transactions }: Props) {
  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        if (t.type === 'income') acc.income += t.amount;
        else acc.expense += t.amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [transactions]);

  return (
    <div className="flex justify-between bg-gray-100 p-4 rounded mb-4">
      <span>💰 Income: ₹{totals.income}</span>
      <span>🧾 Expenses: ₹{totals.expense}</span>
    </div>
  );
}
