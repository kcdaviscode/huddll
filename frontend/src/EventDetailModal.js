import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Users, X, Navigation, Trash2 } from 'lucide-react';
import EventChat from './EventChat';
import theme from './theme';

const EventDetailModal = ({ event, isOpen, onClose, onEventUpdated }) => {
  const [joining, setJoining] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setError('');
    setShowDeleteConfirm(false);
  }, [event?.id]);

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

      if (response.ok) {
        if (onEventUpdated) onEventUpdated();
        onClose();
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

      if (response.ok) {
        if (onEventUpdated) onEventUpdated();
        onClose();
      } else {
        setError('Failed to leave event.');
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.slate,
          borderRadius: '24px',
          maxWidth: '480px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          border: `1px solid ${theme.border}`,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* HERO HEADER */}
        <div style={{
          background: event.type === 'external' && event.image_url ? 'transparent' : theme.gradient,
          padding: event.type === 'external' && event.image_url ? '0' : '40px 32px 32px',
          color: theme.textMain,
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
          borderRadius: '24px 24px 0 0'
        }}>

          {/* Event Image for External Events */}
          {event.type === 'external' && event.image_url && (
            <div style={{
              width: '100%',
              height: '280px',
              backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.3), rgba(15, 23, 42, 0.8)), url(${event.image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '24px 24px 0 0',
              display: 'flex',
              alignItems: 'flex-end',
              padding: '32px'
            }}>
              <div style={{
                position: 'relative',
                zIndex: 2,
                width: '100%',
                maxWidth: 'calc(100% - 60px)', // Leave room for close button
                paddingRight: '10px'
              }}>
                <div style={{
                  display: 'inline-block',
                  background: event.type === 'external' ? 'linear-gradient(135deg, #FFD700, #FFA500)' : theme.accentGradient,
                  color: event.type === 'external' ? theme.deepNavy : 'white',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '800',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  boxShadow: event.type === 'external' ? '0 4px 12px rgba(255, 215, 0, 0.4)' : `0 4px 12px ${theme.skyBlue}40`
                }}>
                  {event.type === 'external' ? '🎫 TICKETMASTER' : getCategoryEmoji(event.category)}
                </div>
                <h2 style={{
                  fontSize: '26px',
                  fontWeight: '900',
                  margin: '0 0 8px 0',
                  lineHeight: '1.3',
                  color: 'white',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  WebkitLineClamp: 3,
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {event.title}
                </h2>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}>
                  <MapPin size={14} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{event.venue_name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Gradient background blur effect for non-image events */}
          {!(event.type === 'external' && event.image_url) && (
            <>
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-20%',
                width: '300px',
                height: '300px',
                background: `radial-gradient(circle, ${theme.skyBlue}40 0%, transparent 70%)`,
                filter: 'blur(60px)'
              }} />
            </>
          )}

          {/* Close Button */}

          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: theme.slateLight,
              border: `1px solid ${theme.border}`,
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.textMain,
              backdropFilter: 'blur(4px)',
              zIndex: 10
            }}
          >
            <X size={20} />
          </button>

          {/* Delete Button - only for user-created events */}
          {event.type !== 'external' && isEventCreator() && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                position: 'absolute',
                top: '24px',
                left: '24px',
                background: `${theme.error}30`,
                border: `1px solid ${theme.error}`,
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.error,
                backdropFilter: 'blur(4px)',
                zIndex: 10
              }}
              title="Delete Event"
            >
              <Trash2 size={18} />
            </button>
          )}

          {/* Title and Category - only show for user events or external events without images */}
          {!(event.type === 'external' && event.image_url) && (
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ fontSize: '56px', marginBottom: '16px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>
                {getCategoryEmoji(event.category)}
              </div>
              <h2 style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: '900',
                letterSpacing: '-0.5px',
                lineHeight: '1.1',
                wordBreak: 'break-word',
                color: theme.textMain
              }}>
                {event.title}
              </h2>
              <div style={{
                display: 'inline-flex',
                marginTop: '12px',
                backgroundColor: theme.slateLight,
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                textTransform: 'capitalize',
                color: theme.textSecondary,
                border: `1px solid ${theme.border}`
              }}>
                {event.category}
              </div>
            </div>
          )}
        </div>

        {/* CONTENT BODY */}
        <div style={{ padding: '32px' }}>

          {error && (
            <div style={{
              backgroundColor: `${theme.error}20`,
              color: theme.error,
              padding: '12px 16px',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: `1px solid ${theme.error}`
            }}>
              <span style={{ fontSize: '18px' }}>⚠️</span> {error}
            </div>
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div style={{
              backgroundColor: theme.slateLight,
              padding: '20px',
              borderRadius: '16px',
              marginBottom: '24px',
              border: `2px solid ${theme.error}`
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '800', color: theme.error }}>
                Delete this event?
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: theme.textSecondary }}>
                This will permanently delete the event. {event.interested_count > 1 ? `${event.interested_count} people are interested.` : ''}
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleDeleteEvent}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: theme.error,
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    opacity: deleting ? 0.6 : 1
                  }}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: theme.slateLight,
                    color: theme.textMain,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: deleting ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* INFO ROWS CONTAINER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>

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

              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: theme.textMain }}>
                  {event.venue_name}
                </h3>
                <p style={{ margin: '2px 0 4px 0', fontSize: '14px', color: theme.textSecondary }}>
                  {event.city || "Baltimore, MD"}
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700', color: theme.skyBlue, cursor: 'pointer' }}>
                   <Navigation size={12} /> Get Directions
                </div>
              </div>
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

            {/* Attendees Row - only for user events */}
            {event.type !== 'external' && (
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
                  <p style={{ margin: '2px 0 0 0', fontSize: '14px', color: theme.textSecondary }}>
                    {event.interested_count || 1} {(event.interested_count || 1) === 1 ? 'person' : 'people'} interested
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* ACTION BUTTON */}
          <div style={{ marginTop: 'auto' }}>
            {event.type === 'external' ? (
              // External events - show Get Tickets button
              <div>
                <a
                  href={event.ticket_url || event.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <button
                    style={{
                      width: '100%',
                      padding: '20px',
                      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                      color: theme.deepNavy,
                      border: 'none',
                      borderRadius: '20px',
                      fontSize: '18px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      boxShadow: '0 10px 25px -5px rgba(255, 215, 0, 0.6)',
                      transition: 'transform 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px'
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <span style={{ fontSize: '24px' }}>🎫</span>
                    Get Tickets
                  </button>
                </a>

                {/* Source badge */}
                <div style={{
                  textAlign: 'center',
                  marginTop: '12px',
                  fontSize: '12px',
                  color: theme.textSecondary
                }}>
                  via {event.source === 'ticketmaster' ? 'Ticketmaster' : 'Eventbrite'}
                </div>

                {/* Create Huddll for this event - Future feature */}
                <button
                  onClick={() => alert('Coming soon! You\'ll be able to create your own Huddll group for this event and invite friends to join you.')}
                  style={{
                    width: '100%',
                    padding: '16px',
                    marginTop: '16px',
                    backgroundColor: theme.slateLight,
                    color: theme.skyBlue,
                    border: `2px solid ${theme.skyBlue}`,
                    borderRadius: '16px',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${theme.skyBlue}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.slateLight;
                  }}
                >
                  👥 Create Huddll for This Event
                </button>
              </div>
            ) : isEventCreator() ? (
              <div style={{
                width: '100%',
                padding: '16px',
                backgroundColor: theme.slateLight,
                color: theme.textSecondary,
                borderRadius: '20px',
                fontSize: '15px',
                fontWeight: '700',
                textAlign: 'center',
                border: `1px dashed ${theme.border}`
              }}>
                You are hosting this Huddll
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
                  {joining ? 'Leaving...' : 'Can\'t Make It'}
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
                {joining ? 'Joining...' : 'I\'m Going!'}
              </button>
            )}
          </div>

          {/* EVENT CHAT - only for user events where user is interested */}
          {event.type !== 'external' && isUserInterested() && (
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
    </div>
  );
};

export default EventDetailModal;