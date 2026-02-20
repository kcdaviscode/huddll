import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Plus, Navigation as NavIcon } from 'lucide-react';
import theme from './theme';

function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/users/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/map');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mock events to display
  const mockEvents = [
    { emoji: '🍔', title: 'Foodie Meetup', venue: "Joe's Burgers", going: 12, left: '15%', top: '20%' },
    { emoji: '🎵', title: 'Jazz Night', venue: 'Blue Note', going: 8, left: '65%', top: '35%' },
    { emoji: '⚽', title: 'Soccer Game', venue: 'Harbor Field', going: 15, left: '40%', top: '55%' },
    { emoji: '🎨', title: 'Art Gallery', venue: 'MICA', going: 6, left: '75%', top: '65%' },
    { emoji: '🎉', title: 'Rooftop Party', venue: 'The Crown', going: 20, left: '25%', top: '70%' }
  ];

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      width: '100%',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: theme.deepNavy
    }}>

      {/* ACTUAL MAP VIEW BACKGROUND - Slightly Blurred */}
      <div style={{
        position: 'absolute',
        inset: 0,
        filter: 'blur(0.5px) brightness(0.85)',
        opacity: 1
      }}>
        {/* Fake map (gray with subtle details) */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: '#2D3748'
        }}>
          {/* Map roads/streets */}
          <svg style={{ width: '100%', height: '100%', position: 'absolute' }}>
            {/* Horizontal streets */}
            <line x1="0" y1="20%" x2="100%" y2="20%" stroke="#4A5568" strokeWidth="3" />
            <line x1="0" y1="40%" x2="100%" y2="40%" stroke="#4A5568" strokeWidth="2" />
            <line x1="0" y1="60%" x2="100%" y2="60%" stroke="#4A5568" strokeWidth="3" />
            <line x1="0" y1="80%" x2="100%" y2="80%" stroke="#4A5568" strokeWidth="2" />

            {/* Vertical streets */}
            <line x1="20%" y1="0" x2="20%" y2="100%" stroke="#4A5568" strokeWidth="2" />
            <line x1="40%" y1="0" x2="40%" y2="100%" stroke="#4A5568" strokeWidth="3" />
            <line x1="60%" y1="0" x2="60%" y2="100%" stroke="#4A5568" strokeWidth="2" />
            <line x1="80%" y1="0" x2="80%" y2="100%" stroke="#4A5568" strokeWidth="3" />
          </svg>

          {/* Water area (harbor) */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '40%',
            height: '35%',
            background: '#1A365D',
            opacity: 0.6
          }} />

          {/* Park area */}
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '5%',
            width: '25%',
            height: '30%',
            background: '#2F855A',
            opacity: 0.4,
            borderRadius: '20px'
          }} />
        </div>

        {/* Event Pins/Cards on Map */}
        {mockEvents.map((event, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: event.left,
              top: event.top,
              background: theme.slateLight,
              borderRadius: '16px',
              padding: '12px',
              border: `1px solid ${theme.border}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              minWidth: '140px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ fontSize: '24px' }}>{event.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: theme.textMain }}>{event.title}</div>
                <div style={{ fontSize: '11px', color: theme.textSecondary }}>{event.venue}</div>
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: theme.skyBlue
            }}>
              <Users size={12} />
              {event.going} going
            </div>
          </div>
        ))}

        {/* Bottom Navigation Buttons */}
        <div style={{
          position: 'absolute',
          bottom: '120px',
          left: '24px',
          background: theme.slateLight,
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${theme.border}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <NavIcon size={24} color={theme.skyBlue} />
        </div>

        <div style={{
          position: 'absolute',
          bottom: '120px',
          right: '24px',
          background: theme.accentGradient,
          borderRadius: '50px',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: `0 8px 24px ${theme.skyBlue}40`
        }}>
          <Plus size={24} color="white" strokeWidth={3} />
          <span style={{ color: 'white', fontWeight: '700', fontSize: '16px' }}>New Huddll</span>
        </div>

        {/* Bottom Nav Bar */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '80px',
          background: theme.slate,
          borderTop: `1px solid ${theme.border}`,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center'
        }}>
          <div style={{ textAlign: 'center', color: theme.skyBlue }}>
            <div style={{ fontSize: '24px' }}>📍</div>
            <div style={{ fontSize: '12px', fontWeight: '700', marginTop: '4px' }}>Events</div>
          </div>
          <div style={{ textAlign: 'center', color: theme.textSecondary }}>
            <div style={{ fontSize: '24px' }}>👥</div>
            <div style={{ fontSize: '12px', fontWeight: '600', marginTop: '4px' }}>My Huddlls</div>
          </div>
          <div style={{ textAlign: 'center', color: theme.textSecondary }}>
            <div style={{ fontSize: '24px' }}>👤</div>
            <div style={{ fontSize: '12px', fontWeight: '600', marginTop: '4px' }}>Profile</div>
          </div>
        </div>
      </div>

      {/* Dark Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(0px)'
      }} />

      {/* Login Card */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          background: theme.slateLight,
          borderRadius: '24px',
          padding: '48px 40px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
          border: `1px solid ${theme.border}`
        }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <h1 style={{
                fontSize: '56px',
                fontWeight: '700',
                color: theme.skyBlue,
                margin: 0,
                letterSpacing: '1px'
              }}>huddll</h1>
              <svg style={{
                position: 'absolute',
                left: '50%',
                marginLeft: '-3px',
                bottom: '-8px',
                width: '44px',
                height: '14px'
              }} viewBox="0 0 50 16">
                <path
                  d="M 2 2 Q 25 20 48 2"
                  fill="none"
                  stroke={theme.skyBlue}
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          <h2 style={{
            fontSize: '24px',
            fontWeight: '800',
            color: theme.textMain,
            textAlign: 'center',
            marginBottom: '8px'
          }}>
            Welcome Back
          </h2>

          <p style={{
            color: theme.textSecondary,
            textAlign: 'center',
            marginBottom: '32px',
            fontSize: '15px'
          }}>
            Log in to see what's happening nearby
          </p>

          {error && (
            <div style={{
              background: `${theme.error}20`,
              border: `1px solid ${theme.error}`,
              color: theme.error,
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: '700',
                color: theme.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Enter your username"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: `1px solid ${theme.border}`,
                  background: theme.deepNavy,
                  color: theme.textMain,
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: '700',
                color: theme.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: `1px solid ${theme.border}`,
                  background: theme.deepNavy,
                  color: theme.textMain,
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading ? theme.slate : theme.accentGradient,
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: '800',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                boxShadow: loading ? 'none' : `0 8px 24px ${theme.skyBlue}40`,
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            fontSize: '14px',
            marginTop: '24px',
            color: theme.textSecondary
          }}>
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              style={{
                background: 'none',
                border: 'none',
                color: theme.skyBlue,
                textDecoration: 'none',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '14px',
                padding: 0
              }}
            >
              Sign up
            </button>
          </p>

        </div>
      </div>

      <style>{`
        input::placeholder {
          color: ${theme.textLight};
        }
      `}</style>
    </div>
  );
}

export default LoginPage;