'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSnackbar } from '@/contexts/SnackbarContext';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

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
  const { showSnackbar } = useSnackbar();

  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const openConfirm = useCallback(() => {
    if (user?.role === 'read-only') {
      showSnackbar('Read-only users cannot delete transactions', 'error');
      return;
    }
    setConfirmOpen(true);
  }, [user?.role, showSnackbar]);

  const closeConfirm = useCallback(() => {
    if (!deleting) setConfirmOpen(false);
  }, [deleting]);

  const handleConfirmDelete = useCallback(async () => {
    if (deleting) return;

    setDeleting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transactions/${transaction.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await res.json() : { message: await res.text() };

      if (!res.ok) {
        const msg =
          res.status === 403
            ? 'You do not have permission to delete this.'
            : res.status === 429
            ? 'Too many requests. Please try again later.'
            : (data as { message?: string })?.message || 'Delete failed';
        showSnackbar(msg, 'error');
        return;
      }

      onDelete(transaction.id);
      showSnackbar('Transaction deleted', 'success');
      setConfirmOpen(false);
    } catch {
      showSnackbar('Network error. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  }, [deleting, token, transaction.id, onDelete, showSnackbar]);

  return (
    <div className="flex justify-between items-center border-b py-2">
      <div>
        <h3 className="font-semibold">{transaction.title}</h3>
        <p className="text-sm text-gray-500">
          ₹{transaction.amount} | {transaction.type} | {transaction.category}
        </p>
      </div>

      {user?.role !== 'read-only' && (
        <Button
          onClick={openConfirm}
          disabled={deleting}
          color="error"
          variant="text"
          sx={{ textTransform: 'none' }}
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      )}

      <Dialog
        open={confirmOpen}
        onClose={closeConfirm}
        aria-labelledby="delete-transaction-title"
      >
        <DialogTitle id="delete-transaction-title">Delete transaction?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete “{transaction.title}”? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            disabled={deleting}
            color="error"
            variant="contained"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
