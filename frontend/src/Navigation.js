import React from 'react';

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
      backgroundColor: 'white',
      borderTop: '1px solid #E5E7EB',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 1000
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
            color: activeTab === tab.id ? '#4A90BA' : '#6B7280'
          }}
        >
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>{tab.icon}</span>
          <span style={{ fontSize: '12px', fontWeight: activeTab === tab.id ? 'bold' : 'normal' }}>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default Navigation;