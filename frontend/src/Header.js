import React from 'react';

const Header = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '70px',
      backgroundColor: 'white',
      borderBottom: '1px solid #E5E7EB',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      zIndex: 1000,
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>

      {/* Logo */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#4A90BA',
          margin: 0,
          letterSpacing: '1px',
          cursor: 'pointer'
        }}>huddll</h1>
        {/* Smile curve under just the two d's */}
        <svg style={{
          position: 'absolute',
          left: '50%',
          marginLeft: '-2px',
          bottom: '-5px',
          width: '26px',
          height: '9px'
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

      {/* Profile Icon */}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#4A90BA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '18px'
      }}>
        K
      </div>

    </div>
  );
};

export default Header;