import React, { useState } from 'react';

const LandingPage = ({ onEnter, onGoToLogin }) => {
  const [formData, setFormData] = useState({ name: '', email: '', zip: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    onEnter();
  };

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      width: '100%',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>

      {/* Background with fake map pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        opacity: 0.1
      }}></div>

      {/* Floating pins animation */}
      <div style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '20%',
          fontSize: '40px',
          animation: 'float 3s ease-in-out infinite'
        }}>📍</div>
        <div style={{
          position: 'absolute',
          top: '60%',
          right: '25%',
          fontSize: '35px',
          animation: 'float 4s ease-in-out infinite'
        }}>📍</div>
        <div style={{
          position: 'absolute',
          bottom: '30%',
          left: '15%',
          fontSize: '30px',
          animation: 'float 3.5s ease-in-out infinite'
        }}>📍</div>
      </div>

      {/* Main content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px'
      }}>

        {/* Glass card */}
        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.6)'
        }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <h1 style={{
                fontSize: '64px',
                fontWeight: '700',
                color: '#4A90BA',
                margin: 0,
                letterSpacing: '2px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
              }}>huddll</h1>
              {/* Smile curve under just the two d's */}
              <svg style={{
                position: 'absolute',
                left: '50%',
                marginLeft: '-4px',
                bottom: '-10px',
                width: '50px',
                height: '17px'
              }} viewBox="0 0 50 16">
                <path
                  d="M 2 2 Q 25 20 48 2"
                  fill="none"
                  stroke="#4A90BA"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1F2937',
            textAlign: 'center',
            marginBottom: '12px'
          }}>
            See what's happening nearby.
          </h2>

          <p style={{
            color: '#6B7280',
            textAlign: 'center',
            marginBottom: '32px',
            fontSize: '15px'
          }}>
            There are <strong style={{ color: '#4A90BA' }}>5 events</strong> happening in Baltimore today.
            Enter your info to unlock the map.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <input
              type="text"
              placeholder="First Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              required
            />

            <input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
                fontSize: '16px',
                outline: 'none'
              }}
              required
            />

            <input
              type="text"
              placeholder="Zip Code"
              value={formData.zip}
              onChange={(e) => setFormData({...formData, zip: e.target.value})}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
                fontSize: '16px',
                outline: 'none'
              }}
              required
            />

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#4A90BA',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '8px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#3A7A9A'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#4A90BA'}
            >
              Join the Huddll
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#9CA3AF',
            marginTop: '24px'
          }}>
            By joining, you agree to our Terms.<br/>
            Currently live in <strong>Baltimore, MD</strong>.
          </p>

          <p style={{
            textAlign: 'center',
            fontSize: '14px',
            marginTop: '16px'
          }}>
            Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); if (onGoToLogin) onGoToLogin(); }} style={{ color: '#4A90BA', fontWeight: 'bold', textDecoration: 'none' }}>Log in</a>
          </p>

        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;