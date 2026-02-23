import React, { useState, useRef } from 'react';
import { X, Upload, Plus, Camera } from 'lucide-react';
import theme from './theme';

const EditProfileModal = ({ isOpen, onClose, profileData, onSave }) => {
  const [formData, setFormData] = useState({
    first_name: profileData?.first_name || '',
    last_name: profileData?.last_name || '',
    bio: profileData?.bio || '',
    city: profileData?.city || '',
    interests: profileData?.interests || [],
    profile_privacy: profileData?.profile_privacy || 'events'
  });

  const [photoPreview, setPhotoPreview] = useState(profileData?.profile_photo_url || null);
  const [photoFile, setPhotoFile] = useState(null);
  const [newInterest, setNewInterest] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const popularInterests = [
    'Live Music', 'Food & Dining', 'Sports', 'Hiking', 'Coffee',
    'Photography', 'Art', 'Gaming', 'Fitness', 'Reading',
    'Travel', 'Cooking', 'Dancing', 'Movies', 'Yoga'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addInterest = (interest) => {
    if (!formData.interests.includes(interest)) {
      setFormData({
        ...formData,
        interests: [...formData.interests, interest]
      });
    }
    setNewInterest('');
  };

  const removeInterest = (interest) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter(i => i !== interest)
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setSaving(true);

  try {
    const token = localStorage.getItem('token');
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

    // If there's a photo, use FormData, otherwise use JSON
    if (photoFile) {
      const formDataToSend = new FormData();
      formDataToSend.append('first_name', formData.first_name);
      formDataToSend.append('last_name', formData.last_name);
      formDataToSend.append('bio', formData.bio);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('profile_privacy', formData.profile_privacy);

      // Send each interest separately
      formData.interests.forEach(interest => {
        formDataToSend.append('interests', interest);
      });

      formDataToSend.append('profile_photo', photoFile);

      const response = await fetch(`${baseUrl}/api/users/profile/update/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        onSave(updatedProfile);
        onClose();
      }
    } else {
      // No photo - use JSON
      const response = await fetch(`${baseUrl}/api/users/profile/update/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          bio: formData.bio,
          city: formData.city,
          profile_privacy: formData.profile_privacy,
          interests: formData.interests
        })
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        onSave(updatedProfile);
        onClose();
      }
    }
  } catch (error) {
    console.error('Error updating profile:', error);
  } finally {
    setSaving(false);
  }
};

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        background: theme.slateLight,
        borderRadius: '24px',
        border: `1px solid ${theme.border}`,
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
        zIndex: 1001,
        animation: 'slideUp 0.3s ease-out',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>

        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: theme.textMain }}>
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            style={{
              background: theme.slate,
              border: 'none',
              borderRadius: '12px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = theme.deepNavy}
            onMouseLeave={(e) => e.currentTarget.style.background = theme.slate}
          >
            <X size={20} color={theme.textMain} />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

          {/* Profile Photo */}
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '20px',
                background: photoPreview
                  ? `url(${photoPreview}) center/cover`
                  : theme.accentGradient,
                border: `3px solid ${theme.border}`,
                boxShadow: `0 8px 24px ${theme.skyBlue}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                fontWeight: '700',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {!photoPreview && (formData.first_name ? formData.first_name.charAt(0).toUpperCase() : '?')}

                {/* Upload Overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  cursor: 'pointer'
                }}
                className="photo-overlay"
                onClick={() => fileInputRef.current?.click()}>
                  <Camera size={32} color="white" />
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                marginTop: '12px',
                background: theme.slate,
                border: `1px solid ${theme.border}`,
                borderRadius: '12px',
                padding: '8px 16px',
                color: theme.skyBlue,
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Upload size={16} />
              {photoPreview ? 'Change Photo' : 'Upload Photo'}
            </button>
          </div>

          {/* Name Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase' }}>
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Your first name"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: `1px solid ${theme.border}`,
                  background: theme.deepNavy,
                  color: theme.textMain,
                  fontSize: '15px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase' }}>
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Your last name"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: `1px solid ${theme.border}`,
                  background: theme.deepNavy,
                  color: theme.textMain,
                  fontSize: '15px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* City */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase' }}>
              City
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Baltimore, MD"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: `1px solid ${theme.border}`,
                background: theme.deepNavy,
                color: theme.textMain,
                fontSize: '15px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Bio */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase' }}>
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell others about yourself..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: `1px solid ${theme.border}`,
                background: theme.deepNavy,
                color: theme.textMain,
                fontSize: '15px',
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Interests */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase' }}>
              Interests
            </label>

            {/* Current Interests */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {formData.interests.map(interest => (
                <div key={interest} style={{
                  background: theme.slate,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '20px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  color: theme.textMain
                }}>
                  {interest}
                  <button
                    type="button"
                    onClick={() => removeInterest(interest)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: theme.textLight,
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Interest */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newInterest.trim()) addInterest(newInterest.trim());
                  }
                }}
                placeholder="Add an interest..."
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: `1px solid ${theme.border}`,
                  background: theme.deepNavy,
                  color: theme.textMain,
                  fontSize: '14px'
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (newInterest.trim()) addInterest(newInterest.trim());
                }}
                style={{
                  background: theme.skyBlue,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: '600'
                }}
              >
                <Plus size={16} /> Add
              </button>
            </div>

            {/* Popular Interests */}
            <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '8px' }}>Popular:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {popularInterests
                .filter(i => !formData.interests.includes(i))
                .slice(0, 10)
                .map(interest => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => addInterest(interest)}
                    style={{
                      background: theme.deepNavy,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '16px',
                      padding: '6px 12px',
                      fontSize: '13px',
                      color: theme.textSecondary,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = theme.skyBlue;
                      e.currentTarget.style.color = theme.skyBlue;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = theme.border;
                      e.currentTarget.style.color = theme.textSecondary;
                    }}
                  >
                    + {interest}
                  </button>
                ))}
            </div>
          </div>

          {/* Privacy Settings */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase' }}>
              Profile Privacy
            </label>
            <select
              name="profile_privacy"
              value={formData.profile_privacy}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: `1px solid ${theme.border}`,
                background: theme.deepNavy,
                color: theme.textMain,
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              <option value="public">Public - Visible to all</option>
              <option value="events">Event Attendees - Visible to people at same events</option>
              <option value="connections">Connections Only - Only visible to friends</option>
            </select>
          </div>

        </form>

        {/* Footer */}
        <div style={{
          padding: '20px 24px',
          borderTop: `1px solid ${theme.border}`,
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: theme.slate,
              border: `1px solid ${theme.border}`,
              borderRadius: '12px',
              padding: '12px 24px',
              color: theme.textMain,
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              background: saving ? theme.slate : theme.accentGradient,
              border: 'none',
              borderRadius: '12px',
              padding: '12px 32px',
              color: 'white',
              fontSize: '15px',
              fontWeight: '700',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : `0 4px 16px ${theme.skyBlue}40`,
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translate(-50%, -45%); opacity: 0; }
          to { transform: translate(-50%, -50%); opacity: 1; }
        }
        .photo-overlay:hover {
          opacity: 1 !important;
        }
      `}</style>
    </>
  );
};

export default EditProfileModal;