import React, { useState, useEffect } from 'react';

const ProfilePage = ({ onLogout }) => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('vibes');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: ''
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    setFormData({
      name: userData.name || '',
      email: userData.email || '',
      bio: userData.bio || 'Here for good vibes, not small talk.'
    });
  }, []);

  const handleSave = () => {
    const updatedUser = { ...user, ...formData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setEditing(false);
  };

  if (!user) return null;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F9FAFB',
      paddingBottom: '100px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>

      {/* Header & Cover */}
      <div style={{
        position: 'relative',
        height: '192px',
        backgroundColor: '#0F172A',
        overflow: 'hidden'
      }}>
        {/* Abstract Vibe Background */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-20%',
            width: '80%',
            height: '200%',
            background: '#4A90BA',
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.3,
            animation: 'pulse 4s ease-in-out infinite'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '-20%',
            right: '-10%',
            width: '60%',
            height: '150%',
            background: '#10B981',
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.2
          }}></div>
        </div>

        {/* Settings & Share Buttons */}
        <div style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          display: 'flex',
          gap: '12px'
        }}>
          <button onClick={onLogout} style={{
            padding: '8px',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '50%',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '20px'
          }}>⚙️</button>
        </div>
      </div>

      {/* Profile Card (Floating) */}
      <div style={{ padding: '0 24px', position: 'relative', marginTop: '-64px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Avatar with Status Ring */}
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '128px',
              height: '128px',
              borderRadius: '50%',
              border: '4px solid white',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              backgroundColor: '#4A90BA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '64px',
              color: 'white',
              fontWeight: 'bold'
            }}>
              {user.username?.charAt(0).toUpperCase() || '?'}
            </div>
            {/* Verified Badge */}
            <div style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              backgroundColor: '#10B981',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '4px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px'
            }} title="Verified Human">
              ✓
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '900',
              margin: 0,
              color: '#0F172A'
            }}>{user.name || user.username}</h1>
            <p style={{
              color: '#64748B',
              fontWeight: '500',
              fontSize: '14px',
              margin: '4px 0'
            }}>📍 Baltimore, MD</p>

            {/* Bio */}
            <div style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'inline-block'
            }}>
              <p style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#334155',
                margin: 0
              }}>"{formData.bio}"</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div style={{ padding: '0 24px', marginBottom: '32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '12px',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            aspectRatio: '1'
          }}>
            <span style={{ fontSize: '24px', fontWeight: '900', color: '#4A90BA' }}>0</span>
            <span style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '700',
              color: '#94A3B8',
              marginTop: '4px'
            }}>Huddlls</span>
          </div>
          <div style={{
            backgroundColor: 'white',
            padding: '12px',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            aspectRatio: '1'
          }}>
            <span style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A' }}>0</span>
            <span style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '700',
              color: '#94A3B8',
              marginTop: '4px'
            }}>Venues</span>
          </div>
          <div style={{
            backgroundColor: 'white',
            padding: '12px',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            aspectRatio: '1'
          }}>
            <span style={{ fontSize: '24px', fontWeight: '900', color: '#10B981' }}>100%</span>
            <span style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '700',
              color: '#94A3B8',
              marginTop: '4px'
            }}>Safe</span>
          </div>
        </div>
      </div>

      {/* Toggle Tabs */}
      <div style={{ padding: '0 24px', marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          padding: '4px',
          backgroundColor: 'rgba(226, 232, 240, 0.5)',
          borderRadius: '12px'
        }}>
          <button
            onClick={() => setActiveTab('vibes')}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '14px',
              fontWeight: '700',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'vibes' ? 'white' : 'transparent',
              color: activeTab === 'vibes' ? '#0F172A' : '#94A3B8',
              boxShadow: activeTab === 'vibes' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            My Info
          </button>
          <button
            onClick={() => setActiveTab('crew')}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '14px',
              fontWeight: '700',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'crew' ? 'white' : 'transparent',
              color: activeTab === 'crew' ? '#0F172A' : '#94A3B8',
              boxShadow: activeTab === 'crew' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            The Crew
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ padding: '0 24px' }}>

        {activeTab === 'vibes' && (
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '10px',
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#94A3B8',
                margin: 0
              }}>Profile Info</h3>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#4A90BA',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Edit
                </button>
              )}
            </div>

            {editing ? (
              <div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#64748B'
                  }}>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#64748B'
                  }}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#64748B'
                  }}>Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Tell people about yourself..."
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleSave}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#4A90BA',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#E5E7EB',
                      color: '#6B7280',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#64748B',
                    marginBottom: '4px'
                  }}>Name</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A' }}>
                    {formData.name || 'Not set'}
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#64748B',
                    marginBottom: '4px'
                  }}>Email</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A' }}>
                    {formData.email}
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#64748B',
                    marginBottom: '4px'
                  }}>Username</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A' }}>
                    {user.username}
                  </div>
                </div>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={onLogout}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '16px',
                backgroundColor: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Log Out
            </button>
          </div>
        )}

        {activeTab === 'crew' && (
          <div style={{
            backgroundColor: 'white',
            padding: '40px 20px',
            borderRadius: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #E2E8F0',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <div style={{
              backgroundColor: '#F9FAFB',
              padding: '16px',
              borderRadius: '50%',
              marginBottom: '12px',
              fontSize: '32px'
            }}>
              👥
            </div>
            <p style={{ fontWeight: '700', color: '#0F172A', margin: '0 0 8px 0' }}>
              Your Crew is Growing
            </p>
            <p style={{
              fontSize: '14px',
              color: '#64748B',
              margin: 0,
              maxWidth: '200px'
            }}>
              You've connected with 0 people from past Huddlls.
            </p>
          </div>
        )}

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
      `}</style>

    </div>
  );
};

export default ProfilePage;