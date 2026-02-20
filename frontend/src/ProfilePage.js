import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Edit3, Share2, MapPin, Users, Clock, Star,
  UserPlus, MessageCircle, MoreHorizontal, Heart,
  TrendingUp, Sparkles, Calendar, LogOut
} from 'lucide-react';
import theme from './theme';

const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/users/profile-stats/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await response.json();
      setProfileData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // MOCK DATA - Replace with real API calls later
  const friends = [
    { id: 1, name: 'Sarah Chen', avatar: 'S', status: 'online', mutualEvents: 8 },
    { id: 2, name: 'Mike Torres', avatar: 'M', status: 'online', mutualEvents: 5 },
    { id: 3, name: 'Emma Wilson', avatar: 'E', status: 'offline', mutualEvents: 12 },
    { id: 4, name: 'Alex Kim', avatar: 'A', status: 'online', mutualEvents: 3 },
    { id: 5, name: 'Jordan Lee', avatar: 'J', status: 'offline', mutualEvents: 7 },
    { id: 6, name: 'Taylor Swift', avatar: 'T', status: 'online', mutualEvents: 15 }
  ];

  const socialFeed = [
    {
      id: 1,
      user: { name: 'Sarah Chen', avatar: 'S' },
      event: { emoji: '🎵', name: 'Jazz Night at Blue Note', venue: 'Blue Note Jazz Club' },
      action: 'checked in',
      time: '2 hours ago',
      attendees: ['Mike Torres', 'Emma Wilson', '3 others'],
      photo: true,
      likes: 24,
      comments: 5
    },
    {
      id: 2,
      user: { name: 'Mike Torres', avatar: 'M' },
      event: { emoji: '🍔', name: 'Foodie Friday', venue: "Joe's Burgers" },
      action: 'is going to',
      time: '5 hours ago',
      attendees: ['You', 'Sarah Chen', '6 others'],
      photo: false,
      likes: 12,
      comments: 2
    }
  ];

  const friendsUpcomingEvents = [
    { emoji: '🎭', name: 'Theater Night', time: 'Tonight', friends: ['Sarah', 'Mike', '+4'] },
    { emoji: '🏃', name: 'Morning Run Club', time: 'Tomorrow', friends: ['Emma', 'Alex', '+2'] },
    { emoji: '☕', name: 'Coffee Meetup', time: 'Friday', friends: ['Jordan', 'Taylor', '+6'] }
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: theme.deepNavy, color: theme.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading Profile...
      </div>
    );
  }

  const ProfileHeader = () => (
    <>
      {/* Cover with stats overlay */}
      <div style={{ height: '180px', background: theme.gradient, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 0%, rgba(15, 23, 42, 0.9) 100%)' }} />

        <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ background: theme.slateLight, backdropFilter: 'blur(12px)', borderRadius: '12px', padding: '8px 16px', border: `1px solid ${theme.border}` }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: theme.textMain }}>{friends.length}</div>
            <div style={{ fontSize: '11px', color: theme.textSecondary, textTransform: 'uppercase' }}>Friends</div>
          </div>
          <button onClick={handleLogout} style={{ background: theme.slateLight, backdropFilter: 'blur(12px)', border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '10px', cursor: 'pointer' }}>
            <LogOut size={20} color={theme.textMain} />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Avatar & Actions */}
        <div style={{ marginTop: '-50px', marginBottom: '20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '20px', background: theme.accentGradient, border: `3px solid ${theme.deepNavy}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: '700', color: 'white', boxShadow: `0 0 0 3px ${theme.slateLight}, 0 8px 24px rgba(56, 189, 248, 0.3)` }}>
              {profileData?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '24px', height: '24px', borderRadius: '50%', background: theme.success, border: `3px solid ${theme.deepNavy}`, boxShadow: '0 0 12px rgba(20, 184, 166, 0.6)' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button style={{ background: theme.accentGradient, color: 'white', border: 'none', borderRadius: '12px', padding: '12px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Edit3 size={16} /> Edit
            </button>
            <button style={{ background: theme.slateLight, color: theme.textMain, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '12px 16px', cursor: 'pointer' }}>
              <Share2 size={16} />
            </button>
          </div>
        </div>

        {/* Name & Bio */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: theme.textMain }}>{profileData?.name}</h1>
          <p style={{ margin: '6px 0', fontSize: '15px', color: theme.textSecondary }}>
            {profileData?.status_message || `Explorer • ${profileData?.events_attended || 0} events`}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: theme.textLight, fontSize: '14px' }}>
            <MapPin size={14} /> Baltimore, MD
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { number: profileData?.events_attended || '0', label: 'Went', color: theme.skyBlue },
            { number: profileData?.huddlls_hosted || '0', label: 'Hosted', color: theme.teal },
            { number: friends.length, label: 'Friends', color: theme.indigo }
          ].map(stat => (
            <div key={stat.label} style={{ background: theme.slateLight, borderRadius: '16px', padding: '16px 12px', textAlign: 'center', border: `1px solid ${theme.border}`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: stat.color, boxShadow: `0 0 12px ${stat.color}` }} />
              <div style={{ fontSize: '28px', fontWeight: '800', color: theme.textMain }}>{stat.number}</div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const TimelineTab = () => (
    <div style={{ padding: '0 20px 20px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: theme.textMain, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkles size={18} color={theme.skyBlue} /> Friend Activity
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {socialFeed.map(post => (
          <div key={post.id} style={{ background: theme.slateLight, borderRadius: '20px', padding: '16px', border: `1px solid ${theme.border}` }}>
            {/* Post Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: theme.accentGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'white', fontSize: '16px' }}>
                {post.user.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', color: theme.textMain }}>
                  <strong>{post.user.name}</strong> <span style={{ color: theme.textSecondary }}>{post.action}</span>
                </div>
                <div style={{ fontSize: '12px', color: theme.textLight }}>{post.time}</div>
              </div>
            </div>

            {/* Event Card */}
            <div style={{ background: theme.deepNavy, borderRadius: '16px', padding: '16px', border: `1px solid ${theme.border}`, marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ fontSize: '36px' }}>{post.event.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: theme.textMain }}>{post.event.name}</div>
                  <div style={{ fontSize: '13px', color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> {post.event.venue}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: theme.textLight }}>
                <Users size={14} />
                <span>{post.attendees.join(', ')}</span>
              </div>
            </div>

            {/* Event Photo Placeholder */}
            {post.photo && (
              <div style={{ width: '100%', height: '180px', background: theme.slate, borderRadius: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${theme.border}` }}>
                <Camera size={32} color={theme.textLight} />
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingTop: '12px', borderTop: `1px solid ${theme.border}` }}>
              <button style={{ background: 'transparent', border: 'none', color: theme.textSecondary, fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <Heart size={16} /> {post.likes}
              </button>
              <button style={{ background: 'transparent', border: 'none', color: theme.textSecondary, fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <MessageCircle size={16} /> {post.comments}
              </button>
              <button style={{ background: 'transparent', border: 'none', color: theme.skyBlue, fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginLeft: 'auto' }}>
                <TrendingUp size={16} /> Join
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const FriendsTab = () => (
    <div style={{ padding: '0 20px 20px' }}>
      {/* Friends Going Tonight */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '700', color: theme.textMain, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Star size={18} color={theme.coral} /> Friends' Plans
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {friendsUpcomingEvents.map((event, i) => (
            <div key={i} style={{ background: theme.slateLight, borderRadius: '16px', padding: '14px 16px', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '32px' }}>{event.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: theme.textMain }}>{event.name}</div>
                <div style={{ fontSize: '12px', color: theme.textSecondary }}>{event.time} • {event.friends.join(', ')}</div>
              </div>
              <button style={{ background: theme.accentGradient, color: 'white', border: 'none', borderRadius: '12px', padding: '8px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(56, 189, 248, 0.2)' }}>
                Join
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* All Friends */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: theme.textMain }}>Friends ({friends.length})</h3>
          <button style={{ background: theme.slateLight, color: theme.textMain, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '8px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserPlus size={16} /> Add
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {friends.map(friend => (
            <div key={friend.id} style={{ background: theme.slateLight, borderRadius: '16px', padding: '16px', border: `1px solid ${theme.border}`, textAlign: 'center', position: 'relative' }}>
              {friend.status === 'online' && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', width: '10px', height: '10px', borderRadius: '50%', background: theme.success, boxShadow: `0 0 8px ${theme.success}` }} />
              )}

              <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: `linear-gradient(135deg, ${theme.indigo}, ${theme.lavender})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '700', color: 'white', margin: '0 auto 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                {friend.avatar}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: theme.textMain, marginBottom: '4px' }}>{friend.name}</div>
              <div style={{ fontSize: '11px', color: theme.textSecondary }}>{friend.mutualEvents} events together</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const EventsTab = () => (
    <div style={{ padding: '0 20px 20px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: theme.textMain }}>My Events</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Mock upcoming events - replace with real data */}
        {[
          { emoji: '🎵', title: 'Jazz Night', time: 'Tonight • 8PM', going: 8, color: theme.indigo },
          { emoji: '🍔', title: 'Foodie Meetup', time: 'Friday • 7PM', going: 12, color: theme.teal }
        ].map((event, i) => (
          <div key={i} style={{ background: theme.slateLight, borderRadius: '20px', padding: '20px', border: `1px solid ${theme.border}`, borderLeft: `4px solid ${event.color}`, boxShadow: `0 0 20px ${event.color}15` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '48px' }}>{event.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: theme.textMain, marginBottom: '6px' }}>{event.title}</div>
                <div style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '10px' }}>
                  <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {event.time}
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: theme.deepNavy, border: `1px solid ${event.color}`, borderRadius: '12px', padding: '6px 12px', fontSize: '13px', fontWeight: '600', color: theme.textMain }}>
                  <Users size={14} /> {event.going} going
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.deepNavy, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', paddingBottom: '80px' }}>
      <ProfileHeader />

      {/* Tabs */}
      <div style={{ position: 'sticky', top: 0, background: theme.deepNavy, borderBottom: `1px solid ${theme.border}`, zIndex: 10, marginBottom: '20px' }}>
        <div style={{ display: 'flex', padding: '0 20px' }}>
          {[
            { id: 'timeline', label: 'Timeline', icon: Sparkles },
            { id: 'friends', label: 'Friends', icon: Users },
            { id: 'events', label: 'Events', icon: Calendar }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? `3px solid ${theme.skyBlue}` : '3px solid transparent',
                  padding: '16px 8px',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: activeTab === tab.id ? theme.skyBlue : theme.textSecondary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'timeline' && <TimelineTab />}
      {activeTab === 'friends' && <FriendsTab />}
      {activeTab === 'events' && <EventsTab />}
    </div>
  );
};

export default ProfilePage;