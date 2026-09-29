import React, { useState } from 'react';

interface NavbarProps {
  onGoHome: () => void;
  onGoDashboard: () => void;
  currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onGoHome, onGoDashboard, currentView }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegister, setIsRegister] = useState(true);

  return (
    <>
      <nav style={navStyle}>
        {/* Logo / Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#38bdf8' }}>🎮 Build Inspector</span>
        </div>

        {/* Link di Navigazione */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={onGoHome} 
            style={navButtonStyle(currentView === 'home')}
          >
            🏠 Home
          </button>
          <button 
            onClick={onGoDashboard} 
            style={navButtonStyle(currentView === 'dashboard')}
          >
            📊 Dashboard Log
          </button>
        </div>

        {/* Profilo / Account Utente */}
        <div>
          <button 
            onClick={() => setShowAuthModal(true)} 
            style={userButtonStyle}
            title="Accedi o Registrati"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Accedi</span>
          </button>
        </div>
      </nav>

      {/* Modale di Registrazione / Login */}
      {showAuthModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>{isRegister ? 'Crea un Account' : 'Accedi'}</h2>
              <button onClick={() => setShowAuthModal(false)} style={closeButtonStyle}>✕</button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); alert('Registrazione/Login effettuato!'); setShowAuthModal(false); }}>
              {isRegister && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>Nome Utente</label>
                  <input type="text" required placeholder="Inserisci il tuo username" style={inputStyle} />
                </div>
              )}
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Email</label>
                <input type="email" required placeholder="nome@esempio.com" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Password</label>
                <input type="password" required placeholder="••••••••" style={inputStyle} />
              </div>

              <button type="submit" style={submitButtonStyle}>
                {isRegister ? 'Registrati' : 'Accedi'}
              </button>
            </form>

            <p style={{ marginTop: '16px', fontSize: '14px', color: '#94a3b8', textAlign: 'center' }}>
              {isRegister ? 'Hai già un account?' : 'Non hai un account?'} {' '}
              <span 
                onClick={() => setIsRegister(!isRegister)} 
                style={{ color: '#38bdf8', cursor: 'pointer', textDecoration: 'underline' }}
              >
                {isRegister ? 'Accedi qui' : 'Registrati qui'}
              </span>
            </p>
          </div>
        </div>
      )}
    </>
  );
};

// Stili Navbar e Modale
const navStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 24px',
  backgroundColor: 'rgba(15, 23, 42, 0.85)',
  backdropFilter: 'blur(10px)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  position: 'sticky',
  top: 0,
  zIndex: 100
};

const navButtonStyle = (active: boolean): React.CSSProperties => ({
  backgroundColor: active ? '#38bdf8' : 'transparent',
  color: active ? '#0f172a' : '#f8fafc',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '6px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.2s'
});

const userButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: '#1e293b',
  color: '#f8fafc',
  border: '1px solid #334155',
  padding: '8px 14px',
  borderRadius: '20px',
  cursor: 'pointer',
  fontWeight: 500
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.75)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: '#1e293b',
  padding: '28px',
  borderRadius: '12px',
  width: '100%',
  maxWidth: '400px',
  color: '#f8fafc',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  borderRadius: '6px',
  border: '1px solid #334155',
  backgroundColor: '#0f172a',
  color: '#fff',
  marginTop: '4px',
  boxSizing: 'border-box'
};

const labelStyle: React.CSSProperties = { fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' };
const submitButtonStyle: React.CSSProperties = { width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' };
const closeButtonStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' };