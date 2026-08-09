import { Routes, Route } from 'react-router-dom';
import { Agentation } from 'agentation';
import { DialRoot } from 'dialkit';
import Landing from './pages/Landing';
import AudioSetup from './pages/AudioSetup';
import ThemeStudio from './pages/ThemeStudio';
import OperatorDashboard from './pages/OperatorDashboard';
import ProjectorView from './pages/ProjectorView';
import { RevealSessionProvider } from './session/RevealSessionProvider';

export default function App() {
  return (
    <RevealSessionProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/audio-setup" element={<AudioSetup />} />
        <Route path="/theme-studio" element={<ThemeStudio />} />
        <Route path="/dashboard" element={<OperatorDashboard />} />
        <Route path="/projector" element={<ProjectorView />} />
      </Routes>
      <DialRoot position="bottom-right" defaultOpen={true} />
      {import.meta.env.DEV && <Agentation />}
    </RevealSessionProvider>
  );
}
