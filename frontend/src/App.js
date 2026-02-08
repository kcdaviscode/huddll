import React, { useState } from 'react';
import LandingPage from './LandingPage';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import MapView from './MapView';
import ProfilePage from './ProfilePage';
import MyHuddllsPage from './MyHuddllsPage';
import Navigation from './Navigation';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [activeTab, setActiveTab] = useState('events');
  const [mapKey, setMapKey] = useState(0);

  // Check authentication on mount
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setCurrentView('map');
    }
  }, []);

  // Force map to remount when switching back to it
  const handleTabChange = (newTab) => {
    if (newTab === 'events' && activeTab !== 'events') {
      setMapKey(prev => prev + 1);
    }
    setActiveTab(newTab);
  };

  if (currentView === 'landing') {
    return <LandingPage
      onEnter={() => setCurrentView('signup')}
      onGoToLogin={() => setCurrentView('login')}
    />;
  }

  if (currentView === 'login') {
    return <LoginPage onLoginSuccess={() => setCurrentView('map')} />;
  }

  if (currentView === 'signup') {
    return <SignupPage onSwitchToLogin={() => setCurrentView('login')} />;
  }

  if (currentView === 'map') {
    return (
      <div className="App">
        {activeTab === 'events' && <MapView key={mapKey} />}
        {activeTab === 'huddlls' && <MyHuddllsPage />}
        {activeTab === 'profile' && (
          <ProfilePage onLogout={() => {
            localStorage.clear();
            setCurrentView('landing');
            setActiveTab('events');
          }} />
        )}
        <Navigation activeTab={activeTab} setActiveTab={handleTabChange} />
      </div>
    );
  }

  return null;
}

export default App;