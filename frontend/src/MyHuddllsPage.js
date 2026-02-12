import React, { useState, useEffect } from 'react';
import { MapPin, Users, Clock, Camera } from 'lucide-react';
import EventDetailModal from './EventDetailModal';

const MyHuddllsPage = () => {
  const [viewMode, setViewMode] = useState('upcoming');
  const [events, setEvents] = useState({ upcoming: [], past: [] });
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const theme = {
    bg: '#121212',
    cardBg: '#1E1E1E',
    headerBg: '#1E1E1E',
    accent: '#4A90E2',
    accentDim: 'rgba(74, 144, 226, 0.1)',
    textMain: '#FFFFFF',
    textSecondary: '#B0B3B8',
    divider: '#2F3336',
    success: '#34D399'
  };

  useEffect(() => {
    fetchUserEvents();
  }, []);

  const fetchUserEvents = async () => {
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

      const myEvents = fetchedEvents.filter(event => {
        return event.interested_user_ids && event.interested_user_ids.includes(Number(user.id));
      });

      const upcoming = myEvents.filter(e => new Date(e.start_time) >= now);
      const past = myEvents.filter(e => new Date(e.start_time) < now);

      setEvents({ upcoming, past });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);
      setLoading(false);
    }
  };

  const formatEventTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const getCategoryEmoji = (category) => {
    const emojiMap = { food: '🍔', sports: '⚽', nightlife: '🎉', arts: '🎨', music: '🎵', social: '👥' };
    return emojiMap[category] || '📍';
  };

  const handleViewEvent = (event) => {
    const fullEvent = allEvents.find(e => e.id === event.id);
    setSelectedEvent(fullEvent);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textSecondary }}>
        Loading Huddll...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.textMain, paddingBottom: '80px', fontFamily: '-apple-system, sans-serif' }}>

      {/* HEADER */}
      <div style={{ backgroundColor: theme.headerBg, padding: '20px 20px', borderBottom: `1px solid ${theme.divider}`, position: 'sticky', top: 0, zIndex: 50 }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 20px 0', textAlign: 'center', letterSpacing: '0.5px' }}>
          My Huddlls
        </h1>

        <div style={{ display: 'flex', backgroundColor: '#000000', borderRadius: '8px', padding: '4px' }}>
          <button
            onClick={() => setViewMode('upcoming')}
            style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: '6px',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              backgroundColor: viewMode === 'upcoming' ? theme.cardBg : 'transparent',
              color: viewMode === 'upcoming' ? theme.textMain : theme.textSecondary,
              transition: 'all 0.2s'
            }}
          >
            PLANS ({events.upcoming?.length || 0})
          </button>
          <button
            onClick={() => setViewMode('past')}
            style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: '6px',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              backgroundColor: viewMode === 'past' ? theme.cardBg : 'transparent',
              color: viewMode === 'past' ? theme.textMain : theme.textSecondary,
              transition: 'all 0.2s'
            }}
          >
            RECAPS ({events.past?.length || 0})
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>

        {(viewMode === 'upcoming' ? events.upcoming : events.past).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textSecondary }}>
            <div style={{ fontSize: '40px', marginBottom: '15px', opacity: 0.5 }}>
              {viewMode === 'upcoming' ? '🧭' : '🎞️'}
            </div>
            <h3 style={{ fontSize: '18px', color: theme.textMain, marginBottom: '8px' }}>
              {viewMode === 'upcoming' ? 'No active plans' : 'No memories yet'}
            </h3>
            <p style={{ fontSize: '14px' }}>
              {viewMode === 'upcoming' ? 'Check the map to find a Huddll nearby.' : 'Join an event to start building your history.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* UPCOMING PLAN CARDS */}
            {viewMode === 'upcoming' && events.upcoming.map(event => (
              <div key={event.id} onClick={() => handleViewEvent(event)} style={{ backgroundColor: theme.cardBg, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${theme.divider}`, cursor: 'pointer', transition: 'transform 0.2s' }}
                   onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                   onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>

                <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '32px' }}>
                    {getCategoryEmoji(event.category)}
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: theme.textMain }}>{event.title}</div>
                    <div style={{ fontSize: '12px', color: theme.textSecondary }}>{formatDate(event.start_time)} • {formatEventTime(event.start_time)}</div>
                  </div>
                </div>

                <div style={{ padding: '0 16px 16px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <MapPin size={14} color={theme.textSecondary} />
                    <span style={{ fontSize: '14px', color: theme.accent, fontWeight: '500' }}>{event.venue_name}</span>
                  </div>
                  {event.city && (
                    <div style={{ fontSize: '13px', color: theme.textSecondary, marginLeft: '20px' }}>{event.city}</div>
                  )}
                </div>

                <div style={{ padding: '12px 16px', backgroundColor: '#000000', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={16} color={theme.accent} />
                    <span style={{ fontSize: '13px', color: theme.accent, fontWeight: '600' }}>{event.interested_count || 1} interested</span>
                  </div>
                  <span style={{ fontSize: '12px', color: theme.textSecondary }}>Tap for details</span>
                </div>
              </div>
            ))}

            {/* PAST RECAP CARDS */}
            {viewMode === 'past' && events.past.map(event => (
              <div key={event.id} onClick={() => handleViewEvent(event)} style={{ backgroundColor: theme.cardBg, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${theme.divider}`, cursor: 'pointer', transition: 'transform 0.2s' }}
                   onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                   onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>

                <div style={{ padding: '20px 20px 10px', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 5px' }}>{event.title}</h3>
                  <div style={{ fontSize: '13px', color: theme.textSecondary }}>
                    at <span style={{ color: theme.accent }}>{event.venue_name}</span> • {formatDate(event.start_time)}
                  </div>
                </div>

                {/* Photo Grid Placeholder */}
                <div style={{ padding: '10px 15px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '4px', height: '200px' }}>
                   <div style={{ backgroundColor: '#2A2A2A', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
                      <Camera size={32} />
                      <div style={{ fontSize: '12px', marginTop: '8px' }}>Photos coming soon</div>
                   </div>
                   <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '4px' }}>
                      <div style={{ backgroundColor: '#252525', borderRadius: '8px' }}></div>
                      <div style={{ backgroundColor: '#252525', borderRadius: '8px' }}></div>
                   </div>
                </div>

                <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={16} color={theme.textSecondary} />
                    <span style={{ fontSize: '13px', color: theme.textSecondary }}>
                      {event.interested_count || 1} attended
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: theme.textSecondary }}>View event</span>
                </div>
              </div>
            ))}

          </div>
        )}
      </div>

      <EventDetailModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEventUpdated={fetchUserEvents}
      />
    </div>
  );
};

export default MyHuddllsPage;