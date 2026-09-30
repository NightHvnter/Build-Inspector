import React from 'react';
import { BuildSummary } from '../types/build';

interface DashboardProps {
  buildData?: BuildSummary;
  onBack: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ buildData, onBack }) => {
  return (
    <div style={{ backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh', padding: '24px' }}>
      {/* Header della Dashboard con la nuova disposizione */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px',
        borderBottom: '1px solid #1e293b',
        paddingBottom: '16px'
      }}>
        {/* Tasto Home tutto a sinistra */}
        <div style={{ flex: '1', display: 'flex', justifyContent: 'flex-start' }}>
          <button
            onClick={onBack}
            style={{
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              padding: '10px 18px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🏠 Home
          </button>
        </div>

        {/* Titolo esattamente al centro */}
        <div style={{ flex: '2', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#38bdf8' }}>
            Dashboard Ispezione Log
          </h1>
        </div>

        {/* Spazio bilanciato a destra per centratura perfetta */}
        <div style={{ flex: '1' }} />
      </header>

      {/* Contenuto della Dashboard */}
      <main>
        {buildData ? (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={cardStyle}>
                <span style={cardLabelStyle}>Progetto</span>
                <strong style={{ fontSize: '18px' }}>{buildData.projectName}</strong>
              </div>
              <div style={cardStyle}>
                <span style={cardLabelStyle}>Stato</span>
                <strong style={{ color: buildData.status === 'failed' ? '#ef4444' : '#22c55e', fontSize: '18px' }}>
                  {buildData.status.toUpperCase()}
                </strong>
              </div>
              <div style={cardStyle}>
                <span style={cardLabelStyle}>Errori</span>
                <strong style={{ color: '#ef4444', fontSize: '18px' }}>{buildData.totalErrors}</strong>
              </div>
              <div style={cardStyle}>
                <span style={cardLabelStyle}>Avvisi</span>
                <strong style={{ color: '#f59e0b', fontSize: '18px' }}>{buildData.totalWarnings}</strong>
              </div>
            </div>

            {/* Tabella Log */}
            <h2 style={{ fontSize: '18px', marginBottom: '12px', color: '#94a3b8' }}>Log Dettagliati</h2>
            <div style={{ backgroundColor: '#0a0a0a', borderRadius: '8px', border: '1px solid #1e293b', overflow: 'hidden' }}>
              {buildData.logs.map((log) => (
                <div key={log.id} style={{
                  display: 'flex',
                  padding: '12px 16px',
                  borderBottom: '1px solid #141414',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <span style={{ color: '#64748b', width: '80px' }}>{log.timestamp}</span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    backgroundColor: log.level === 'error' ? 'rgba(239, 68, 68, 0.2)' : log.level === 'warn' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                    color: log.level === 'error' ? '#ef4444' : log.level === 'warn' ? '#f59e0b' : '#38bdf8'
                  }}>
                    {log.level}
                  </span>
                  <span style={{ color: '#cbd5e1', flex: 1 }}>{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#64748b' }}>Nessun dato di build disponibile.</p>
        )}
      </main>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#0a0a0a',
  border: '1px solid #1e293b',
  padding: '16px',
  borderRadius: '8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
};

const cardLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#64748b',
  textTransform: 'uppercase'
};