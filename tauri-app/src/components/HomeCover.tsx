import React from 'react';

interface HomeCoverProps {
  onOpenDashboard: () => void;
}

export const HomeCover: React.FC<HomeCoverProps> = ({ onOpenDashboard }) => {
  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000000',
      color: '#ffffff',
      padding: '40px',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '48px', margin: '0 0 16px 0', color: '#38bdf8' }}>
        Build Inspector
      </h1>
      <p style={{ fontSize: '18px', maxWidth: '600px', color: '#94a3b8', marginBottom: '32px' }}>
        Ispeziona i file di log, analizza le build e verifica i report di errore in tempo reale.
      </p>

      <button 
        onClick={onOpenDashboard}
        style={{
          backgroundColor: '#38bdf8',
          color: '#0f172a',
          border: 'none',
          padding: '14px 28px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        🚀 Apri Dashboard Ispezione
      </button>
    </div>
  );
};