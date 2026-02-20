import React, { useState, useEffect } from 'react';
import { MapPin, Users, Clock, MessageCircle, Send, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import EventDetailModal from './EventDetailModal';
import theme from './theme';

const MyHuddllsPage = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [events, setEvents] = useState({ active: [], past: [] });
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    fetchHostedEvents();
    fetchUnreadCounts();
  }, []);

  const fetchUnreadCounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/chat/unread-counts/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await response.json();
      setUnreadCounts(data.unread_counts || {});
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  };

  const fetchHostedEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = JSON.parse(userStr);

      const response = await fetch('http://localhost:8000/api/events/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      const fetchedEvents = await response.json();
      setAllEvents(fetchedEvents);

      const now = new Date();

      // Filter to only events THIS USER is hosting
      const myHostedEvents = fetchedEvents.filter(event => {
        return Number(event.created_by) === Number(user.id);
      });

      const active = myHostedEvents.filter(e => new Date(e.start_time) >= now);
      const past = myHostedEvents.filter(e => new Date(e.start_time) < now);

      setEvents({ active, past });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);
      setLoading(false);
    }
  };

  const getStageInfo = (event) => {
    const interestedCount = event.interested_count || 1;
    const minAttendees = event.min_attendees || 3;

    // Check if event is happening soon (within 24 hours)
    const hoursUntilEvent = (new Date(event.start_time) - new Date()) / (1000 * 60 * 60);

    if (hoursUntilEvent <= 24 && hoursUntilEvent > 0) {
      return { label: 'Happening Soon', color: theme.skyBlue, icon: AlertCircle };
    }

    if (interestedCount >= minAttendees) {
      return { label: 'Confirmed', color: theme.teal, icon: CheckCircle };
    }

    if (interestedCount >= 2) {
      return { label: 'Details Pending', color: theme.peach, icon: Clock };
    }

    return { label: 'Planning', color: theme.textLight, icon: AlertCircle };
  };

  const formatEventTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return `Today • ${formatEventTime(dateString)}`;
    if (isTomorrow) return `Tomorrow • ${formatEventTime(dateString)}`;

    return `${date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • ${formatEventTime(dateString)}`;
  };

  const getCategoryEmoji = (category) => {
    const emojiMap = { food: '🍔', sports: '⚽', nightlife: '🎉', arts: '🎨', music: '🎵', social: '👥' };
    return emojiMap[category] || '📍';
  };

  const getTimeCreated = (dateString) => {
    if (!dateString) return 'Recently';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 7)} weeks ago`;
  };

  const handleViewEvent = (event) => {
    const fullEvent = allEvents.find(e => e.id === event.id);
    setSelectedEvent(fullEvent);
  };

  const EventCard = ({ event }) => {
    const stageInfo = getStageInfo(event);
    const StageIcon = stageInfo.icon;
    const unreadChats = unreadCounts[event.id] || 0;

    return (
      <div
        onClick={() => handleViewEvent(event)}
        style={{
          background: theme.slateLight,
          borderRadius: '20px',
          padding: '20px',
          border: `1px solid ${theme.border}`,
          marginBottom: '16px',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {/* Stage indicator bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: stageInfo.color,
          boxShadow: `0 0 20px ${stageInfo.color}`
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '48px', lineHeight: '1' }}>{getCategoryEmoji(event.category)}</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '800', color: theme.textMain }}>
              {event.title}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: theme.deepNavy,
                padding: '6px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '700',
                color: stageInfo.color,
                border: `1px solid ${stageInfo.color}40`
              }}>
                <StageIcon size={14} />
                {stageInfo.label}
              </div>
              <span style={{ fontSize: '12px', color: theme.textLight }}>
                {event.created_at ? `Created ${getTimeCreated(event.created_at)}` : 'Your event'}
              </span>
            </div>
          </div>

          {/* Unread chat badge */}
          {unreadChats > 0 && (
            <div style={{
              background: theme.error,
              color: 'white',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: '800',
              boxShadow: `0 0 16px ${theme.error}80`,
              flexShrink: 0
            }}>
              {unreadChats}
            </div>
          )}
        </div>

        {/* Event Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={16} color={theme.textSecondary} />
            <span style={{ fontSize: '14px', color: theme.textMain, fontWeight: '600' }}>
              {formatDate(event.start_time)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MapPin size={16} color={theme.textSecondary} />
            <span style={{ fontSize: '14px', color: theme.textMain, fontWeight: '600' }}>
              {event.venue_name}
            </span>
          </div>
        </div>

        {/* RSVP Status Grid */}
        <div style={{
          background: theme.deepNavy,
          borderRadius: '16px',
          padding: '16px',
          border: `1px solid ${theme.border}`,
          marginBottom: '16px'
        }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: theme.textSecondary, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Attendees
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: theme.teal, marginBottom: '4px' }}>
                {event.interested_count || 1}
              </div>
              <div style={{ fontSize: '11px', color: theme.textSecondary, fontWeight: '600' }}>Going</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: theme.textLight, marginBottom: '4px' }}>
                {event.max_attendees || '∞'}
              </div>
              <div style={{ fontSize: '11px', color: theme.textSecondary, fontWeight: '600' }}>Max</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: theme.skyBlue, marginBottom: '4px' }}>
                {event.min_attendees || 3}
              </div>
              <div style={{ fontSize: '11px', color: theme.textSecondary, fontWeight: '600' }}>Min</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              // Mark chat as read
              try {
                const token = localStorage.getItem('token');
                await fetch(`http://localhost:8000/api/chat/${event.id}/mark-read/`, {
                  method: 'POST',
                  headers: { 'Authorization': `Token ${token}` }
                });
                // Refresh unread counts
                await fetchUnreadCounts();
              } catch (error) {
                console.error('Error marking chat as read:', error);
              }
              handleViewEvent(event);
            }}
            style={{
              background: theme.accentGradient,
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: `0 4px 16px ${theme.skyBlue}40`
            }}
          >
            <MessageCircle size={16} />
            {unreadChats > 0 ? `${unreadChats} New` : 'Chat'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Open invite modal
            }}
            style={{
              background: theme.slate,
              color: theme.textMain,
              border: `1px solid ${theme.border}`,
              borderRadius: '12px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Send size={16} />
            Invite
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: theme.deepNavy,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.textSecondary
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.deepNavy,
      color: theme.textMain,
      paddingBottom: '100px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>

      {/* Header */}
      <div style={{
        backgroundColor: theme.slate,
        padding: '20px',
        borderBottom: `1px solid ${theme.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <h1 style={{
          margin: '0 0 8px 0',
          fontSize: '32px',
          fontWeight: '900',
          color: theme.textMain
        }}>
          My Huddlls
        </h1>
        <p style={{
          margin: 0,
          fontSize: '15px',
          color: theme.textSecondary
        }}>
          Events you're hosting
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        padding: '20px 20px 0',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          background: theme.slate,
          borderRadius: '16px',
          padding: '4px'
        }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'active' ? theme.accentGradient : 'transparent',
              color: activeTab === 'active' ? 'white' : theme.textSecondary,
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: activeTab === 'active' ? `0 4px 12px ${theme.skyBlue}40` : 'none',
              transition: 'all 0.2s'
            }}
          >
            Active ({events.active.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'past' ? theme.accentGradient : 'transparent',
              color: activeTab === 'past' ? 'white' : theme.textSecondary,
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: activeTab === 'past' ? `0 4px 12px ${theme.skyBlue}40` : 'none',
              transition: 'all 0.2s'
            }}
          >
            Past ({events.past.length})
          </button>
        </div>

        {/* Event List */}
        {activeTab === 'active' ? (
          events.active.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textSecondary }}>
              <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>🎯</div>
              <h3 style={{ fontSize: '20px', color: theme.textMain, marginBottom: '8px', fontWeight: '700' }}>
                No active events
              </h3>
              <p style={{ fontSize: '15px', color: theme.textSecondary }}>
                Create your first Huddll from the map!
              </p>
            </div>
          ) : (
            events.active.map(event => (
              <EventCard key={event.id} event={event} />
            ))
          )
        ) : (
          events.past.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textSecondary }}>
              <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>📚</div>
              <h3 style={{ fontSize: '20px', color: theme.textMain, marginBottom: '8px', fontWeight: '700' }}>
                No past events
              </h3>
              <p style={{ fontSize: '15px', color: theme.textSecondary }}>
                Your hosting history will appear here
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {events.past.map(event => (
                <div
                  key={event.id}
                  onClick={() => handleViewEvent(event)}
                  style={{
                    background: theme.slateLight,
                    borderRadius: '16px',
                    padding: '16px',
                    border: `1px solid ${theme.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ fontSize: '32px' }}>{getCategoryEmoji(event.category)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: theme.textMain, marginBottom: '4px' }}>
                      {event.title}
                    </div>
                    <div style={{ fontSize: '13px', color: theme.textSecondary }}>
                      {formatDate(event.start_time)} • {event.interested_count || 1} attended
                    </div>
                  </div>
                  <ChevronRight size={20} color={theme.textSecondary} />
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <EventDetailModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEventUpdated={fetchHostedEvents}
      />
    </div>
  );
};

export default MyHuddllsPage;