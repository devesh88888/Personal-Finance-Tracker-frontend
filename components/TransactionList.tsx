'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import TransactionItem from './TransactionItem';
import TransactionSummary from './TransactionSummary';
import { FixedSizeList as List } from 'react-window';

interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: string;
  category: string;
}

export default function TransactionList() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      console.log('Fetched transaction data:', data); // Debug

      if (Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      } else {
        console.error('Unexpected response structure:', data);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleDelete = useCallback((id: number) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div className="space-y-3">
      <TransactionSummary transactions={transactions} />

      {transactions.length === 0 ? (
        <p className="text-gray-500">No transactions yet.</p>
      ) : (
        <List
          height={400}
          itemCount={transactions.length}
          itemSize={72}
          width={'100%'}
        >
          {({ index, style }) => (
            <div style={style}>
              <TransactionItem transaction={transactions[index]} onDelete={handleDelete} />
            </div>
          )}
        </List>
      )}
    </div>
  );
}
