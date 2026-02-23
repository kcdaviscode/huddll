import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Edit3, MapPin, Users, Clock, Star, User,
  UserPlus, MessageCircle, Heart, Sparkles, Calendar,
  LogOut, Tag, Mail
} from 'lucide-react';
import Header from './Header';
import EventDetailModal from './EventDetailModal';
import theme from './theme';

const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [friends, setFriends] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('timeline');
  const [loading, setLoading] = useState(true);
  const [detailModalEvent, setDetailModalEvent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Token ${token}` };
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

      // Fetch all data in parallel
      const [profileRes, friendsRes, timelineRes, eventsRes] = await Promise.all([
        fetch(`${baseUrl}/api/users/profile/`, { headers }),
        fetch(`${baseUrl}/api/users/friends/`, { headers }),
        fetch(`${baseUrl}/api/users/timeline/`, { headers }),
        fetch(`${baseUrl}/api/users/my-events/`, { headers })
      ]);

      const profileData = await profileRes.json();
      const friendsData = await friendsRes.json();
      const timelineData = await timelineRes.json();
      const eventsData = await eventsRes.json();

      setProfileData(profileData);
      setFriends(friendsData);
      setTimeline(timelineData);
      setMyEvents(eventsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: theme.deepNavy, color: theme.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: `3px solid ${theme.slateLight}`,
          borderTop: `3px solid ${theme.skyBlue}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const TimelineTab = () => (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: '24px', fontWeight: '700', color: theme.textMain }}>Timeline</h2>

      {timeline.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textSecondary }}>
          <Sparkles size={48} color={theme.textLight} style={{ marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: theme.textMain }}>No Activity Yet</h3>
          <p style={{ margin: 0, fontSize: '15px' }}>When your friends join events, you'll see their activity here!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {timeline.map(post => (
            <div key={post.id} style={{ background: theme.slateLight, borderRadius: '16px', padding: '20px', border: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: theme.accentGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'white', fontSize: '18px', flexShrink: 0 }}>
                  {post.user.avatar}
                </div>
                <div>
                  <div style={{ fontSize: '15px', color: theme.textMain }}>
                    <strong>{post.user.name}</strong> <span style={{ color: theme.textSecondary }}>{post.action}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: theme.textLight }}>{post.time}</div>
                </div>
              </div>

              <div style={{ background: theme.slate, borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '14px' }}>
                  <div style={{ fontSize: '42px' }}>{post.event.emoji}</div>
                  <div>
                    <div style={{ fontSize: '17px', fontWeight: '700', color: theme.textMain, marginBottom: '4px' }}>{post.event.name}</div>
                    <div style={{ fontSize: '14px', color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} /> {post.event.venue}
                    </div>
                  </div>
                </div>
              </div>

              {/* Show event image if it exists */}
              {post.event.image_url && (
                <div style={{
                  width: '100%',
                  height: '220px',
                  backgroundImage: `url(${post.event.image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  border: `1px solid ${theme.border}`
                }} />
              )}

              <div style={{ display: 'flex', gap: '20px', paddingTop: '12px', borderTop: `1px solid ${theme.border}` }}>
                <button style={{ background: 'none', border: 'none', color: theme.textSecondary, fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <Heart size={16} /> {post.likes}
                </button>
                <button style={{ background: 'none', border: 'none', color: theme.textSecondary, fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <MessageCircle size={16} /> {post.comments}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const FriendsTab = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: theme.textMain }}>Friends ({friends.length})</h2>
        <button style={{ background: theme.accentGradient, color: 'white', border: 'none', borderRadius: '12px', padding: '10px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: `0 4px 16px ${theme.skyBlue}40` }}>
          <UserPlus size={16} /> Add Friend
        </button>
      </div>

      {friends.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textSecondary }}>
          <Users size={48} color={theme.textLight} style={{ marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: theme.textMain }}>No Friends Yet</h3>
          <p style={{ margin: '0 0 20px', fontSize: '15px' }}>Start connecting with people at events!</p>
          <button style={{ background: theme.accentGradient, color: 'white', border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
            Find Friends
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {friends.map(friend => {
            const displayName = friend.first_name && friend.last_name
              ? `${friend.first_name} ${friend.last_name}`
              : friend.username;
            const avatar = friend.first_name ? friend.first_name[0].toUpperCase() : friend.username[0].toUpperCase();

            return (
              <div key={friend.id} style={{ background: theme.slateLight, borderRadius: '16px', padding: '20px', border: `1px solid ${theme.border}`, textAlign: 'center', position: 'relative', cursor: 'pointer' }}>
                {friend.profile_photo_url ? (
                  <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '16px',
                    backgroundImage: `url(${friend.profile_photo_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    margin: '0 auto 12px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                  }} />
                ) : (
                  <div style={{ width: '70px', height: '70px', borderRadius: '16px', background: `linear-gradient(135deg, ${theme.indigo}, ${theme.skyBlue})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700', color: 'white', margin: '0 auto 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                    {avatar}
                  </div>
                )}
                <div style={{ fontSize: '15px', fontWeight: '700', color: theme.textMain, marginBottom: '4px' }}>{displayName}</div>
                {friend.city && (
                  <div style={{ fontSize: '12px', color: theme.textSecondary }}>{friend.city}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const EventsTab = () => {
    const now = new Date();
    const upcomingEvents = myEvents.filter(event => new Date(event.start_time) >= now);
    const pastEvents = myEvents.filter(event => new Date(event.start_time) < now);

    const [showUpcoming, setShowUpcoming] = useState(true);
    const [showPast, setShowPast] = useState(false);

    const handleEventClick = async (eventId, e) => {
      e.stopPropagation(); // Prevent collapse/expand when clicking event

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/api/events/${eventId}/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        if (response.ok) {
          const eventData = await response.json();
          setDetailModalEvent(eventData);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
      }
    };

    const renderEvent = (event) => (
      <div
        key={event.id}
        style={{
          background: theme.slateLight,
          borderRadius: '20px',
          padding: '24px',
          border: `1px solid ${theme.border}`,
          borderLeft: `4px solid ${theme.skyBlue}`,
          boxShadow: `0 0 20px ${theme.skyBlue}15`,
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onClick={(e) => handleEventClick(event.id, e)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 4px 24px ${theme.skyBlue}25`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = `0 0 20px ${theme.skyBlue}15`;
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '56px' }}>{event.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: theme.textMain, marginBottom: '4px' }}>{event.title}</div>

            {/* Venue */}
            <div style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} />
              {event.venue_name}
            </div>

            {/* Date/Time */}
            <div style={{ fontSize: '15px', color: theme.textSecondary, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={16} />
              {new Date(event.start_time).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: theme.deepNavy, border: `1px solid ${theme.skyBlue}`, borderRadius: '12px', padding: '8px 16px', fontSize: '14px', fontWeight: '600', color: theme.textMain }}>
                <Users size={16} /> {event.interested_count} going
              </div>
              {event.is_creator && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: theme.deepNavy, border: `1px solid ${theme.teal}`, borderRadius: '12px', padding: '8px 16px', fontSize: '14px', fontWeight: '600', color: theme.teal }}>
                  <Star size={16} /> Host
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <div>
        <h2 style={{ margin: '0 0 24px', fontSize: '24px', fontWeight: '700', color: theme.textMain }}>My Events</h2>

        {myEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textSecondary }}>
            <Calendar size={48} color={theme.textLight} style={{ marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: theme.textMain }}>No Events Yet</h3>
            <p style={{ margin: '0 0 20px', fontSize: '15px' }}>Create or join events to see them here!</p>
            <button
              onClick={() => navigate('/map')}
              style={{ background: theme.accentGradient, color: 'white', border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
              Browse Events
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div>
                <button
                  onClick={() => setShowUpcoming(!showUpcoming)}
                  style={{
                    width: '100%',
                    background: theme.slateLight,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    marginBottom: showUpcoming ? '16px' : '0',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Sparkles size={20} color={theme.skyBlue} />
                    <span style={{ fontSize: '18px', fontWeight: '700', color: theme.textMain }}>
                      Upcoming Events ({upcomingEvents.length})
                    </span>
                  </div>
                  <div style={{
                    transform: showUpcoming ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    color: theme.textSecondary
                  }}>▼</div>
                </button>

                {showUpcoming && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {upcomingEvents.map(renderEvent)}
                  </div>
                )}
              </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div>
                <button
                  onClick={() => setShowPast(!showPast)}
                  style={{
                    width: '100%',
                    background: theme.slateLight,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    marginBottom: showPast ? '16px' : '0',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Clock size={20} color={theme.textLight} />
                    <span style={{ fontSize: '18px', fontWeight: '700', color: theme.textMain }}>
                      Past Events ({pastEvents.length})
                    </span>
                  </div>
                  <div style={{
                    transform: showPast ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    color: theme.textSecondary
                  }}>▼</div>
                </button>

                {showPast && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', opacity: 0.7 }}>
                    {pastEvents.map(renderEvent)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const ProfileTab = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: theme.textMain }}>Profile</h2>
        <button style={{ background: theme.accentGradient, color: 'white', border: 'none', borderRadius: '12px', padding: '10px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: `0 4px 16px ${theme.skyBlue}40` }}>
          <Edit3 size={16} /> Edit Profile
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* About Me */}
        {profileData?.bio && (
          <div style={{ background: theme.slateLight, borderRadius: '16px', padding: '24px', border: `1px solid ${theme.border}` }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: '700', color: theme.textMain, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color={theme.skyBlue} /> About Me
            </h3>
            <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.6', color: theme.textSecondary }}>
              {profileData.bio}
            </p>
          </div>
        )}

        {/* Contact & Location */}
        <div style={{ background: theme.slateLight, borderRadius: '16px', padding: '24px', border: `1px solid ${theme.border}` }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: theme.textMain }}>Contact & Location</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profileData?.city && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: theme.slate, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={18} color={theme.skyBlue} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: theme.textLight }}>Location</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: theme.textMain }}>{profileData.city}</div>
                </div>
              </div>
            )}
            {profileData?.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: theme.slate, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={18} color={theme.teal} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: theme.textLight }}>Email</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: theme.textMain }}>{profileData.email}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Interests */}
        {profileData?.interests && profileData.interests.length > 0 && (
          <div style={{ background: theme.slateLight, borderRadius: '16px', padding: '24px', border: `1px solid ${theme.border}` }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: theme.textMain, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={18} color={theme.skyBlue} /> Interests
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {profileData.interests.map(interest => (
                <div key={interest} style={{
                  background: theme.slate,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '20px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: theme.textMain
                }}>
                  {interest}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.deepNavy, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <Header />

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)', marginTop: '70px' }}>

      {/* Fixed Left Sidebar */}
      <div style={{ width: '240px', background: theme.slate, borderRight: `1px solid ${theme.border}`, padding: '24px', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Profile Summary */}
        <div style={{ textAlign: 'center', marginBottom: '24px', paddingBottom: '24px', borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: theme.accentGradient, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '700', color: 'white', boxShadow: `0 8px 24px ${theme.skyBlue}40` }}>
            {profileData?.first_name ? profileData.first_name.charAt(0).toUpperCase() : profileData?.username?.charAt(0).toUpperCase()}
          </div>
          <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '700', color: theme.textMain }}>
            {profileData?.first_name && profileData?.last_name
              ? `${profileData.first_name} ${profileData.last_name}`
              : profileData?.username}
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: theme.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <MapPin size={12} /> {profileData?.city || 'Baltimore, MD'}
          </p>
        </div>

        {/* Stats */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', color: theme.textLight, textTransform: 'uppercase', marginBottom: '12px', fontWeight: '600', letterSpacing: '0.5px' }}>Stats</div>
          {[
            { label: 'Events Attended', value: profileData?.events_attended || '0', color: theme.skyBlue },
            { label: 'Hosted', value: profileData?.huddlls_hosted || '0', color: theme.teal },
            { label: 'Friends', value: friends.length, color: theme.indigo }
          ].map(stat => (
            <div key={stat.label} style={{ marginBottom: '10px', padding: '12px', background: theme.slateLight, borderRadius: '10px', borderLeft: `3px solid ${stat.color}` }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: theme.textMain, marginBottom: '2px' }}>{stat.value}</div>
              <div style={{ fontSize: '11px', color: theme.textSecondary }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', color: theme.textLight, textTransform: 'uppercase', marginBottom: '12px', fontWeight: '600', letterSpacing: '0.5px' }}>Navigation</div>
          {[
            { id: 'timeline', icon: <Sparkles size={16} />, label: 'Timeline' },
            { id: 'friends', icon: <Users size={16} />, label: 'Friends' },
            { id: 'events', icon: <Calendar size={16} />, label: 'Events' },
            { id: 'profile', icon: <User size={16} />, label: 'Profile' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                background: activeTab === item.id ? theme.slateLight : 'transparent',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 14px',
                color: activeTab === item.id ? theme.skyBlue : theme.textSecondary,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '40px 60px', overflowY: 'auto' }}>
        {activeTab === 'timeline' && <TimelineTab />}
        {activeTab === 'friends' && <FriendsTab />}
        {activeTab === 'events' && <EventsTab />}
        {activeTab === 'profile' && <ProfileTab />}
      </div>

    </div>

    {/* Event Detail Modal */}
    <EventDetailModal
      event={detailModalEvent}
      isOpen={!!detailModalEvent}
      onClose={() => setDetailModalEvent(null)}
      onEventUpdated={fetchAllData}
    />
    </div>
  );
};

export default ProfilePage;