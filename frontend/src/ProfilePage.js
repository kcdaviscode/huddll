import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Award, Grid, Edit2, Camera, MapPin, Check } from 'lucide-react';

const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState('stamps');
  const [editingStatus, setEditingStatus] = useState(false);
  const [statusInput, setStatusInput] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  navigate('/login');
};

  const theme = {
    bg: '#121212',
    cardBg: '#1E1E1E',
    headerBg: '#1E1E1E',
    accent: '#4A90E2',
    accentGlow: 'rgba(74, 144, 226, 0.3)',
    success: '#34D399',
    successGlow: 'rgba(52, 211, 153, 0.15)',
    textMain: '#FFFFFF',
    textSecondary: '#B0B3B8',
    divider: '#2F3336',
    inputBg: '#2C2C2C'
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/users/profile-stats/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await response.json();
      setProfileData(data);
      setStatusInput(data.status_message || "Up for anything!");
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:8000/api/users/update-status/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status_message: statusInput })
      });
      setProfileData({ ...profileData, status_message: statusInput });
      setEditingStatus(false);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textSecondary }}>
        Loading Profile...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.textMain, paddingBottom: '80px', fontFamily: '-apple-system, sans-serif' }}>

      {/* HEADER */}
      <div style={{ padding: '30px 20px 20px', textAlign: 'center', borderBottom: `1px solid ${theme.divider}`, position: 'relative' }}>

        {/* Settings & Logout Icons */}
<div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '15px' }}>
  <div style={{ cursor: 'pointer' }}>
    <Settings size={20} color={theme.textSecondary} />
  </div>
  <div
    onClick={handleLogout}
    style={{
      cursor: 'pointer',
      padding: '8px 16px',
      backgroundColor: theme.cardBg,
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '600',
      color: theme.textSecondary,
      border: `1px solid ${theme.divider}`,
      transition: 'all 0.2s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = theme.divider;
      e.currentTarget.style.color = theme.textMain;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = theme.cardBg;
      e.currentTarget.style.color = theme.textSecondary;
    }}
  >
    Logout
  </div>
</div>

        {/* Avatar */}
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          backgroundColor: theme.accent,
          margin: '0 auto 15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px',
          fontWeight: '700',
          boxShadow: `0 0 25px ${theme.accentGlow}`
        }}>
          {profileData?.name?.charAt(0).toUpperCase() || 'U'}
        </div>

        {/* Name */}
        <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 10px' }}>
          {profileData?.name || profileData?.username}
        </h2>

        {/* Status */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '25px' }}>
            {editingStatus ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: theme.inputBg, padding: '4px 8px', borderRadius: '20px' }}>
                <input
                  type="text"
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleStatusUpdate()}
                  style={{ backgroundColor: 'transparent', border: 'none', color: 'white', fontSize: '14px', outline: 'none', width: '160px', textAlign: 'center' }}
                  placeholder="Set your vibe..."
                  autoFocus
                />
                <button onClick={handleStatusUpdate} style={{ background: theme.success, border: 'none', padding: '4px', borderRadius: '50%', color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => setEditingStatus(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 20px',
                  borderRadius: '30px',
                  backgroundColor: theme.successGlow,
                  border: `1px solid ${theme.success}`,
                  color: theme.success,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ⚡ {profileData?.status_message || "Set your status"}
                <Edit2 size={12} style={{ opacity: 0.6 }} />
              </div>
            )}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '800' }}>{profileData?.events_attended || 0}</div>
                <div style={{ fontSize: '12px', color: theme.textSecondary, fontWeight: '500' }}>Events</div>
            </div>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '800' }}>{profileData?.events_hosted || 0}</div>
                <div style={{ fontSize: '12px', color: theme.textSecondary, fontWeight: '500' }}>Hosted</div>
            </div>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '800' }}>{profileData?.connections || 0}</div>
                <div style={{ fontSize: '12px', color: theme.textSecondary, fontWeight: '500' }}>Friends</div>
            </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${theme.divider}`, backgroundColor: theme.cardBg }}>
        <button
          onClick={() => setActiveTab('stamps')}
          style={{
            flex: 1,
            padding: '16px',
            background: 'transparent',
            border: 'none',
            color: activeTab === 'stamps' ? theme.accent : theme.textSecondary,
            borderBottom: activeTab === 'stamps' ? `2px solid ${theme.accent}` : 'none',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            alignItems: 'center',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          <Award size={18} /> Stamps
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          style={{
            flex: 1,
            padding: '16px',
            background: 'transparent',
            border: 'none',
            color: activeTab === 'gallery' ? theme.accent : theme.textSecondary,
            borderBottom: activeTab === 'gallery' ? `2px solid ${theme.accent}` : 'none',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            alignItems: 'center',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          <Grid size={18} /> Gallery
        </button>
      </div>

      {/* CONTENT */}
      <div style={{ padding: '20px' }}>

        {activeTab === 'stamps' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
             {/* Achievement Stamps */}
             <div style={{ backgroundColor: theme.cardBg, padding: '20px', borderRadius: '16px', textAlign: 'center', border: `1px solid ${theme.divider}` }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>👋</div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: theme.textMain }}>Newcomer</div>
                <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '4px' }}>Joined Huddll</div>
             </div>

             <div style={{ backgroundColor: theme.cardBg, padding: '20px', borderRadius: '16px', textAlign: 'center', border: `1px solid ${theme.divider}`, opacity: profileData?.events_attended > 0 ? 1 : 0.4 }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📍</div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: theme.textMain }}>First Check-in</div>
                <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '4px' }}>Attend 1 Event</div>
             </div>

             <div style={{ backgroundColor: theme.cardBg, padding: '20px', borderRadius: '16px', textAlign: 'center', border: `1px solid ${theme.divider}`, opacity: profileData?.events_hosted > 0 ? 1 : 0.4 }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🥂</div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: theme.textMain }}>The Host</div>
                <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '4px' }}>Host 1 Event</div>
             </div>

             <div style={{ backgroundColor: theme.cardBg, padding: '20px', borderRadius: '16px', textAlign: 'center', border: `1px dashed ${theme.divider}`, opacity: 0.3 }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔒</div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: theme.textMain }}>Regular</div>
                <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '4px' }}>Visit same spot 3x</div>
             </div>

             <div style={{ backgroundColor: theme.cardBg, padding: '20px', borderRadius: '16px', textAlign: 'center', border: `1px dashed ${theme.divider}`, opacity: 0.3 }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔒</div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: theme.textMain }}>Social Butterfly</div>
                <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '4px' }}>Make 10 Friends</div>
             </div>

             <div style={{ backgroundColor: theme.cardBg, padding: '20px', borderRadius: '16px', textAlign: 'center', border: `1px dashed ${theme.divider}`, opacity: 0.3 }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔒</div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: theme.textMain }}>Explorer</div>
                <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '4px' }}>Visit 10 Venues</div>
             </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginBottom: '20px' }}>
               <div style={{ aspectRatio: '1/1', backgroundColor: theme.cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', flexDirection: 'column', gap: '8px' }}>
                  <Camera size={24} color={theme.divider} />
                  <div style={{ fontSize: '11px', color: theme.textSecondary }}>Coming Soon</div>
               </div>
               {[1,2,3,4,5].map(i => (
                  <div key={i} style={{ aspectRatio: '1/1', backgroundColor: '#181818', borderRadius: '8px' }} />
               ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: '13px', color: theme.textSecondary }}>
              Photo gallery coming soon - share memories from your events!
            </p>
          </div>
        )}

        {/* Location */}
        <div style={{ marginTop: '30px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: 0.5 }}>
           <MapPin size={14} color={theme.textSecondary} />
           <span style={{ fontSize: '13px', color: theme.textSecondary }}>
             {profileData?.city && profileData.city !== 'Not set' ? profileData.city : 'Location not set'}
           </span>
        </div>

      </div>

    </div>
  );
};

export default ProfilePage;