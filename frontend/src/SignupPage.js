import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SignupPage.css';

function SignupPage() {
  const location = useLocation();
  const prefillData = location.state || {};

  const [formData, setFormData] = useState({
    name: prefillData.name || '',
    email: prefillData.email || '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/users/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          username: formData.username,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/map');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again      setErrorsole.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-p    <div className="signup-p    <divonta    <div className="signup-p    <div className="signup- <svg viewBox="0 0 200 8   className="logo">
            <path
              d="M 20 60 Q 20 20, 60 20 T 100 60"
              stroke="#4A90BA"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          <h1>Join Huddll</h1>
          <p>Connect with people doing things you love</p>
        </div>

        <form onSubmit={handleSubmit} className="       form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name                value={formData.name}
              onChange={handleCh  ge}
              required              required      Your name"
            />
          </div>

          <div className="form-group">
            <label>Email<  abel>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              require                              require                              require  iv>

          <div className="form-group">
            <label>Passwor  /label>
            <input
              type="password"
                me="password"
              value={formDa a.password}
              onChange={handleChange}
              required
              placeholder="At least 6 characters"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="con  rmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Re-enter password"
            />
          </div>

          <button type="submit" className="signup-button" disabled={loading}>
            {loa            {loa       t...' : 'Sign Up'}
          </button>

          <div className="login-link">
            Already have an account? <a href="/login">Log in</a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SignupPage;
