import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, Clock, UserX } from 'lucide-react';
import theme from './theme';

const AddFriendButton = ({ userId, compact = false }) => {
  const [connectionStatus, setConnectionStatus] = useState('loading');
  const [requestId, setRequestId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConnectionStatus();
  }, [userId]);

  const fetchConnectionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/connections/connection-status/${userId}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus(data.status);
        setRequestId(data.request_id || data.connection_id);
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const sendFriendRequest = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/connections/friend-request/send/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipient_id: userId })
      });

      if (response.ok) {
        const data = await response.json();
        setRequestId(data.id);
        setConnectionStatus('pending_sent');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelFriendRequest = async () => {
    if (!requestId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/connections/friend-request/${requestId}/cancel/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });

      if (response.ok) {
        setConnectionStatus('none');
        setRequestId(null);
      }
    } catch (error) {
      console.error('Error cancelling friend request:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async () => {
    if (!requestId) return;

    if (!window.confirm('Are you sure you want to remove this friend?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/connections/friend/${userId}/remove/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });

      if (response.ok) {
        setConnectionStatus('none');
        setRequestId(null);
      }
    } catch (error) {
      console.error('Error removing friend:', error);
    } finally {
      setLoading(false);
    }
  };

  if (connectionStatus === 'loading') {
    return null; // Or a loading spinner
  }

  // Compact version (just icon, for profile cards)
  if (compact) {
    if (connectionStatus === 'accepted') {
      return (
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: theme.teal,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <UserCheck size={16} color="white" />
        </div>
      );
    }

    if (connectionStatus === 'pending_sent') {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            cancelFriendRequest();
          }}
          disabled={loading}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: theme.deepNavy,
            border: `2px solid ${theme.skyBlue}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            animation: 'pulse 2s infinite'
          }}
        >
          <Clock size={16} color={theme.skyBlue} />
        </button>
      );
    }

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          sendFriendRequest();
        }}
        disabled={loading}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: theme.skyBlue,
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
      >
        <UserPlus size={16} color="white" />
      </button>
    );
  }

  // Full button version
  if (connectionStatus === 'accepted') {
    return (
      <button
        onClick={removeFriend}
        disabled={loading}
        style={{
          background: theme.slate,
          border: `1px solid ${theme.teal}`,
          borderRadius: '12px',
          padding: '10px 20px',
          color: theme.teal,
          fontSize: '14px',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = theme.deepNavy;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = theme.slate;
        }}
      >
        <UserCheck size={16} />
        {loading ? 'Removing...' : 'Friends'}
      </button>
    );
  }

  if (connectionStatus === 'pending_sent') {
    return (
      <button
        onClick={cancelFriendRequest}
        disabled={loading}
        style={{
          background: theme.slate,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          padding: '10px 20px',
          color: theme.textSecondary,
          fontSize: '14px',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <Clock size={16} />
        {loading ? 'Cancelling...' : 'Request Sent'}
      </button>
    );
  }

  if (connectionStatus === 'pending_received') {
    return (
      <div style={{
        background: theme.slateLight,
        border: `1px solid ${theme.skyBlue}`,
        borderRadius: '12px',
        padding: '10px 20px',
        color: theme.skyBlue,
        fontSize: '14px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <Clock size={16} />
        Respond in Notifications
      </div>
    );
  }

  // Default: No connection
  return (
    <button
      onClick={sendFriendRequest}
      disabled={loading}
      style={{
        background: theme.accentGradient,
        border: 'none',
        borderRadius: '12px',
        padding: '10px 20px',
        color: 'white',
        fontSize: '14px',
        fontWeight: '700',
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: `0 4px 16px ${theme.skyBlue}40`,
        opacity: loading ? 0.6 : 1
      }}
    >
      <UserPlus size={16} />
      {loading ? 'Sending...' : 'Add Friend'}
    </button>
  );
};

// Add CSS for pulse animation
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
`;
if (!document.head.querySelector('style[data-addfriend-styles]')) {
  style.setAttribute('data-addfriend-styles', 'true');
  document.head.appendChild(style);
}

export default AddFriendButton;