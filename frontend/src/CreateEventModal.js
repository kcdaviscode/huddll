import React, { useState, useRef, useEffect } from 'react';

const CreateEventModal = ({ isOpen, onClose, onCreateEvent }) => {
  const [formData, setFormData] = useState({
    title: '',
    venue: '',
    category: 'social',
    subcategory: '',
    time: '',
    duration: 2,
    min_attendees: 3,
    max_attendees: null,
    description: '',
    lat: 39.2904,
    lng: -76.6122
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const venueInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const calculateEndTime = (startTime, durationHours) => {
    if (!startTime) return '';
    const start = new Date(startTime);
    const end = new Date(start.getTime() + (durationHours * 60 * 60 * 1000));
    return end.toISOString().slice(0, 16);
  };

  const getDefaultAttendees = (category, subcategory) => {
    // Subcategory-specific defaults (override category defaults)
    const subcategoryDefaults = {
      // Sports subcategories
      golf: { min: 2, max: 4 },
      basketball: { min: 8, max: 10 },
      soccer: { min: 10, max: 22 },
      tennis: { min: 2, max: 4 },
      running: { min: 2, max: null },
      cycling: { min: 2, max: null },
      hiking: { min: 3, max: null },
      gym: { min: 2, max: null },
      yoga: { min: 3, max: 15 },
      swimming: { min: 2, max: null },
      pickup_games: { min: 6, max: 20 },

      // Food subcategories
      coffee: { min: 2, max: 4 },
      brunch: { min: 3, max: 8 },
      dinner: { min: 3, max: 8 },
      happy_hour: { min: 3, max: null },

      // Nightlife
      bar_hopping: { min: 3, max: null },
      club: { min: 4, max: null },
      karaoke: { min: 3, max: 10 },
      trivia: { min: 3, max: 6 },

      // Social
      game_night: { min: 3, max: 8 },
      book_club: { min: 4, max: 12 },
    };

    // Check for subcategory-specific defaults first
    if (subcategory && subcategoryDefaults[subcategory]) {
      return subcategoryDefaults[subcategory];
    }

    // Fall back to category defaults
    const categoryDefaults = {
      sports: { min: 6, max: 10 },
      food: { min: 3, max: 8 },
      nightlife: { min: 3, max: null },
      music: { min: 2, max: null },
      arts: { min: 3, max: 12 },
      social: { min: 3, max: null }
    };

    return categoryDefaults[category] || { min: 3, max: null };
  };

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
    const defaults = getDefaultAttendees(categoryId, null);
    setFormData({
      ...formData,
      category: categoryId,
      subcategory: '',
      min_attendees: defaults.min,
      max_attendees: defaults.max
    });
  };

  const handleSubcategoryChange = (subcategoryId) => {
    const defaults = getDefaultAttendees(formData.category, subcategoryId);
    setFormData({
      ...formData,
      subcategory: subcategoryId,
      min_attendees: defaults.min,
      max_attendees: defaults.max
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      const apiData = {
        title: formData.title,
        venue_name: formData.venue,
        address: formData.venue,
        city: formData.city || 'Baltimore',
        category: formData.category,
        subcategory: formData.subcategory || '',
        description: formData.description || '',
        latitude: parseFloat(formData.lat).toFixed(6),
        longitude: parseFloat(formData.lng).toFixed(6),
        start_time: formData.time,
        end_time: calculateEndTime(formData.time, formData.duration),
        min_attendees: formData.min_attendees,
        max_attendees: formData.max_attendees
      };

      console.log('Sending data:', apiData);

      const response = await fetch('http://localhost:8000/api/events/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify(apiData)
      });

      const data = await response.json();
      console.log('Response:', data);

      if (response.ok) {
        onCreateEvent(data);
        setFormData({
          title: '',
          venue: '',
          category: 'social',
          subcategory: '',
          time: '',
          duration: 2,
          min_attendees: 3,
          max_attendees: null,
          description: '',
          lat: 39.2904,
          lng: -76.6122
        });
        onClose();
      } else {
        setError(JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error:', err);
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
        maxWidth: '550px', width: '100%',
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

          {/* Title */}
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
                fontSize: '16px', fontWeight: '600', color: colors.textMain, outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Location */}
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
                  fontSize: '16px', fontWeight: '600', color: colors.textMain, outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Category */}
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

          {/* Subcategory */}
          {subcategories[formData.category] && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block', marginBottom: '8px',
                fontSize: '13px', fontWeight: '800', color: colors.textMain,
                textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>Specific Activity</label>
              <select
                value={formData.subcategory}
                onChange={(e) => handleSubcategoryChange(e.target.value)}
                style={{
                  width: '100%', padding: '16px',
                  backgroundColor: colors.inputBg, border: 'none', borderRadius: '16px',
                  fontSize: '16px', fontWeight: '600', color: colors.textMain, outline: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Select activity (optional)</option>
                {subcategories[formData.category].map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* When */}
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
                outline: 'none', fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Duration */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block', marginBottom: '8px',
              fontSize: '13px', fontWeight: '800', color: colors.textMain,
              textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>Duration</label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
              style={{
                width: '100%', padding: '16px',
                backgroundColor: colors.inputBg, border: 'none', borderRadius: '16px',
                fontSize: '16px', fontWeight: '600', color: colors.textMain,
                outline: 'none', cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <option value={1}>1 hour</option>
              <option value={2}>2 hours</option>
              <option value={3}>3 hours</option>
              <option value={4}>4 hours</option>
              <option value={6}>6 hours</option>
              <option value={8}>All day (8 hours)</option>
            </select>
          </div>

          {/* Group Size */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block', marginBottom: '8px',
              fontSize: '13px', fontWeight: '800', color: colors.textMain,
              textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>Group Size</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: colors.textMuted, fontWeight: '600' }}>
                  Minimum
                </label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={formData.min_attendees}
                  onChange={(e) => setFormData({ ...formData, min_attendees: Number(e.target.value) })}
                  style={{
                    width: '100%', padding: '12px',
                    backgroundColor: colors.inputBg, border: 'none', borderRadius: '12px',
                    fontSize: '16px', fontWeight: '600', color: colors.textMain,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: colors.textMuted, fontWeight: '600' }}>
                  Maximum (optional)
                </label>
                <input
                  type="number"
                  min={formData.min_attendees}
                  max="100"
                  value={formData.max_attendees || ''}
                  onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value ? Number(e.target.value) : null })}
                  placeholder="No limit"
                  style={{
                    width: '100%', padding: '12px',
                    backgroundColor: colors.inputBg, border: 'none', borderRadius: '12px',
                    fontSize: '16px', fontWeight: '600', color: colors.textMain,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
            <p style={{ fontSize: '12px', color: colors.textMuted, margin: '8px 0 0 0', fontWeight: '500' }}>
              Event becomes active when minimum is reached{formData.max_attendees ? `, closes at ${formData.max_attendees}` : ''}
            </p>
          </div>

          {/* Details */}
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
                  outline: 'none', minHeight: '100px', resize: 'vertical',
                  boxSizing: 'border-box'
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