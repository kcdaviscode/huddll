import React, { useState, useEffect } from 'react';
import { X, Users, Check } from 'lucide-react';
import theme from './theme';

const CreateHuddllModal = ({ parentEvent, onClose, onHuddllCreated }) => {
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [huddllName, setHuddllName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
    // Set default name
    setHuddllName(`${parentEvent.title} - My Group`);
  }, []);

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/users/friends/', {
        headers: { 'Authorization': `Token ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      setError('Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const toggleFriend = (friendId) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleCreateHuddll = async () => {
    if (!huddllName.trim()) {
      setError('Please enter a name for your Huddll');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/events/create-huddll/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          parent_event_id: parentEvent.id,
          title: huddllName,
          invited_friends: selectedFriends
        })
      });

      const data = await response.json();

      if (response.ok) {
        onHuddllCreated(data);
      } else {
        setError(data.error || 'Failed to create Huddll');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const FriendCard = ({ friend }) => {
    const isSelected = selectedFriends.includes(friend.id);
    const displayName = friend.first_name && friend.last_name
      ? `${friend.first_name} ${friend.last_name}`
      : friend.username;
    const avatar = friend.first_name
      ? friend.first_name[0].toUpperCase()
      : friend.username[0].toUpperCase();

    return (
      <div
        onClick={() => toggleFriend(friend.id)}
        style={{
          padding: '12px',
          background: isSelected ? `${theme.skyBlue}15` : theme.slateLight,
          border: isSelected ? `2px solid ${theme.skyBlue}` : `1px solid ${theme.border}`,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        {friend.profile_photo_url ? (
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundImage: `url(${friend.profile_photo_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            flexShrink: 0
          }} />
        ) : (
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: theme.accentGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: '700',
            color: 'white',
            flexShrink: 0
          }}>
            {avatar}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: theme.textMain,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {displayName}
          </div>
          {friend.city && (
            <div style={{
              fontSize: '12px',
              color: theme.textSecondary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {friend.city}
            </div>
          )}
        </div>

        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          border: isSelected ? 'none' : `2px solid ${theme.border}`,
          background: isSelected ? theme.skyBlue : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {isSelected && <Check size={16} color="white" />}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: theme.bgPrimary,
          borderRadius: '32px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5)`,
          border: `1px solid ${theme.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div style={{
          padding: '28px 32px 24px',
          borderBottom: `1px solid ${theme.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <h2 style={{
                margin: '0 0 8px 0',
                fontSize: '24px',
                fontWeight: '900',
                color: theme.textMain,
              }}>
                🎉 Create Your Huddll
              </h2>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: theme.textSecondary,
                lineHeight: '1.5'
              }}>
                Invite friends to join you at {parentEvent.title}
              </p>
            </div>

            <button
              onClick={onClose}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: theme.slateLight,
                border: `1px solid ${theme.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <X size={20} color={theme.textMain} />
            </button>
          </div>

          {error && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: `${theme.error}15`,
              border: `1px solid ${theme.error}40`,
              borderRadius: '12px',
              color: theme.error,
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {error}
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 32px',
        }}>
          {/* HUDDLL NAME INPUT */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '700',
              color: theme.textMain
            }}>
              Huddll Name
            </label>
            <input
              type="text"
              value={huddllName}
              onChange={(e) => setHuddllName(e.target.value)}
              placeholder="e.g., Concert Night with Friends"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: theme.slateLight,
                border: `1px solid ${theme.border}`,
                borderRadius: '12px',
                fontSize: '15px',
                color: theme.textMain,
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* INVITE FRIENDS */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '700',
                color: theme.textMain,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Users size={16} />
                Invite Friends
              </label>
              <span style={{
                fontSize: '13px',
                color: theme.textSecondary,
                fontWeight: '600'
              }}>
                {selectedFriends.length} selected
              </span>
            </div>

            {loading ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: theme.textSecondary
              }}>
                Loading friends...
              </div>
            ) : friends.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: theme.textSecondary
              }}>
                <Users size={48} color={theme.textSecondary} style={{ marginBottom: '12px' }} />
                <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>No friends yet</p>
                <p style={{ margin: 0, fontSize: '14px' }}>Add friends to invite them to your Huddlls!</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '8px',
                maxHeight: '300px',
                overflowY: 'auto',
                paddingRight: '4px'
              }}>
                {friends.map(friend => (
                  <FriendCard key={friend.id} friend={friend} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div style={{
          padding: '24px 32px',
          borderTop: `1px solid ${theme.border}`,
        }}>
          <button
            onClick={handleCreateHuddll}
            disabled={creating || !huddllName.trim()}
            style={{
              width: '100%',
              padding: '18px',
              background: creating || !huddllName.trim() ? theme.slateLight : theme.accentGradient,
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              fontSize: '16px',
              fontWeight: '800',
              cursor: creating || !huddllName.trim() ? 'not-allowed' : 'pointer',
              boxShadow: creating || !huddllName.trim() ? 'none' : `0 10px 25px -5px ${theme.skyBlue}60`,
              transition: 'transform 0.2s',
            }}
            onMouseDown={(e) => !creating && huddllName.trim() && (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={(e) => !creating && huddllName.trim() && (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => !creating && huddllName.trim() && (e.currentTarget.style.transform = 'scale(1)')}
          >
            {creating ? 'Creating Huddll...' : 'Create Huddll'}
          </button>
          <p style={{
            margin: '12px 0 0 0',
            fontSize: '12px',
            color: theme.textSecondary,
            textAlign: 'center'
          }}>
            {selectedFriends.length > 0
              ? `${selectedFriends.length} friend${selectedFriends.length === 1 ? '' : 's'} will be invited`
              : 'You can invite friends later'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateHuddllModal;