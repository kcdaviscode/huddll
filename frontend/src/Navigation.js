import React from 'react';
import theme from './theme';

const Navigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'events', label: 'Events', icon: '📍' },
    { id: 'huddlls', label: 'My Huddlls', icon: '👥' },
    { id: 'profile', label: 'Profile', icon: '👤' }
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '80px',
      backgroundColor: theme.slate,
      borderTop: `1px solid ${theme.border}`,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 1000,
      boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.3)'
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            padding: '10px',
            color: activeTab === tab.id ? theme.skyBlue : theme.textSecondary,
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
        >
          {/* Active indicator dot */}
          {activeTab === tab.id && (
            <div style={{
              position: 'absolute',
              top: '8px',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: theme.skyBlue,
              boxShadow: `0 0 8px ${theme.skyBlue}`
            }} />
          )}

          <span style={{
            fontSize: '24px',
            marginBottom: '4px',
            filter: activeTab === tab.id ? 'none' : 'grayscale(100%) opacity(0.6)'
          }}>
            {tab.icon}
          </span>
          <span style={{
            fontSize: '12px',
            fontWeight: activeTab === tab.id ? '700' : '600',
            letterSpacing: '0.3px'
          }}>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default Navigation;