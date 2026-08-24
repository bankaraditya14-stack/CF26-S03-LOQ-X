import React from 'react';
import { useRouter } from './utils/router';
import { LandingPage } from './components/landing/LandingPage';
import { AboutModelPage } from './components/about/AboutModelPage';
import { MissionControlScreen } from './components/simulator/MissionControlScreen';
import { AuthProvider } from './context/AuthContext';

export const AppContent: React.FC = () => {
  const { path, scenarioId } = useRouter();

  if (path === '/simulator') {
    return <MissionControlScreen scenarioId={scenarioId} />;
  }

  if (path === '/about-model') {
    return <AboutModelPage />;
  }

  return <LandingPage />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
