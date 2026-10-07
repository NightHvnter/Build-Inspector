import React, { useState } from 'react';
import { Box, Button, Link, Paper, TextField, Typography } from '@mui/material';

interface AuthPageProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, onCancel }) => {
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Qui puoi inserire la logica di chiamata API o autenticazione reale
    onLoginSuccess();
  };

  return (
    <>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        {authMode === 'register' ? 'Crea il tuo account' : 'Accedi'}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 640 }}>
        {authMode === 'register'
          ? 'Registrati per salvare le tue configurazioni hardware e sbloccare i benchmark.'
          : 'Inserisci le tue credenziali per accedere al tuo profilo.'}
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}
      >
        <TextField
          label="Indirizzo email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button type="submit" variant="contained">
            {authMode === 'register' ? 'Registrati' : 'Accedi'}
          </Button>
          <Button variant="outlined" color="inherit" onClick={onCancel}>
            Annulla
          </Button>
        </Box>
      </Box>

      <Paper
        variant="outlined"
        sx={{ mt: 4, p: 2.5, maxWidth: 400, borderLeft: 3, borderLeftColor: 'primary.main' }}
      >
        <Typography variant="body2">
          {authMode === 'register' ? 'Hai già un account?' : 'Non hai un account?'}{' '}
          <Link
            component="button"
            type="button"
            variant="body2"
            onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}
          >
            {authMode === 'register' ? 'Accedi qui' : 'Registrati qui'}
          </Link>
        </Typography>
      </Paper>
    </>
  );
};