import React, { useState, useRef, useEffect } from 'react';

const CreateEventModal = ({ isOpen, onClose, onCreateEvent }) => {
  const [formData, setFormData] = useState({
    title: '',
    venue: '',
    category: 'social',
    subcategory: '',
    time: '',
    description: '',
    lat: 39.2904,
    lng: -76.6122
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const venueInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const categories = [
    { id: 'food', label: 'Food & Drink', emoji: '🍔' },
    { id: 'sports', label: 'Sports', emoji: '⚽' },
    { id: 'nightlife', label: 'Nightlife', emoji: '🎉' },
    { id: 'arts', label: 'Arts', emoji: '🎨' },
    { id: 'music', label: 'Music', emoji: '🎵' },
    { id: 'social', label: 'Social', emoji: '👥' }
  ];

  const subcategories = {
    sports: [
      { id: 'basketball', label: 'Basketball' },
      { id: 'soccer', label: 'Soccer/Football' },
      { id: 'golf', label: 'Golf' },
      { id: 'tennis', label: 'Tennis/Racquet Sports' },
      { id: 'running', label: 'Running/Jogging' },
      { id: 'cycling', label: 'Cycling' },
      { id: 'hiking', label: 'Hiking' },
      { id: 'gym', label: 'Gym/Weightlifting' },
      { id: 'yoga', label: 'Yoga/Pilates' },
      { id: 'swimming', label: 'Swimming' },
      { id: 'pickup_games', label: 'Pickup Games' }
    ],
    food: [
      { id: 'coffee', label: 'Coffee' },
      { id: 'brunch', label: 'Brunch' },
      { id: 'dinner', label: 'Dinner' },
      { id: 'happy_hour', label: 'Happy Hour' },
      { id: 'food_tour', label: 'Food Tour' },
      { id: 'cooking', label: 'Cooking Together' }
    ],
    nightlife: [
      { id: 'bar_hopping', label: 'Bar Hopping' },
      { id: 'club', label: 'Club/Dancing' },
      { id: 'live_music', label: 'Live Music Venue' },
      { id: 'karaoke', label: 'Karaoke' },
      { id: 'trivia', label: 'Trivia Night' }
    ],
    arts: [
      { id: 'museums', label: 'Museums' },
      { id: 'gallery', label: 'Gallery Opening' },
      { id: 'theater', label: 'Theater/Performance' },
      { id: 'art_class', label: 'Art Class/Workshop' },
      { id: 'photo_walk', label: 'Photography Walk' }
    ],
    music: [
      { id: 'concert', label: 'Concert' },
      { id: 'open_mic', label: 'Open Mic' },
      { id: 'jam_session', label: 'Jam Session' },
      { id: 'music_festival', label: 'Music Festival' },
      { id: 'dj_night', label: 'DJ Night' }
    ],
    social: [
      { id: 'game_night', label: 'Game Night' },
      { id: 'book_club', label: 'Book Club' },
      { id: 'study', label: 'Study Session' },
      { id: 'coworking', label: 'Coworking' },
      { id: 'networking', label: 'Networking' },
      { id: 'hangout', label: 'Just Hangout' }
    ]
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .pac-container {
        z-index: 10000 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        border: none;
        margin-top: 8px;
      }
      .pac-item {
        padding: 12px;
        font-size: 14px;
        cursor: pointer;
      }
      .pac-item:hover {
        background-color: #F1F5F9;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  useEffect(() => {
    if (!isOpen || !venueInputRef.current) return;
    const initAutocomplete = () => {
      if (window.google?.maps?.places?.Autocomplete) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          venueInputRef.current,
          { types: ['establishment'], fields: ['name', 'geometry', 'formatted_address', 'place_id'] }
        );
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (place.geometry?.location) {
            setFormData(prev => ({
              ...prev,
              venue: place.name || '',
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            }));
          }
        });
      } else {
        setTimeout(initAutocomplete, 200);
      }
    };
    const timer = setTimeout(initAutocomplete, 500);
    return () => {
      clearTimeout(timer);
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !formData.time) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      const formattedDate = tomorrow.toISOString().slice(0, 16);
      setFormData(prev => ({ ...prev, time: formattedDate }));
    }
  }, [isOpen, formData.time]);

  const handleCategoryChange = (categoryId) => {
    setFormData({
      ...formData,
      category: categoryId,
      subcategory: '' // Reset subcategory when category changes
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/users/events/create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        onCreateEvent(data);
        setFormData({ title: '', venue: '', category: 'social', subcategory: '', time: '', description: '', lat: 39.2904, lng: -76.6122 });
        onClose();
      } else {
        setError(data.error || 'Failed to create event');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const colors = {
    overlay: 'rgba(15, 23, 42, 0.6)',
    bg: '#FFFFFF',
    headerBg: '#0F172A',
    brandBlue: '#4A90BA',
    inputBg: '#F8FAFC',
    textMain: '#0F172A',
    textMuted: '#64748B',
    border: '#E2E8F0'
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: colors.overlay, backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: '20px'
    }} onClick={onClose}>

      <div style={{
        backgroundColor: colors.bg, borderRadius: '32px',
        maxWidth: '500px', width: '100%',
        maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative'
      }} onClick={(e) => e.stopPropagation()}>

        <div style={{
          background: colors.headerBg,
          padding: '32px 24px',
          color: 'white',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '24px', right: '24px',
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
              width: '36px', height: '36px', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '24px'
            }}
          >×</button>

          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px' }}>
            Start a Huddll
          </h2>
          <p style={{ margin: '8px 0 0 0', opacity: 0.7, fontSize: '15px', fontWeight: '500' }}>
            Where is the crew meeting?
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '32px 24px' }}>

          {error && (
            <div style={{
              backgroundColor: '#FEF2F2', color: '#991B1B',
              padding: '16px', borderRadius: '16px',
              fontSize: '14px', fontWeight: '600', marginBottom: '24px'
            }}>⚠️ {error}</div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block', marginBottom: '8px',
              fontSize: '13px', fontWeight: '800', color: colors.textMain,
              textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>What's the plan?</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g. Pool at the Dive Bar"
              required
              style={{
                width: '100%', padding: '16px',
                backgroundColor: colors.inputBg, border: 'none', borderRadius: '16px',
                fontSize: '16px', fontWeight: '600', color: colors.textMain, outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block', marginBottom: '8px',
              fontSize: '13px', fontWeight: '800', color: colors.textMain,
              textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              Location <span style={{ color: colors.brandBlue, fontWeight: '500', textTransform: 'none' }}>(Verified Venues Only)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, fontSize: '18px' }}>📍</div>
              <input
                ref={venueInputRef}
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({...formData, venue: e.target.value})}
                placeholder="Search Google Maps..."
                required
                autoComplete="off"
                style={{
                  width: '100%', padding: '16px 16px 16px 48px',
                  backgroundColor: colors.inputBg, border: 'none', borderRadius: '16px',
                  fontSize: '16px', fontWeight: '600', color: colors.textMain, outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block', marginBottom: '12px',
              fontSize: '13px', fontWeight: '800', color: colors.textMain,
              textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>Vibe</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  style={{
                    padding: '10px 16px', border: 'none', borderRadius: '50px',
                    backgroundColor: formData.category === cat.id ? colors.brandBlue : colors.inputBg,
                    cursor: 'pointer', fontSize: '14px', fontWeight: '700',
                    color: formData.category === cat.id ? 'white' : colors.textMuted,
                    transition: 'all 0.2s ease',
                    boxShadow: formData.category === cat.id ? '0 4px 12px rgba(74, 144, 186, 0.3)' : 'none'
                  }}
                >
                  <span style={{ marginRight: '6px' }}>{cat.emoji}</span> {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subcategory Dropdown */}
          {subcategories[formData.category] && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block', marginBottom: '8px',
                fontSize: '13px', fontWeight: '800', color: colors.textMain,
                textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>Specific Activity</label>
              <select
                value={formData.subcategory}
                onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
                style={{
                  width: '100%', padding: '16px',
                  backgroundColor: colors.inputBg, border: 'none', borderRadius: '16px',
                  fontSize: '16px', fontWeight: '600', color: colors.textMain, outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">Select activity (optional)</option>
                {subcategories[formData.category].map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.label}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block', marginBottom: '8px',
              fontSize: '13px', fontWeight: '800', color: colors.textMain,
              textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>When?</label>
            <input
              type="datetime-local"
              value={formData.time}
              onChange={(e) => setFormData({...formData, time: e.target.value})}
              required
              style={{
                width: '100%', padding: '16px',
                backgroundColor: colors.inputBg, border: 'none', borderRadius: '16px',
                fontSize: '16px', fontWeight: '600', color: colors.textMain,
                outline: 'none', fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block', marginBottom: '8px',
              fontSize: '13px', fontWeight: '800', color: colors.textMain,
              textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>Details</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '16px', color: colors.textMuted, fontSize: '18px' }}>📝</div>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Where inside? How do we find you?"
                style={{
                  width: '100%', padding: '16px 16px 16px 48px',
                  backgroundColor: colors.inputBg, border: 'none', borderRadius: '16px',
                  fontSize: '16px', fontWeight: '500', color: colors.textMain,
                  outline: 'none', minHeight: '100px', resize: 'vertical'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '18px',
              backgroundColor: loading ? colors.textMuted : colors.brandBlue,
              color: 'white', border: 'none', borderRadius: '20px',
              fontSize: '18px', fontWeight: '800',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 20px -4px rgba(74, 144, 186, 0.4)',
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Creating...' : 'Create Huddll'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default CreateEventModal;