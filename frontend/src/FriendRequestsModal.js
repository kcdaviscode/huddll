import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check, XIcon, Clock } from 'lucide-react';
import theme from './theme';

const FriendRequestsModal = ({ isOpen, onClose }) => {
  const [requests, setRequests] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');

  useEffect(() => {
    if (isOpen) {
      fetchFriendRequests();
    }
  }, [isOpen]);

  const fetchFriendRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/connections/friend-requests/', {
        headers: { 'Authorization': `Token ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const respondToRequest = async (requestId, action) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/connections/friend-request/${requestId}/respond/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        // Remove from list immediately
        setRequests(prev => ({
          ...prev,
          received: prev.received.filter(req => req.id !== requestId)
        }));

        // Show success message if accepted
        if (action === 'accept') {
          // You could add a toast notification here
        }

        // Refresh the list to be sure
        setTimeout(() => fetchFriendRequests(), 500);
      }
    } catch (error) {
      console.error('Error responding to friend request:', error);
    }
  };

  const cancelRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/connections/friend-request/${requestId}/cancel/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });

      if (response.ok) {
        // Remove from list
        setRequests(prev => ({
          ...prev,
          sent: prev.sent.filter(req => req.id !== requestId)
        }));
      }
    } catch (error) {
      console.error('Error cancelling friend request:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
        background: theme.slateLight,
        borderRadius: '24px',
        border: `1px solid ${theme.border}`,
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
        zIndex: 1001,
        animation: 'slideUp 0.3s ease-out',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>

        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: theme.textMain }}>
            Friend Requests
          </h2>
          <button
            onClick={onClose}
            style={{
              background: theme.slate,
              border: 'none',
              borderRadius: '12px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <X size={20} color={theme.textMain} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${theme.border}`,
          background: theme.slate
        }}>
          <button
            onClick={() => setActiveTab('received')}
            style={{
              flex: 1,
              padding: '16px',
              background: activeTab === 'received' ? theme.slateLight : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'received' ? `2px solid ${theme.skyBlue}` : 'none',
              color: activeTab === 'received' ? theme.skyBlue : theme.textSecondary,
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Received ({requests.received.length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            style={{
              flex: 1,
              padding: '16px',
              background: activeTab === 'sent' ? theme.slateLight : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'sent' ? `2px solid ${theme.skyBlue}` : 'none',
              color: activeTab === 'sent' ? theme.skyBlue : theme.textSecondary,
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Sent ({requests.sent.length})
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: theme.textSecondary }}>
              Loading...
            </div>
          ) : (
            <>
              {/* Received Requests */}
              {activeTab === 'received' && (
                requests.received.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: theme.textSecondary }}>
                    <UserPlus size={48} color={theme.textLight} style={{ marginBottom: '16px' }} />
                    <p style={{ margin: 0 }}>No pending friend requests</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {requests.received.map(request => {
                      const displayName = request.sender.first_name && request.sender.last_name
                        ? `${request.sender.first_name} ${request.sender.last_name}`
                        : request.sender.username;
                      const avatar = request.sender.first_name
                        ? request.sender.first_name[0].toUpperCase()
                        : request.sender.username[0].toUpperCase();

                      return (
                        <div key={request.id} style={{
                          background: theme.slate,
                          borderRadius: '16px',
                          padding: '16px',
                          border: `1px solid ${theme.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          {request.sender.profile_photo_url ? (
                            <div style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: '12px',
                              backgroundImage: `url(${request.sender.profile_photo_url})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              flexShrink: 0
                            }} />
                          ) : (
                            <div style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: '12px',
                              background: theme.accentGradient,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '20px',
                              fontWeight: '700',
                              color: 'white',
                              flexShrink: 0
                            }}>
                              {avatar}
                            </div>
                          )}

                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '15px', fontWeight: '700', color: theme.textMain }}>
                              {displayName}
                            </div>
                            <div style={{ fontSize: '13px', color: theme.textSecondary }}>
                              {new Date(request.created_at).toLocaleDateString()}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => respondToRequest(request.id, 'accept')}
                              style={{
                                background: theme.teal,
                                border: 'none',
                                borderRadius: '10px',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <Check size={18} color="white" />
                            </button>
                            <button
                              onClick={() => respondToRequest(request.id, 'decline')}
                              style={{
                                background: theme.slate,
                                border: `1px solid ${theme.border}`,
                                borderRadius: '10px',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <XIcon size={18} color={theme.textSecondary} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {/* Sent Requests */}
              {activeTab === 'sent' && (
                requests.sent.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: theme.textSecondary }}>
                    <Clock size={48} color={theme.textLight} style={{ marginBottom: '16px' }} />
                    <p style={{ margin: 0 }}>No pending sent requests</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {requests.sent.map(request => {
                      const displayName = request.recipient.first_name && request.recipient.last_name
                        ? `${request.recipient.first_name} ${request.recipient.last_name}`
                        : request.recipient.username;
                      const avatar = request.recipient.first_name
                        ? request.recipient.first_name[0].toUpperCase()
                        : request.recipient.username[0].toUpperCase();

                      return (
                        <div key={request.id} style={{
                          background: theme.slate,
                          borderRadius: '16px',
                          padding: '16px',
                          border: `1px solid ${theme.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          {request.recipient.profile_photo_url ? (
                            <div style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: '12px',
                              backgroundImage: `url(${request.recipient.profile_photo_url})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              flexShrink: 0
                            }} />
                          ) : (
                            <div style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: '12px',
                              background: theme.accentGradient,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '20px',
                              fontWeight: '700',
                              color: 'white',
                              flexShrink: 0
                            }}>
                              {avatar}
                            </div>
                          )}

                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '15px', fontWeight: '700', color: theme.textMain }}>
                              {displayName}
                            </div>
                            <div style={{ fontSize: '13px', color: theme.textSecondary }}>
                              Sent {new Date(request.created_at).toLocaleDateString()}
                            </div>
                          </div>

                          <button
                            onClick={() => cancelRequest(request.id)}
                            style={{
                              background: theme.slate,
                              border: `1px solid ${theme.border}`,
                              borderRadius: '10px',
                              padding: '8px 16px',
                              color: theme.textSecondary,
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translate(-50%, -45%); opacity: 0; }
          to { transform: translate(-50%, -50%); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default FriendRequestsModal;