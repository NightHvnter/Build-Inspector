import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HomeCover } from './components/HomeCover';
import { Dashboard } from './components/dashboard';
import { BuildSummary } from './types/build';
import './App.css';

const mockBuildData: BuildSummary = {
  id: "steam-build-1049",
  projectName: "Cyberpunk 2077 Engine Build",
  status: "failed",
  durationSeconds: 120.4,
  totalErrors: 2,
  totalWarnings: 4,
  timestamp: new Date().toLocaleString(),
  logs: [
    { id: "1", timestamp: "16:20:01", level: "info", message: "Loading Steam SDK integrations...", module: "STEAM" },
    { id: "2", timestamp: "16:20:05", level: "info", message: "Initializing DirectX 12 render pipeline", module: "RENDER" },
    { id: "3", timestamp: "16:20:12", level: "warn", message: "Texture memory allocation reaching threshold (85%)", module: "GPU" },
    { id: "4", timestamp: "16:20:18", level: "warn", message: "Deprecated shader function in shadow_pass.hlsl", module: "SHADER" },
    { id: "5", timestamp: "16:20:25", level: "error", message: "GPU Device Lost: HRESULT 0x887A0005", module: "DRIVER" },
    { id: "6", timestamp: "16:20:26", level: "error", message: "Application crashed during rendering loop", module: "CORE" },
  ],
};

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'dashboard'>('home');

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
      {/* Navbar presente sempre in alto */}
      <Navbar 
        currentView={currentView}
        onGoHome={() => setCurrentView('home')}
        onGoDashboard={() => setCurrentView('dashboard')}
      />

      {/* Schermata Attiva */}
      {currentView === 'home' ? (
        <HomeCover onOpenDashboard={() => setCurrentView('dashboard')} />
      ) : (
        <Dashboard 
          buildData={mockBuildData} 
          onBack={() => setCurrentView('home')} 
        />
      )}
    </div>
  );
}

export default App;