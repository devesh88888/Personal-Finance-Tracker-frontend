'use client';

import { useAuth } from '@/contexts/AuthContext';

interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: string;
  category: string;
}

interface Props {
  transaction: Transaction;
  onDelete: (id: number) => void;
}

export default function TransactionItem({ transaction, onDelete }: Props) {
  const { token, user } = useAuth();

  const handleDelete = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions/${transaction.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      onDelete(transaction.id);
    } else {
      alert('Delete failed');
    }
  };

  return (
    <div className="flex justify-between items-center border-b py-2">
      <div>
        <h3 className="font-semibold">{transaction.title}</h3>
        <p className="text-sm text-gray-500">
          ₹{transaction.amount} | {transaction.type} | {transaction.category}
        </p>
      </div>
      {user?.role !== 'read-only' && (
        <button onClick={handleDelete} className="text-red-600 hover:underline">Delete</button>
      )}
    </div>
  );
}
