import React, { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

const styles: { [key: string]: React.CSSProperties } = {
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(5, 3, 10, 0.85)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '1rem'
  },
  modalCard: {
    backgroundColor: '#130d24',
    border: '1px solid rgba(192, 132, 252, 0.4)',
    borderRadius: '24px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(147, 51, 234, 0.3)',
    textAlign: 'center',
    position: 'relative'
  },
  closeButton: {
    position: 'absolute',
    top: '1rem',
    right: '1.2rem',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.4rem',
    cursor: 'pointer'
  },
  inputField: {
    width: '100%',
    padding: '0.85rem 1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '0.95rem',
    marginBottom: '1rem',
    outline: 'none'
  },
  ctaButtonModal: {
    backgroundColor: '#9333ea',
    backgroundImage: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '0.9rem',
    borderRadius: '30px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    width: '100%',
    marginTop: '0.5rem',
    boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)'
  }
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Qui puoi inserire la logica di chiamata API o autenticazione reale
    onLoginSuccess();
    onClose();
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose}>
          ✕
        </button>

        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          {authMode === 'register' ? 'Crea il tuo Account' : 'Bentornato!'}
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          {authMode === 'register'
            ? 'Accedi subito per salvare le tue configurazioni hardware e sbloccare i benchmark.'
            : 'Inserisci le tue credenziali per accedere al tuo profilo.'}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Indirizzo Email"
            style={styles.inputField}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            style={styles.inputField}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" style={styles.ctaButtonModal}>
            {authMode === 'register' ? 'Registrati Gratis' : 'Accedi'}
          </button>
        </form>

        <div style={{ marginTop: '1.2rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          {authMode === 'register' ? 'Hai già un account?' : 'Non hai un account?'}{' '}
          <span
            style={{ color: '#c084fc', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}
          >
            {authMode === 'register' ? 'Accedi qui' : 'Registrati qui'}
          </span>
        </div>
      </div>
    </div>
  );
};