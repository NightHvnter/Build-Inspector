import React, { useState } from 'react';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  module?: string;
}

export interface BuildSummary {
  id: string;
  projectName: string;
  status: 'success' | 'failed' | 'in_progress';
  durationSeconds: number;
  totalErrors: number;
  totalWarnings: number;
  timestamp: string;
  logs: LogEntry[];
}

interface DashboardProps {
  buildData: BuildSummary;
  onBack: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ buildData, onBack }) => {
  const [filter, setFilter] = useState<'all' | 'error' | 'warn'>('all');

  const filteredLogs = buildData.logs.filter((log) => {
    if (filter === 'error') return log.level === 'error';
    if (filter === 'warn') return log.level === 'warn';
    return true;
  });

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', textAlign: 'left' }}>
      <header style={{ marginBottom: '24px', borderBottom: '1px solid #334155', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>Build Inspector: {buildData.projectName}</h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Build ID: {buildData.id} • {buildData.timestamp}</p>
        </div>
        <button 
          onClick={onBack}
          style={{ backgroundColor: '#334155', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
        >
          ← Torna alla Home
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={cardStyle}>
          <span style={cardLabelStyle}>Stato</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: buildData.status === 'success' ? '#22c55e' : '#ef4444' }}>
            {buildData.status.toUpperCase()}
          </span>
        </div>
        <div style={cardStyle}>
          <span style={cardLabelStyle}>Durata</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{buildData.durationSeconds}s</span>
        </div>
        <div style={cardStyle}>
          <span style={cardLabelStyle}>Errori</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>{buildData.totalErrors}</span>
        </div>
        <div style={cardStyle}>
          <span style={cardLabelStyle}>Warning</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>{buildData.totalWarnings}</span>
        </div>
      </div>

      <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', margin: 0 }}>Log di Ispezione ({filteredLogs.length})</h2>
          <div>
            <button onClick={() => setFilter('all')} style={buttonStyle(filter === 'all')}>Tutti</button>
            <button onClick={() => setFilter('error')} style={buttonStyle(filter === 'error')}>Errori</button>
            <button onClick={() => setFilter('warn')} style={buttonStyle(filter === 'warn')}>Warning</button>
          </div>
        </div>

        <div style={{ fontFamily: 'monospace', fontSize: '13px', maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredLogs.map((log) => (
            <div key={log.id} style={{ padding: '8px 12px', borderRadius: '4px', backgroundColor: getLogBg(log.level), borderLeft: `4px solid ${getLogColor(log.level)}` }}>
              <span style={{ color: '#64748b', marginRight: '8px' }}>[{log.timestamp}]</span>
              <strong style={{ color: getLogColor(log.level), marginRight: '8px' }}>[{log.level.toUpperCase()}]</strong>
              {log.module && <span style={{ color: '#38bdf8', marginRight: '8px' }}>[{log.module}]</span>}
              <span>{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = { backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' };
const cardLabelStyle: React.CSSProperties = { color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' };
const buttonStyle = (active: boolean): React.CSSProperties => ({
  backgroundColor: active ? '#3b82f6' : '#334155', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginRight: '8px'
});
const getLogColor = (level: string) => (level === 'error' ? '#ef4444' : level === 'warn' ? '#f59e0b' : '#38bdf8');
const getLogBg = (level: string) => (level === 'error' ? '#2c1517' : level === 'warn' ? '#2b2111' : '#0f172a');