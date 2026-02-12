import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import MapView from './MapView';
import ProfilePage from './ProfilePage';
import MyHuddllsPage from './MyHuddllsPage';
import Navigation from './Navigation';
import './App.css';

// Protected route wrapper
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

// Main layout with navigation
function MainLayout() {
  const [activeTab, setActiveTab] = React.useState('events');
  const [mapKey, setMapKey] = React.useState(0);

  const handleTabChange = (newTab) => {
    if (newTab === 'events' && activeTab !== 'events') {
      setMapKey(prev => prev + 1);
    }
    setActiveTab(newTab);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <div className="App">
      {activeTab === 'events' && <MapView key={mapKey} />}
      {activeTab === 'huddlls' && <MyHuddllsPage />}
      {activeTab === 'profile' && <ProfilePage onLogout={handleLogout} />}
      <Navigation activeTab={activeTab} setActiveTab={handleTabChange} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;