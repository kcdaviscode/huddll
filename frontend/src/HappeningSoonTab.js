import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Sparkles, Filter, Clock, TrendingUp } from 'lucide-react';
import theme from './theme';

const HappeningSoonTab = ({ onEventClick }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    timeframe: 'all',
    category: 'all',
    distance: 'all'
  });

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams(filters);
      const response = await fetch(`http://localhost:8000/api/users/happening-soon/?${params}`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/events/${eventId}/mark_interested/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Refresh events
        fetchEvents();
      }
    } catch (error) {
      console.error('Error joining event:', error);
    }
  };

  const groupEventsByTime = () => {
    const now = new Date();
    const groups = {
      today: [],
      tomorrow: [],
      thisWeekend: [],
      nextWeek: [],
      later: []
    };

    events.forEach(event => {
      const eventDate = new Date(event.start_time);
      const daysDiff = Math.floor((eventDate - now) / (1000 * 60 * 60 * 24));

      if (daysDiff === 0) {
        groups.today.push(event);
      } else if (daysDiff === 1) {
        groups.tomorrow.push(event);
      } else if (daysDiff <= 3 && [5, 6].includes(eventDate.getDay())) {
        groups.thisWeekend.push(event);
      } else if (daysDiff <= 7) {
        groups.nextWeek.push(event);
      } else {
        groups.later.push(event);
      }
    });

    return groups;
  };

  const EventCard = ({ event }) => {
    const eventDate = new Date(event.start_time);
    const isUserGoing = event.user_interested;

    return (
      <div
        onClick={() => onEventClick(event.id)}
        style={{
          background: theme.slateLight,
          borderRadius: '20px',
          padding: '20px',
          border: `1px solid ${theme.border}`,
          borderLeft: `4px solid ${theme.skyBlue}`,
          cursor: 'pointer',
          transition: 'all 0.2s',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 8px 24px ${theme.skyBlue}25`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '200px',
          height: '200px',
          background: `radial-gradient(circle, ${theme.skyBlue}15 0%, transparent 70%)`,
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', gap: '16px', position: 'relative' }}>
          {/* Event emoji/icon */}
          <div style={{
            fontSize: '48px',
            flexShrink: 0,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
          }}>
            {event.emoji}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Event title */}
            <h3 style={{
              margin: '0 0 8px',
              fontSize: '18px',
              fontWeight: '800',
              color: theme.textMain,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {event.title}
            </h3>

            {/* Venue */}
            <div style={{
              fontSize: '14px',
              color: theme.textSecondary,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '8px'
            }}>
              <MapPin size={14} />
              {event.venue_name}
            </div>

            {/* Time */}
            <div style={{
              fontSize: '14px',
              color: theme.textSecondary,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '16px'
            }}>
              <Clock size={14} />
              {eventDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </div>

            {/* Friends going */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: `1px solid ${theme.border}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Friend avatars */}
                <div style={{ display: 'flex', marginLeft: '-4px' }}>
                  {event.friends_going.slice(0, 3).map((friend, idx) => {
                    const name = friend.first_name && friend.last_name
                      ? `${friend.first_name} ${friend.last_name}`
                      : friend.username;
                    const avatar = friend.first_name
                      ? friend.first_name[0].toUpperCase()
                      : friend.username[0].toUpperCase();

                    return friend.profile_photo_url ? (
                      <div
                        key={friend.id}
                        title={name}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          backgroundImage: `url(${friend.profile_photo_url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          border: `2px solid ${theme.slateLight}`,
                          marginLeft: idx > 0 ? '-8px' : '0',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                      />
                    ) : (
                      <div
                        key={friend.id}
                        title={name}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          background: theme.accentGradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: '700',
                          color: 'white',
                          border: `2px solid ${theme.slateLight}`,
                          marginLeft: idx > 0 ? '-8px' : '0',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                      >
                        {avatar}
                      </div>
                    );
                  })}
                </div>

                <div style={{ fontSize: '13px', color: theme.textSecondary, fontWeight: '600' }}>
                  {event.friend_count === 1 ? (
                    <>
                      <span style={{ color: theme.skyBlue }}>
                        {event.friends_going[0].first_name || event.friends_going[0].username}
                      </span> is going
                    </>
                  ) : event.friend_count === 2 ? (
                    <>
                      <span style={{ color: theme.skyBlue }}>
                        {event.friends_going[0].first_name || event.friends_going[0].username}
                      </span> and{' '}
                      <span style={{ color: theme.skyBlue }}>
                        {event.friends_going[1].first_name || event.friends_going[1].username}
                      </span> are going
                    </>
                  ) : (
                    <>
                      <span style={{ color: theme.skyBlue }}>{event.friend_count} friends</span> going
                    </>
                  )}
                </div>
              </div>

              {/* Join button */}
              {!isUserGoing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinEvent(event.id);
                  }}
                  style={{
                    background: theme.accentGradient,
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: `0 4px 12px ${theme.skyBlue}30`,
                    transition: 'transform 0.2s'
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Join Them
                </button>
              )}
              {isUserGoing && (
                <div style={{
                  background: `${theme.teal}20`,
                  color: theme.teal,
                  borderRadius: '12px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '700',
                  border: `1px solid ${theme.teal}`
                }}>
                  You're Going ✓
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TimeSection = ({ title, icon, events, gradient }) => {
    if (events.length === 0) return null;

    return (
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          padding: '12px 16px',
          background: `linear-gradient(135deg, ${gradient}15, transparent)`,
          borderRadius: '16px',
          border: `1px solid ${gradient}30`
        }}>
          {icon}
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '800',
            color: theme.textMain
          }}>
            {title}
          </h3>
          <div style={{
            marginLeft: 'auto',
            background: gradient,
            color: 'white',
            borderRadius: '20px',
            padding: '4px 12px',
            fontSize: '13px',
            fontWeight: '700'
          }}>
            {events.length}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    );
  };

  const grouped = groupEventsByTime();

  return (
    <div>
      {/* Header with sparkle effect */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <Sparkles size={28} color={theme.skyBlue} style={{ filter: 'drop-shadow(0 2px 4px rgba(56, 189, 248, 0.4))' }} />
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: theme.textMain }}>
            Happening Soon
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: '15px', color: theme.textSecondary }}>
          Events your friends are going to
        </p>
      </div>

      {/* Filters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginBottom: '32px',
        padding: '20px',
        background: theme.slateLight,
        borderRadius: '20px',
        border: `1px solid ${theme.border}`
      }}>
        {/* Timeframe */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: '700',
            color: theme.textLight,
            textTransform: 'uppercase',
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>
            When
          </label>
          <select
            value={filters.timeframe}
            onChange={(e) => setFilters({ ...filters, timeframe: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '12px',
              border: `1px solid ${theme.border}`,
              background: theme.deepNavy,
              color: theme.textMain,
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Upcoming</option>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="weekend">This Weekend</option>
            <option value="week">This Week</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: '700',
            color: theme.textLight,
            textTransform: 'uppercase',
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>
            Vibe
          </label>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '12px',
              border: `1px solid ${theme.border}`,
              background: theme.deepNavy,
              color: theme.textMain,
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Vibes</option>
            <option value="food">🍔 Food</option>
            <option value="sports">⚽ Sports</option>
            <option value="nightlife">🎉 Nightlife</option>
            <option value="arts">🎨 Arts</option>
            <option value="music">🎵 Music</option>
            <option value="social">👥 Social</option>
          </select>
        </div>

        {/* Distance */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: '700',
            color: theme.textLight,
            textTransform: 'uppercase',
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>
            Distance
          </label>
          <select
            value={filters.distance}
            onChange={(e) => setFilters({ ...filters, distance: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '12px',
              border: `1px solid ${theme.border}`,
              background: theme.deepNavy,
              color: theme.textMain,
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <option value="all">Any Distance</option>
            <option value="5">Within 5 miles</option>
            <option value="10">Within 10 miles</option>
            <option value="25">Within 25 miles</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textSecondary }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${theme.slateLight}`,
            borderTop: `3px solid ${theme.skyBlue}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          Finding events...
        </div>
      )}

      {/* Events grouped by time */}
      {!loading && events.length > 0 && (
        <>
          <TimeSection
            title="Today"
            icon={<TrendingUp size={20} color={theme.skyBlue} />}
            events={grouped.today}
            gradient={theme.skyBlue}
          />
          <TimeSection
            title="Tomorrow"
            icon={<Calendar size={20} color={theme.teal} />}
            events={grouped.tomorrow}
            gradient={theme.teal}
          />
          <TimeSection
            title="This Weekend"
            icon={<Sparkles size={20} color={theme.indigo} />}
            events={grouped.thisWeekend}
            gradient={theme.indigo}
          />
          <TimeSection
            title="Next Week"
            icon={<Clock size={20} color={theme.textSecondary} />}
            events={grouped.nextWeek}
            gradient={theme.textSecondary}
          />
          <TimeSection
            title="Coming Up"
            icon={<Calendar size={20} color={theme.textLight} />}
            events={grouped.later}
            gradient={theme.textLight}
          />
        </>
      )}

      {/* Empty state */}
      {!loading && events.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: theme.slateLight,
          borderRadius: '20px',
          border: `1px solid ${theme.border}`
        }}>
          <Sparkles size={48} color={theme.textLight} style={{ marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: theme.textMain }}>
            Nothing Yet
          </h3>
          <p style={{ margin: 0, fontSize: '15px', color: theme.textSecondary }}>
            When your friends join events, you'll see them here!
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default HappeningSoonTab;