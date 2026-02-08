import React, { useState } from 'react';

const LoginPage = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Sending login request...');
      const response = await fetch('http://localhost:8000/api/users/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      console.log('Response status:', response.status, response.ok);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        console.log('Login successful, saving to localStorage...');
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('Calling onLoginSuccess...');
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        console.log('Login failed:', data);
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error caught:', err);
      setError('Network error. Is Django running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>

        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '700',
              color: '#4A90BA',
              margin: 0,
              letterSpacing: '2px'
            }}>huddll</h1>
            <svg style={{
              position: 'absolute',
              left: '50%',
              marginLeft: '-3px',
              bottom: '-8px',
              width: '38px',
              height: '13px'
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
          <p style={{ color: '#6B7280', marginTop: '15px' }}>
            Welcome back!
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            style={{
              width: '100%',
              padding: '15px',
              marginBottom: '15px',
              borderRadius: '10px',
              border: '1px solid #D1D5DB',
              fontSize: '16px',
              outline: 'none'
            }}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            style={{
              width: '100%',
              padding: '15px',
              marginBottom: '15px',
              borderRadius: '10px',
              border: '1px solid #D1D5DB',
              fontSize: '16px',
              outline: 'none'
            }}
            required
          />

          {error && (
            <p style={{ color: '#EF4444', fontSize: '14px', marginBottom: '10px' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: '#4A90BA',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '15px',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;