import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import theme from './theme';

const Header = () => {
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Get logged-in user
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }

    // Fetch unread count
    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/notifications/unread-count/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await response.json();
      setUnreadCount(data.unread_count);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/notifications/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleBellClick = async () => {
    if (!showNotifications) {
      await fetchNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:8000/api/notifications/${notificationId}/read/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:8000/api/notifications/mark-all-read/', {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const getUserInitial = () => {
    if (!user) return '?';
    if (user.first_name) return user.first_name.charAt(0).toUpperCase();
    if (user.username) return user.username.charAt(0).toUpperCase();
    return '?';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '70px',
      backgroundColor: theme.slate,
      borderBottom: `1px solid ${theme.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
    }}>

      {/* Logo */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: theme.skyBlue,
          margin: 0,
          letterSpacing: '1px',
          cursor: 'pointer'
        }}>huddll</h1>
        <svg style={{
          position: 'absolute',
          left: '50%',
          marginLeft: '-2px',
          bottom: '-5px',
          width: '26px',
          height: '9px'
        }} viewBox="0 0 50 16">
          <path
            d="M 2 2 Q 25 20 48 2"
            fill="none"
            stroke={theme.skyBlue}
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Right Side - Notification Bell & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={handleBellClick}
            style={{
              background: theme.slateLight,
              border: `1px solid ${theme.border}`,
              borderRadius: '12px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <Bell size={20} color={unreadCount > 0 ? theme.skyBlue : theme.textSecondary} />

            {/* Unread Badge */}
            {unreadCount > 0 && (
              <div style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: theme.error,
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: '800',
                boxShadow: `0 0 12px ${theme.error}80`
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <>
              {/* Backdrop to close dropdown */}
              <div
                onClick={() => setShowNotifications(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1000
                }}
              />

              {/* Dropdown Panel */}
              <div style={{
                position: 'absolute',
                top: '50px',
                right: 0,
                width: '360px',
                maxHeight: '500px',
                background: theme.slateLight,
                borderRadius: '16px',
                border: `1px solid ${theme.border}`,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                zIndex: 1001,
                overflow: 'hidden'
              }}>
                {/* Header */}
                <div style={{
                  padding: '16px 20px',
                  borderBottom: `1px solid ${theme.border}`
                }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: theme.textMain }}>
                    Notifications
                  </h3>
                </div>

                {/* Notification List */}
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: theme.textSecondary }}>
                      <Bell size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                      <div style={{ fontSize: '14px' }}>No notifications yet</div>
                    </div>
                  ) : (
                    notifications.slice(0, 5).map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (!notif.read) markAsRead(notif.id);
                          // Navigate to event if notification has an event
                          if (notif.event) {
                            setShowNotifications(false);
                            window.location.href = `/map?event=${notif.event.id}`;
                          }
                        }}
                        style={{
                          padding: '16px 20px',
                          borderBottom: `1px solid ${theme.border}`,
                          cursor: 'pointer',
                          background: notif.read ? 'transparent' : `${theme.skyBlue}10`,
                          position: 'relative',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = `${theme.skyBlue}15`}
                        onMouseLeave={(e) => e.currentTarget.style.background = notif.read ? 'transparent' : `${theme.skyBlue}10`}
                      >
                        {!notif.read && (
                          <div style={{
                            position: 'absolute',
                            left: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: theme.skyBlue,
                            boxShadow: `0 0 8px ${theme.skyBlue}`
                          }} />
                        )}

                        {/* Event emoji if available */}
                        {notif.event && (
                          <div style={{ fontSize: '20px', marginBottom: '6px' }}>
                            {notif.event.emoji}
                          </div>
                        )}

                        <div style={{ fontSize: '14px', color: theme.textMain, marginBottom: '4px', fontWeight: notif.read ? '400' : '600' }}>
                          {notif.message}
                        </div>

                        {/* Event title */}
                        {notif.event && (
                          <div style={{ fontSize: '12px', color: theme.skyBlue, marginBottom: '4px', fontWeight: '600' }}>
                            📍 {notif.event.title}
                          </div>
                        )}

                        <div style={{ fontSize: '12px', color: theme.textSecondary }}>
                          {formatTime(notif.created_at)}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer - Action Buttons */}
                {notifications.length > 0 && (
                  <div style={{
                    padding: '12px 20px',
                    borderTop: `1px solid ${theme.border}`,
                    display: 'flex',
                    gap: '12px'
                  }}>
                    <button
                      onClick={() => {
                        // TODO: Navigate to full notifications page
                        alert('Full notifications page coming soon!');
                      }}
                      style={{
                        flex: 1,
                        background: theme.accentGradient,
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '10px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: `0 4px 12px ${theme.skyBlue}30`
                      }}
                    >
                      View All ({notifications.length})
                    </button>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        style={{
                          background: theme.slate,
                          color: theme.textMain,
                          border: `1px solid ${theme.border}`,
                          borderRadius: '12px',
                          padding: '10px 16px',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Mark All Read
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Profile Icon */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: theme.accentGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '800',
              cursor: 'pointer',
              fontSize: '18px',
              boxShadow: `0 4px 12px ${theme.skyBlue}40`,
              border: 'none'
            }}
          >
            {getUserInitial()}
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <>
              {/* Backdrop */}
              <div
                onClick={() => setShowProfileMenu(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1000
                }}
              />

              {/* Dropdown */}
              <div style={{
                position: 'absolute',
                top: '50px',
                right: 0,
                width: '200px',
                background: theme.slateLight,
                borderRadius: '16px',
                border: `1px solid ${theme.border}`,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                zIndex: 1001,
                overflow: 'hidden'
              }}>
                {/* User Info */}
                <div style={{
                  padding: '16px',
                  borderBottom: `1px solid ${theme.border}`
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: theme.textMain }}>
                    {user?.first_name || user?.username || 'User'}
                  </div>
                  <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '2px' }}>
                    {user?.email || ''}
                  </div>
                </div>

                {/* Menu Items */}
                <div style={{ padding: '8px' }}>
                  <button
                    onClick={() => alert('Settings coming soon!')}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: theme.textMain,
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = theme.slate}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    ⚙️ Settings
                  </button>

                  <button
                    onClick={() => alert('Display settings coming soon!')}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: theme.textMain,
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = theme.slate}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    🎨 Display
                  </button>

                  <button
                    onClick={() => alert('Support coming soon!')}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: theme.textMain,
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = theme.slate}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    💬 Support
                  </button>

                  <div style={{ height: '1px', background: theme.border, margin: '8px 0' }} />

                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: theme.error,
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = `${theme.error}20`}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    🚪 Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default Header;