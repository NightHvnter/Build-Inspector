import { useState } from 'react';
import { BuildSummary } from './types/build';
import './App.css';

// Dati di esempio per la Dashboard
const mockBuildData: BuildSummary = {
  id: "build-1049",
  projectName: "Core Engine v2",
  status: "failed",
  durationSeconds: 120.4,
  totalErrors: 2,
  totalWarnings: 4,
  timestamp: new Date().toLocaleString(),
  logs: [
    { id: "1", timestamp: "16:20:01", level: "info", message: "Inizializzazione del sistema...", module: "CORE" },
    { id: "2", timestamp: "16:20:05", level: "info", message: "Compilazione dei file TypeScript", module: "BUILD" },
    { id: "3", timestamp: "16:20:12", level: "warn", message: "Memoria allocata vicina al limite (85%)", module: "MEMORY" },
    { id: "4", timestamp: "16:20:18", level: "warn", message: "Funzione deprecata rilevata in main.ts", module: "LINTER" },
    { id: "5", timestamp: "16:20:25", level: "error", message: "Impossibile risolvere il modulo '@internal/shared'", module: "RESOLVER" },
    { id: "6", timestamp: "16:20:26", level: "error", message: "Processo di build terminato con codice 1", module: "CORE" },
  ],
};

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'dashboard'>('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegister, setIsRegister] = useState(true);

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh', color: '#ffffff' }}>
      
      {/* 1. SE SIAMO SULLA HOME: MOSTRA LA NAVBAR COMPLETA */}
      {currentView === 'home' && (
        <>
          <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderBottom: '1px solid #1e293b'
          }}>
            

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setCurrentView('home')} 
                style={{ backgroundColor: '#38bdf8', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                🏠 Home
              </button>
              <button 
                onClick={() => setCurrentView('dashboard')} 
                style={{ backgroundColor: 'transparent', color: '#fff', border: '1px solid #334155', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                📊 Dashboard Log
              </button>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#22ff00' }}>
              🎮 Pc Builder 🎮
            </div>  
            <button 
              onClick={() => setShowAuthModal(true)} 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer' }}
            >
              👤 Accedi / Registrati
            </button>
          </nav>

          {/* Schermata Home */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', textAlign: 'center', padding: '20px' }}>
            <h1 style={{ fontSize: '48px', color: '#38bdf8', marginBottom: '16px' }}>
              Build Inspector
            </h1>
            <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '600px', marginBottom: '32px' }}>
              Ispeziona i file di log, analizza le build e verifica i report di errore in tempo reale.
            </p>
            <button 
              onClick={() => setCurrentView('dashboard')}
              style={{ backgroundColor: '#38bdf8', color: '#000', border: 'none', padding: '14px 28px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              🚀 Apri Dashboard Ispezione
            </button>
          </div>
        </>
      )}

      {/* 2. SE SIAMO SULLA DASHBOARD: BARRA CON HOME A SINISTRA E TITOLO AL CENTRO */}
      {currentView === 'dashboard' && (
        <div style={{ padding: '24px' }}>
          <header style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px',
            borderBottom: '1px solid #1e293b',
            paddingBottom: '16px'
          }}>
            {/* Tasto Home a SINISTRA */}
            <div style={{ flex: '1', display: 'flex', justifyContent: 'flex-start' }}>
              <button
                onClick={() => setCurrentView('home')}
                style={{
                  backgroundColor: '#1e293b',
                  color: '#ffffff',
                  border: '1px solid #334155',
                  padding: '10px 18px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🏠 Home
              </button>
            </div>

            {/* Titolo AL CENTRO */}
            <div style={{ flex: '2', textAlign: 'center' }}>
              <h1 style={{ margin: 0, fontSize: '26px', color: '#38bdf8' }}>
                Dashboard Ispezione Log
              </h1>
            </div>

            {/* Bilanciamento a DESTRA */}
            <div style={{ flex: '1' }} />
          </header>

          {/* Griglia KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={cardStyle}>
              <span style={cardLabelStyle}>Progetto</span>
              <strong style={{ fontSize: '18px' }}>{mockBuildData.projectName}</strong>
            </div>
            <div style={cardStyle}>
              <span style={cardLabelStyle}>Stato</span>
              <strong style={{ color: mockBuildData.status === 'failed' ? '#ef4444' : '#22c55e', fontSize: '18px' }}>
                {mockBuildData.status.toUpperCase()}
              </strong>
            </div>
            <div style={cardStyle}>
              <span style={cardLabelStyle}>Errori</span>
              <strong style={{ color: '#ef4444', fontSize: '18px' }}>{mockBuildData.totalErrors}</strong>
            </div>
            <div style={cardStyle}>
              <span style={cardLabelStyle}>Avvisi</span>
              <strong style={{ color: '#f59e0b', fontSize: '18px' }}>{mockBuildData.totalWarnings}</strong>
            </div>
          </div>

          {/* Lista Log */}
          <h2 style={{ fontSize: '18px', marginBottom: '12px', color: '#94a3b8' }}>Log Dettagliati</h2>
          <div style={{ backgroundColor: '#0a0a0a', borderRadius: '8px', border: '1px solid #1e293b', overflow: 'hidden' }}>
            {mockBuildData.logs.map((log) => (
              <div key={log.id} style={{ display: 'flex', padding: '12px 16px', borderBottom: '1px solid #141414', fontFamily: 'monospace', fontSize: '14px', alignItems: 'center', gap: '16px' }}>
                <span style={{ color: '#64748b', width: '80px' }}>{log.timestamp}</span>
                <span style={{
                  padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase',
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
      )}

      {/* Modale Registrazione/Login */}
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1e293b', padding: '28px', borderRadius: '12px', width: '100%', maxWidth: '400px', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>{isRegister ? 'Crea un Account' : 'Accedi'}</h2>
              <button onClick={() => setShowAuthModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setShowAuthModal(false); }}>
              {isRegister && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>NOME UTENTE</label>
                  <input type="text" required placeholder="Username" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', marginTop: '4px', boxSizing: 'border-box' }} />
                </div>
              )}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>EMAIL</label>
                <input type="email" required placeholder="email@esempio.com" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>PASSWORD</label>
                <input type="password" required placeholder="••••••••" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#38bdf8', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                {isRegister ? 'Registrati' : 'Accedi'}
              </button>
            </form>
            <p style={{ marginTop: '16px', fontSize: '14px', color: '#94a3b8', textAlign: 'center' }}>
              <span onClick={() => setIsRegister(!isRegister)} style={{ color: '#38bdf8', cursor: 'pointer', textDecoration: 'underline' }}>
                {isRegister ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
              </span>
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

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

export default App;