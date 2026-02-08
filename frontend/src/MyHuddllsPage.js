import React, { useState, useEffect } from 'react';

const MyHuddllsPage = () => {
  const [activeFilter, setActiveFilter] = useState('upcoming');
  const [huddlls, setHuddlls] = useState({
    upcoming: [],
    past: [],
    proposed: []
  });
  const [loading, setLoading] = useState(true);

  // Branding Colors
  const colors = {
    bg: '#F8FAFC',
    header: '#0F172A',
    brandBlue: '#4A90BA',
    brandYellow: '#F59E0B',
    brandGreen: '#10B981',
    textMain: '#1E293B',
    textMuted: '#64748B',
    cardBg: '#FFFFFF'
  };

  // Fetch user's events
  useEffect(() => {
    fetchUserEvents();
  }, []);

  const fetchUserEvents = async () => {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    console.log('User from localStorage:', userStr);

    const user = JSON.parse(userStr);
    console.log('Parsed user:', user);
    console.log('User ID:', user.id);

    const response = await fetch('http://localhost:8000/api/events/', {
      headers: {
        'Authorization': `Token ${token}`
      }
    });
    const allEvents = await response.json();
    console.log('All events:', allEvents);

    const now = new Date();

    const myEvents = allEvents.filter(event => {
      console.log(`Comparing event.created_by (${event.created_by}) with user.id (${user.id})`);
      return Number(event.created_by) === Number(user.id);
    });

    console.log('My events:', myEvents);

    const categorized = {
      upcoming: [],
      past: [],
      proposed: []
    };

    myEvents.forEach(event => {
      const eventDate = new Date(event.start_time);
      const attendeeCount = event.checkins ? event.checkins.length + 1 : 1;

      let status = 'proposed';
      if (attendeeCount === 2) status = 'pending';
      if (attendeeCount >= 3) status = 'active';

      const eventData = {
  id: event.id,
  title: event.title,
  venue: event.venue_name,
  time: formatEventTime(eventDate),
  attendees: attendeeCount,
  max_attendees: event.max_attendees, // Remove the || 5 fallback
  status: status,
  emoji: getCategoryEmoji(event.category),
  rawDate: eventDate
};

      if (eventDate < now) {
        categorized.past.push({ ...eventData, status: 'completed' });
      } else if (attendeeCount === 1) {
        categorized.proposed.push(eventData);
      } else {
        categorized.upcoming.push(eventData);
      }
    });

    console.log('Categorized:', categorized);
    setHuddlls(categorized);
    setLoading(false);
  } catch (error) {
    console.error('Error fetching events:', error);
    setLoading(false);
  }
};

  const formatEventTime = (date) => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    if (isToday) return `Today, ${timeStr}`;
    if (isTomorrow) return `Tomorrow, ${timeStr}`;

    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${dateStr}, ${timeStr}`;
  };

  const getCategoryEmoji = (category) => {
    const emojiMap = {
      food: '🍔',
      sports: '⚽',
      nightlife: '🎉',
      arts: '🎨',
      music: '🎵',
      social: '👥'
    };
    return emojiMap[category] || '📍';
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return colors.brandBlue;
      case 'pending': return colors.brandYellow;
      case 'completed': return colors.textMuted;
      case 'proposed': return colors.textMuted;
      default: return colors.textMuted;
    }
  };

  const currentHuddlls = huddlls[activeFilter] || [];

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: colors.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '24px', color: colors.textMuted }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.bg,
      paddingBottom: '100px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>

      {/* HEADER */}
      <div style={{
        backgroundColor: colors.header,
        padding: '60px 24px 40px',
        borderBottomLeftRadius: '32px',
        borderBottomRightRadius: '32px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
           position: 'absolute', top: '-50%', right: '-20%', width: '300px', height: '300px',
           backgroundColor: colors.brandBlue, filter: 'blur(80px)', opacity: 0.2, borderRadius: '50%'
        }} />

        <div style={{ position: 'relative', zIndex: 10 }}>
          <h1 style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-1px', margin: '0 0 4px 0' }}>
            My Huddlls
          </h1>
          <p style={{ margin: 0, opacity: 0.7, fontSize: '15px', fontWeight: '500' }}>
            Where you're going & where you've been.
          </p>
        </div>
      </div>

      {/* FILTER TABS */}
      <div style={{ padding: '0 24px', marginTop: '-24px', marginBottom: '32px', position: 'relative', zIndex: 20 }}>
        <div style={{
          display: 'flex',
          padding: '6px',
          backgroundColor: 'white',
          borderRadius: '20px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
        }}>
          {['upcoming', 'past', 'proposed'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '13px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderRadius: '14px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: activeFilter === filter ? colors.header : 'transparent',
                color: activeFilter === filter ? 'white' : colors.textMuted,
              }}
            >
              {filter} ({huddlls[filter].length})
            </button>
          ))}
        </div>
      </div>

      {/* EVENT LIST */}
      <div style={{ padding: '0 24px' }}>
        {currentHuddlls.length === 0 ? (
          // EMPTY STATE
          <div style={{
            backgroundColor: 'white', borderRadius: '32px', padding: '60px 24px',
            textAlign: 'center', border: '2px dashed #E2E8F0'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>🦗</div>
            <h3 style={{ fontWeight: '800', fontSize: '20px', color: colors.textMain, margin: '0 0 8px 0' }}>
              {activeFilter === 'proposed' ? 'No proposed Huddlls yet' :
               activeFilter === 'past' ? 'No past Huddlls yet' :
               'It\'s quiet... too quiet.'}
            </h3>
            <p style={{ fontSize: '14px', color: colors.textMuted, margin: '0 0 24px 0' }}>
              Check the map to find a crew nearby.
            </p>
          </div>
        ) : (
          // CARD LIST
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {currentHuddlls.map(huddll => (
              <div key={huddll.id} style={{
                backgroundColor: 'white',
                borderRadius: '24px',
                padding: '20px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
                border: '1px solid #F1F5F9',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Status Bar */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px',
                  backgroundColor: getStatusColor(huddll.status)
                }} />

                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

                  {/* Emoji Icon Box */}
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '20px',
                    backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '32px', flexShrink: 0
                  }}>
                    {huddll.emoji}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                       {/* STATUS BADGE */}
                       {huddll.status === 'active' && (
                         <span style={{ fontSize: '10px', fontWeight: '800', color: colors.brandBlue, backgroundColor: '#E0F2FE', padding: '4px 8px', borderRadius: '8px', textTransform: 'uppercase' }}>
                           Locked In
                         </span>
                       )}
                       {huddll.status === 'pending' && (
                         <span style={{ fontSize: '10px', fontWeight: '800', color: colors.brandYellow, backgroundColor: '#FEF3C7', padding: '4px 8px', borderRadius: '8px', textTransform: 'uppercase' }}>
                           Waiting for 1 more
                         </span>
                       )}
                       {huddll.status === 'completed' && (
                         <span style={{ fontSize: '10px', fontWeight: '800', color: colors.textMuted, backgroundColor: '#F1F5F9', padding: '4px 8px', borderRadius: '8px', textTransform: 'uppercase' }}>
                           Past
                         </span>
                       )}
                       {huddll.status === 'proposed' && (
                         <span style={{ fontSize: '10px', fontWeight: '800', color: colors.textMuted, backgroundColor: '#F1F5F9', padding: '4px 8px', borderRadius: '8px', textTransform: 'uppercase' }}>
                           Proposed
                         </span>
                       )}
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: colors.textMain, margin: '0 0 4px 0', lineHeight: 1.2 }}>
                      {huddll.title}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                       <span style={{ fontSize: '14px' }}>📍</span>
                       <span style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted }}>{huddll.venue}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                       <span style={{ fontSize: '14px' }}>🕐</span>
                       <span style={{ fontSize: '13px', fontWeight: '500', color: colors.textMuted }}>{huddll.time}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{
                  marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #F1F5F9',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', paddingLeft: '8px' }}>
                         {/* Fake Avatars */}
                         {[...Array(Math.min(3, huddll.attendees))].map((_, i) => (
                           <div key={i} style={{
                             width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#CBD5E1',
                             border: '2px solid white', marginLeft: '-8px'
                           }} />
                         ))}
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: colors.textMain }}>
  {huddll.attendees}{huddll.max_attendees ? `/${huddll.max_attendees}` : '+'} Going
</span>
                   </div>

                   <span style={{
                      color: getStatusColor(huddll.status),
                      fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px'
                   }}>
                      View Event
                   </span>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default MyHuddllsPage;