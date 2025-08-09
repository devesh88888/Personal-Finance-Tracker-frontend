'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertColor } from '@mui/material/Alert';

type SnackState = {
  open: boolean;
  message: string;
  severity: AlertColor;
};

type SnackContextType = {
  showSnackbar: (message: string, severity?: AlertColor) => void;
};

const SnackbarContext = createContext<SnackContextType | undefined>(undefined);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SnackState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = (message: string, severity: AlertColor = 'success') => {
    setState({ open: true, message, severity });
  };

  const handleClose = (
    _e?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') return;
    setState((s) => ({ ...s, open: false }));
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={state.open}
        autoHideDuration={3000}
        onClose={handleClose}
        sx={{ zIndex: 1300 }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={handleClose}
          severity={state.severity}
          sx={{ width: '100%' }}
        >
          {state.message}
        </MuiAlert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error('useSnackbar must be used within SnackbarProvider');
  return ctx;
}
