import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Users, X, Navigation, Trash2 } from 'lucide-react';
import EventChat from './EventChat';
import AddFriendButton from './AddFriendButton';
import CreateHuddllModal from './CreateHuddllModal';
import theme from './theme';

// FIX #3 — Moved outside EventDetailModal so it doesn't remount on every render
const AttendeeCard = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id;

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/users/${userId}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) return null;
  if (userId === currentUserId) return null;

  const displayName = user.first_name && user.last_name
    ? `${user.first_name} ${user.last_name}`
    : user.username;
  const avatar = user.first_name
    ? user.first_name[0].toUpperCase()
    : user.username[0].toUpperCase();

  return (
    <div style={{
      background: theme.slateLight,
      borderRadius: '12px',
      padding: '12px',
      border: `1px solid ${theme.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }}>
      {user.profile_photo_url ? (
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          backgroundImage: `url(${user.profile_photo_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          flexShrink: 0
        }} />
      ) : (
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: theme.accentGradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: '700',
          color: 'white',
          flexShrink: 0
        }}>
          {avatar}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: theme.textMain,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {displayName}
        </div>
        {user.city && (
          <div style={{
            fontSize: '12px',
            color: theme.textSecondary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {user.city}
          </div>
        )}
      </div>

      <AddFriendButton userId={userId} compact={true} />
    </div>
  );
};

const EventDetailModal = ({ event, isOpen, onClose, onEventUpdated }) => {
  const [joining, setJoining] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreateHuddll, setShowCreateHuddll] = useState(false);
  const [userGoingToExternal, setUserGoingToExternal] = useState(false);

  useEffect(() => {
    setError('');
    setShowDeleteConfirm(false);

    if (event?.type === 'external') {
      checkExternalEventInterest();
    }
  }, [event?.id]);

  const checkExternalEventInterest = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/events/external/${event.id}/check-interest/`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUserGoingToExternal(data.is_interested);
      }
    } catch (error) {
      console.error('Error checking external event interest:', error);
    }
  };

  if (!isOpen || !event) return null;

  const getCategoryEmoji = (category) => {
    const emojiMap = {
      food: '🍔', sports: '⚽', nightlife: '🎉',
      arts: '🎨', music: '🎵', social: '👥'
    };
    return emojiMap[category] || '📍';
  };

  const formatEventTime = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'long' }),
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    };
  };

  const timeData = formatEventTime(event.start_time);

  const isEventCreator = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return Number(event.created_by) === Number(user.id);
  };

  const isUserInterested = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return event.interested_user_ids && event.interested_user_ids.includes(Number(user.id));
  };

  const handleJoin = async () => {
    if (isEventCreator()) {
      setError("You're the host!");
      return;
    }

    setJoining(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:8000/api/events/${event.id}/mark_interested/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        }
      });

      const data = await response.json();

      // FIX #1 — Removed onClose() so modal stays open after joining
      if (response.ok) {
        if (onEventUpdated) onEventUpdated();
      } else {
        setError(data.error || data.message || 'Failed to join event.');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    setJoining(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/events/${event.id}/unmark_interested/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      // FIX #1 — Removed onClose() so modal stays open after leaving
      if (response.ok) {
        if (onEventUpdated) onEventUpdated();
      } else {
        setError('Failed to leave event.');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setJoining(false);
    }
  };

  const handleMarkGoingToExternal = async () => {
    setJoining(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/events/external/${event.id}/mark-interested/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        setUserGoingToExternal(true);
        if (onEventUpdated) onEventUpdated();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to mark interest.');
      }
    } catch (err) {
      console.error('Mark interest error:', err);
      setError('Network error.');
    } finally {
      setJoining(false);
    }
  };

  const handleUnmarkGoingToExternal = async () => {
    setJoining(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/events/external/${event.id}/unmark-interested/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        setUserGoingToExternal(false);
        if (onEventUpdated) onEventUpdated();
      } else {
        setError('Failed to remove interest.');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setJoining(false);
    }
  };

  const handleDeleteEvent = async () => {
    setDeleting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/events/${event.id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        if (onEventUpdated) onEventUpdated();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete event.');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleHuddllCreated = () => {
    setShowCreateHuddll(false);
    if (onEventUpdated) onEventUpdated();
  };

  const getLocationName = () => {
    return event.venue_name || event.location_name || event.venue || 'Location TBD';
  };

  const getCity = () => {
    return event.city || 'City not specified';
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: theme.bgPrimary,
          borderRadius: '32px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5)`,
          border: `1px solid ${theme.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div style={{
          padding: '28px 32px 24px',
          borderBottom: `1px solid ${theme.border}`,
          position: 'sticky',
          top: 0,
          background: theme.bgPrimary,
          borderTopLeftRadius: '32px',
          borderTopRightRadius: '32px',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ fontSize: '56px', lineHeight: 1, flexShrink: 0 }}>
              {event.emoji || getCategoryEmoji(event.category)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{
                margin: '0 0 8px 0',
                fontSize: '28px',
                fontWeight: '900',
                color: theme.textMain,
                lineHeight: '1.2'
              }}>
                {event.title}
              </h2>

              {event.description && (
                <p style={{
                  margin: 0,
                  fontSize: '15px',
                  color: theme.textSecondary,
                  lineHeight: '1.5'
                }}>
                  {event.description}
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: theme.slateLight,
                border: `1px solid ${theme.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = theme.border}
              onMouseLeave={(e) => e.currentTarget.style.background = theme.slateLight}
            >
              <X size={22} color={theme.textMain} />
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: `${theme.error}15`,
              border: `1px solid ${theme.error}40`,
              borderRadius: '12px',
              color: theme.error,
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {error}
            </div>
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              background: `${theme.error}10`,
              border: `2px solid ${theme.error}`,
              borderRadius: '16px',
            }}>
              <p style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                fontWeight: '700',
                color: theme.error
              }}>
                Are you sure you want to delete this event?
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleDeleteEvent}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: theme.error,
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: deleting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: theme.slateLight,
                    color: theme.textMain,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SCROLLABLE CONTENT */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column'
        }}>

          {/* EVENT DETAILS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>

            {/* Location Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: `${theme.skyBlue}20`,
                color: theme.skyBlue,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: `1px solid ${theme.skyBlue}40`,
                boxShadow: `0 0 20px ${theme.skyBlue}20`
              }}>
                <MapPin size={24} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: theme.textMain }}>
                  {getLocationName()}
                </h3>
                <p style={{
                  margin: '2px 0 0 0',
                  fontSize: '14px',
                  color: theme.textSecondary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {getCity()}
                </p>
              </div>

              {event.latitude && event.longitude && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: theme.slateLight,
                    border: `1px solid ${theme.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = theme.border}
                  onMouseLeave={(e) => e.currentTarget.style.background = theme.slateLight}
                >
                  <Navigation size={20} color={theme.skyBlue} />
                </a>
              )}
            </div>

            {/* Time Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: `${theme.indigo}20`,
                color: theme.indigo,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: `1px solid ${theme.indigo}40`,
                boxShadow: `0 0 20px ${theme.indigo}20`
              }}>
                <Clock size={24} />
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: theme.textMain }}>
                  {timeData.day}, {timeData.time}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '14px', color: theme.textSecondary }}>
                  {timeData.date}
                </p>
              </div>
            </div>

            {/* Attendees Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: `${theme.teal}20`,
                color: theme.teal,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: `1px solid ${theme.teal}40`,
                boxShadow: `0 0 20px ${theme.teal}20`
              }}>
                <Users size={24} />
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: theme.textMain }}>
                  Who's Going?
                </h3>
                {/* FIX #4 — Show real count, not || 1 fallback */}
                <p style={{ margin: '2px 0 0 0', fontSize: '14px', color: theme.textSecondary }}>
                  {event.interested_count || 0} {(event.interested_count || 0) === 1 ? 'person' : 'people'} interested
                </p>
              </div>
            </div>

          </div>

          {/* ATTENDEES LIST */}
          {event.type !== 'external' && event.interested_user_ids && event.interested_user_ids.length > 0 && (
            <div style={{
              marginBottom: '32px',
              padding: '24px',
              background: theme.slateLight,
              borderRadius: '20px',
              border: `1px solid ${theme.border}`
            }}>
              <h3 style={{
                margin: '0 0 16px',
                fontSize: '18px',
                fontWeight: '800',
                color: theme.textMain,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Users size={20} color={theme.skyBlue} />
                Who's Going ({event.interested_user_ids.length})
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '10px',
                maxHeight: '280px',
                overflowY: 'auto',
                paddingRight: '4px'
              }}>
                {event.interested_user_ids.map(userId => (
                  <AttendeeCard key={userId} userId={userId} />
                ))}
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div style={{ marginTop: 'auto' }}>

            {/* EXTERNAL EVENTS */}
            {event.type === 'external' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {userGoingToExternal ? (
                  <div>
                    <button
                      style={{
                        width: '100%',
                        padding: '20px',
                        background: `linear-gradient(135deg, ${theme.success}, ${theme.teal})`,
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        fontSize: '18px',
                        fontWeight: '800',
                        cursor: 'default',
                        boxShadow: `0 10px 25px -5px ${theme.success}60`,
                      }}
                    >
                      You're Going! ✓
                    </button>
                    <button
                      onClick={handleUnmarkGoingToExternal}
                      disabled={joining}
                      style={{
                        width: '100%',
                        padding: '12px',
                        marginTop: '12px',
                        backgroundColor: 'transparent',
                        color: theme.error,
                        border: `2px solid ${theme.error}`,
                        borderRadius: '16px',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: joining ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {joining ? 'Removing...' : "Can't Make It"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleMarkGoingToExternal}
                    disabled={joining}
                    style={{
                      width: '100%',
                      padding: '20px',
                      background: joining ? theme.slateLight : `linear-gradient(135deg, ${theme.skyBlue}, ${theme.indigo})`,
                      color: 'white',
                      border: 'none',
                      borderRadius: '20px',
                      fontSize: '18px',
                      fontWeight: '800',
                      cursor: joining ? 'not-allowed' : 'pointer',
                      boxShadow: `0 10px 25px -5px ${theme.skyBlue}60`,
                      transition: 'transform 0.2s',
                    }}
                    onMouseDown={(e) => !joining && (e.currentTarget.style.transform = 'scale(0.98)')}
                    onMouseUp={(e) => !joining && (e.currentTarget.style.transform = 'scale(1)')}
                    onMouseLeave={(e) => !joining && (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {joining ? 'Saving...' : "I'm Going!"}
                  </button>
                )}

                <button
                  onClick={() => setShowCreateHuddll(true)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: theme.accentGradient,
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    fontSize: '16px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: `0 10px 25px -5px ${theme.skyBlue}40`,
                    transition: 'transform 0.2s',
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  🎉 Create Huddll for this Event
                </button>

                {event.ticket_url && (
                  <a
                    href={event.ticket_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <button
                      style={{
                        width: '100%',
                        padding: '16px',
                        background: theme.slateLight,
                        color: theme.textMain,
                        border: `2px solid ${theme.border}`,
                        borderRadius: '20px',
                        fontSize: '16px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = theme.border;
                        e.currentTarget.style.borderColor = theme.skyBlue;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = theme.slateLight;
                        e.currentTarget.style.borderColor = theme.border;
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>🎫</span>
                      Get Tickets
                    </button>
                  </a>
                )}
              </div>
            )}

            {/* USER-CREATED EVENTS */}
            {event.type !== 'external' && (
              <>
                {isEventCreator() ? (
                  <div>
                    <div style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: theme.slateLight,
                      color: theme.textSecondary,
                      borderRadius: '20px',
                      fontSize: '15px',
                      fontWeight: '700',
                      textAlign: 'center',
                      border: `1px dashed ${theme.border}`,
                      marginBottom: '12px'
                    }}>
                      You are hosting this Huddll
                    </div>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'transparent',
                        color: theme.error,
                        border: `2px solid ${theme.error}`,
                        borderRadius: '16px',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <Trash2 size={16} />
                      Delete Event
                    </button>
                  </div>
                ) : isUserInterested() ? (
                  <div>
                    <button
                      style={{
                        width: '100%',
                        padding: '20px',
                        background: `linear-gradient(135deg, ${theme.success}, ${theme.teal})`,
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        fontSize: '18px',
                        fontWeight: '800',
                        cursor: 'default',
                        boxShadow: `0 10px 25px -5px ${theme.success}60`,
                      }}
                    >
                      You're Going ✓
                    </button>
                    <button
                      onClick={handleLeave}
                      disabled={joining}
                      style={{
                        width: '100%',
                        padding: '12px',
                        marginTop: '12px',
                        backgroundColor: 'transparent',
                        color: theme.error,
                        border: `2px solid ${theme.error}`,
                        borderRadius: '16px',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: joining ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {joining ? 'Leaving...' : "Can't Make It"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    style={{
                      width: '100%',
                      padding: '20px',
                      background: joining ? theme.slateLight : theme.accentGradient,
                      color: 'white',
                      border: 'none',
                      borderRadius: '20px',
                      fontSize: '18px',
                      fontWeight: '800',
                      cursor: joining ? 'not-allowed' : 'pointer',
                      boxShadow: `0 10px 25px -5px ${theme.skyBlue}60`,
                      transition: 'transform 0.2s',
                      transform: 'scale(1)'
                    }}
                    onMouseDown={(e) => !joining && (e.currentTarget.style.transform = 'scale(0.98)')}
                    onMouseUp={(e) => !joining && (e.currentTarget.style.transform = 'scale(1)')}
                    onMouseLeave={(e) => !joining && (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {joining ? 'Joining...' : "I'm Going!"}
                  </button>
                )}
              </>
            )}
          </div>

          {/* FIX #2 — Chat now visible to creator too, not just interested users */}
          {(isUserInterested() || isEventCreator()) && event.type !== 'external' && (
            <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: `1px solid ${theme.border}` }}>
              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '20px',
                fontWeight: '800',
                color: theme.textMain
              }}>
                💬 Event Chat
              </h3>
              <EventChat
                eventId={event.id}
                currentUser={JSON.parse(localStorage.getItem('user'))}
              />
            </div>
          )}

        </div>
      </div>

      {showCreateHuddll && (
        <CreateHuddllModal
          parentEvent={event}
          onClose={() => setShowCreateHuddll(false)}
          onHuddllCreated={handleHuddllCreated}
        />
      )}
    </div>
  );
};

export default EventDetailModal;