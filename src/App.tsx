import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { BottomNav, Tab } from './components/BottomNav';
import { MenuPanel } from './components/MenuPanel';
import { FocusView } from './views/FocusView';
import { TasksView } from './views/TasksView';
import { StatsView } from './views/StatsView';
import { ProfileView } from './views/ProfileView';
import { AppProvider } from './context/AppContext';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('focus');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface selection:bg-primary-container selection:text-on-primary-container transition-colors duration-500 overflow-x-hidden">
      <main className="pt-6 pb-28 md:pb-32 px-4 md:px-6 max-w-5xl mx-auto min-h-screen">
        <AnimatePresence mode="wait">
          {activeTab === 'focus' && <FocusView key="focus" />}
          {activeTab === 'tasks' && <TasksView key="tasks" />}
          {activeTab === 'stats' && <StatsView key="stats" />}
          {activeTab === 'profile' && <ProfileView key="profile" />}
        </AnimatePresence>
      </main>

      <BottomNav 
        activeTab={activeTab} 
        onChange={setActiveTab} 
        onMenuOpen={() => setIsMenuOpen(true)}
      />
      
      <MenuPanel 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onNavigate={setActiveTab} 
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

