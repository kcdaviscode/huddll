import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Users, X, Navigation, Trash2 } from 'lucide-react';

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

  const colors = {
    overlay: 'rgba(15, 23, 42, 0.75)',
    bg: '#FFFFFF',
    headerBg: '#0F172A',
    brandBlue: '#4A90BA',
    accentLight: '#F0F9FF',
    textMain: '#0F172A',
    textMuted: '#64748B',
    border: '#E2E8F0',
    danger: '#EF4444',
    dangerLight: '#FEF2F2'
  };

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
        position: 'fixed', inset: 0,
        backgroundColor: colors.overlay,
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: colors.bg,
          borderRadius: '32px',
          maxWidth: '480px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* HERO HEADER */}
        <div style={{
          backgroundColor: colors.headerBg,
          padding: '40px 32px 32px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          <div style={{
            position: 'absolute', top: '-50%', right: '-20%',
            width: '300px', height: '300px',
            backgroundColor: '#4A90BA', opacity: 0.2,
            filter: 'blur(60px)', borderRadius: '50%'
          }} />

          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '24px', right: '24px',
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
              width: '36px', height: '36px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', backdropFilter: 'blur(4px)', zIndex: 10
            }}
          >
            <X size={20} />
          </button>

          {/* Delete Button - Only show for event creator */}
          {isEventCreator() && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                position: 'absolute', top: '24px', left: '24px',
                background: 'rgba(239, 68, 68, 0.2)', border: 'none', borderRadius: '50%',
                width: '36px', height: '36px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#EF4444', backdropFilter: 'blur(4px)', zIndex: 10
              }}
              title="Delete Event"
            >
              <Trash2 size={18} />
            </button>
          )}

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: '56px', marginBottom: '16px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}>
              {getCategoryEmoji(event.category)}
            </div>
            <h2 style={{
              margin: 0, fontSize: '28px', fontWeight: '900',
              letterSpacing: '-0.5px', lineHeight: '1.1',
              wordBreak: 'break-word'
            }}>
              {event.title}
            </h2>
            <div style={{
              display: 'inline-flex', marginTop: '12px',
              backgroundColor: 'rgba(255,255,255,0.15)', padding: '6px 12px',
              borderRadius: '20px', fontSize: '13px', fontWeight: '600',
              textTransform: 'capitalize'
            }}>
              {event.category}
            </div>
          </div>
        </div>

        {/* CONTENT BODY */}
        <div style={{ padding: '32px' }}>

          {error && (
            <div style={{
              backgroundColor: colors.dangerLight, color: colors.danger,
              padding: '12px 16px', borderRadius: '16px',
              fontSize: '14px', fontWeight: '600', marginBottom: '24px',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span style={{ fontSize: '18px' }}>⚠️</span> {error}
            </div>
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div style={{
              backgroundColor: colors.dangerLight,
              padding: '20px',
              borderRadius: '16px',
              marginBottom: '24px',
              border: `2px solid ${colors.danger}`
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '800', color: colors.danger }}>
                Delete this event?
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: colors.textMuted }}>
                This will permanently delete the event. {event.interested_count > 1 ? `${event.interested_count} people are interested.` : ''}
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleDeleteEvent}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: colors.danger,
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
                    backgroundColor: colors.textMuted,
                    color: 'white',
                    border: 'none',
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

            {/* 1. Location Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '16px',
                backgroundColor: colors.accentLight, color: colors.brandBlue,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                position: 'absolute', left: 0
              }}>
                <MapPin size={24} />
              </div>

              <div style={{ flex: 1, textAlign: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: colors.textMain }}>
                  {event.venue_name}
                </h3>
                <p style={{ margin: '2px 0 4px 0', fontSize: '14px', color: colors.textMuted }}>
                  {event.city || "Baltimore, MD"}
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700', color: colors.brandBlue, cursor: 'pointer' }}>
                   <Navigation size={12} /> Get Directions
                </div>
              </div>
            </div>

            {/* 2. Time Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '16px',
                backgroundColor: colors.accentLight, color: colors.brandBlue,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                position: 'absolute', left: 0
              }}>
                <Clock size={24} />
              </div>

              <div style={{ flex: 1, textAlign: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: colors.textMain }}>
                  {timeData.day}, {timeData.time}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '14px', color: colors.textMuted }}>
                  {timeData.date}
                </p>
              </div>
            </div>

            {/* 3. Attendees Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '16px',
                backgroundColor: colors.accentLight, color: colors.brandBlue,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                position: 'absolute', left: 0
              }}>
                <Users size={24} />
              </div>

              <div style={{ flex: 1, textAlign: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: colors.textMain }}>
                  Who's Going?
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '14px', color: colors.textMuted }}>
                  {event.interested_count || 1} {(event.interested_count || 1) === 1 ? 'person' : 'people'} interested
                </p>
              </div>
            </div>

          </div>

          {/* ACTION BUTTON */}
          <div style={{ marginTop: 'auto' }}>
            {isEventCreator() ? (
              <div style={{
                width: '100%', padding: '16px',
                backgroundColor: '#F1F5F9', color: colors.textMuted,
                borderRadius: '20px', fontSize: '15px', fontWeight: '700',
                textAlign: 'center', border: '1px dashed #CBD5E1'
              }}>
                You are hosting this Huddll
              </div>
            ) : isUserInterested() ? (
              <div>
                <button
                  style={{
                    width: '100%', padding: '20px',
                    backgroundColor: '#10B981',
                    color: 'white', border: 'none', borderRadius: '24px',
                    fontSize: '18px', fontWeight: '800', cursor: 'default',
                    boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  You're Going ✓
                </button>
                <button
                  onClick={handleLeave}
                  disabled={joining}
                  style={{
                    width: '100%', padding: '12px', marginTop: '12px',
                    backgroundColor: 'transparent',
                    color: '#EF4444', border: '2px solid #EF4444', borderRadius: '16px',
                    fontSize: '14px', fontWeight: '700', cursor: joining ? 'not-allowed' : 'pointer',
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
                  width: '100%', padding: '20px',
                  backgroundColor: joining ? colors.textMuted : colors.brandBlue,
                  color: 'white', border: 'none', borderRadius: '24px',
                  fontSize: '18px', fontWeight: '800', cursor: joining ? 'not-allowed' : 'pointer',
                  boxShadow: '0 10px 25px -5px rgba(74, 144, 186, 0.4)',
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

        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;