import React, { useState } from 'react';

const FilterPanel = ({ filters, onFilterChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

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

  const timeOptions = [
    { id: 'today', label: 'Today' },
    { id: 'tomorrow', label: 'Tomorrow' },
    { id: 'this_week', label: 'This Week' },
    { id: 'this_weekend', label: 'Weekend' },
    { id: 'all', label: 'All Upcoming' }
  ];

  const statusOptions = [
    { id: 'proposed', label: 'Proposed', color: '#9CA3AF' },
    { id: 'pending', label: 'Pending', color: '#F59E0B' },
    { id: 'active', label: 'Active', color: '#4A90BA' }
  ];

  const distanceOptions = [
    { id: '1', label: '1 mi' },
    { id: '5', label: '5 mi' },
    { id: '10', label: '10 mi' },
    { id: '25', label: '25 mi' }
  ];

  const colors = {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    header: '#0F172A',
    brandBlue: '#4A90BA',
    brandYellow: '#F59E0B',
    brandGrey: '#9CA3AF',
    inputBg: '#F8FAFC',
    textMain: '#1E293B',
    textMuted: '#64748B',
    border: '#E2E8F0'
  };

  const toggleCategory = (categoryId) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(c => c !== categoryId)
      : [...filters.categories, categoryId];

    // Clear subcategories when category changes
    onFilterChange({ ...filters, categories: newCategories, subcategories: [] });
  };

  const toggleSubcategory = (subcategoryId) => {
    const newSubcategories = filters.subcategories?.includes(subcategoryId)
      ? filters.subcategories.filter(s => s !== subcategoryId)
      : [...(filters.subcategories || []), subcategoryId];
    onFilterChange({ ...filters, subcategories: newSubcategories });
  };

  const toggleStatus = (statusId) => {
    const newStatuses = filters.statuses.includes(statusId)
      ? filters.statuses.filter(s => s !== statusId)
      : [...filters.statuses, statusId];
    onFilterChange({ ...filters, statuses: newStatuses });
  };

  const activeFilterCount =
    filters.categories.length +
    (filters.subcategories?.length || 0) +
    (filters.timeRange !== 'all' ? 1 : 0) +
    (3 - filters.statuses.length);

  // Get available subcategories based on selected categories
  const getAvailableSubcategories = () => {
    if (filters.categories.length === 0) return [];
    if (filters.categories.length === 1) {
      return subcategories[filters.categories[0]] || [];
    }
    // Multiple categories selected - show all their subcategories
    let allSubs = [];
    filters.categories.forEach(cat => {
      if (subcategories[cat]) {
        allSubs = [...allSubs, ...subcategories[cat]];
      }
    });
    return allSubs;
  };

  const availableSubcategories = getAvailableSubcategories();

  return (
    <div style={{
      backgroundColor: colors.cardBg,
      borderBottom: `1px solid ${colors.border}`,
      position: 'relative',
      zIndex: 100,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '16px 24px',
          backgroundColor: colors.cardBg,
          border: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '800',
          color: colors.textMain
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🎯</span>
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span style={{
              backgroundColor: colors.brandBlue,
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '800'
            }}>
              {activeFilterCount}
            </span>
          )}
        </div>
        <span style={{ fontSize: '16px', color: colors.textMuted }}>
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {isExpanded && (
        <div style={{
          padding: '24px',
          backgroundColor: colors.bg,
          borderTop: `1px solid ${colors.border}`
        }}>

          {/* Time Filter */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '12px',
              fontSize: '13px',
              fontWeight: '800',
              color: colors.textMain,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              When
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {timeOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => onFilterChange({ ...filters, timeRange: option.id })}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '50px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    backgroundColor: filters.timeRange === option.id ? colors.brandBlue : colors.cardBg,
                    color: filters.timeRange === option.id ? 'white' : colors.textMuted,
                    transition: 'all 0.2s ease',
                    boxShadow: filters.timeRange === option.id ? '0 4px 12px rgba(74, 144, 186, 0.3)' : 'none'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '12px',
              fontSize: '13px',
              fontWeight: '800',
              color: colors.textMain,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Vibe
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '50px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    backgroundColor: filters.categories.includes(cat.id) ? colors.brandBlue : colors.cardBg,
                    color: filters.categories.includes(cat.id) ? 'white' : colors.textMuted,
                    transition: 'all 0.2s ease',
                    boxShadow: filters.categories.includes(cat.id) ? '0 4px 12px rgba(74, 144, 186, 0.3)' : 'none'
                  }}
                >
                  <span style={{ marginRight: '6px' }}>{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subcategory Filter - Only show if categories are selected */}
          {availableSubcategories.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '12px',
                fontSize: '13px',
                fontWeight: '800',
                color: colors.textMain,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Specific Activity
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {availableSubcategories.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => toggleSubcategory(sub.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '50px',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      backgroundColor: filters.subcategories?.includes(sub.id) ? colors.brandBlue : colors.cardBg,
                      color: filters.subcategories?.includes(sub.id) ? 'white' : colors.textMuted,
                      transition: 'all 0.2s ease',
                      boxShadow: filters.subcategories?.includes(sub.id) ? '0 4px 12px rgba(74, 144, 186, 0.3)' : 'none'
                    }}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status Filter */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '12px',
              fontSize: '13px',
              fontWeight: '800',
              color: colors.textMain,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Status
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {statusOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => toggleStatus(option.id)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '50px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    backgroundColor: filters.statuses.includes(option.id) ? option.color : colors.cardBg,
                    color: filters.statuses.includes(option.id) ? 'white' : colors.textMuted,
                    transition: 'all 0.2s ease',
                    boxShadow: filters.statuses.includes(option.id) ? `0 4px 12px ${option.color}33` : 'none'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Distance Filter */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '12px',
              fontSize: '13px',
              fontWeight: '800',
              color: colors.textMain,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Distance
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {distanceOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => onFilterChange({ ...filters, distance: option.id })}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '50px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    backgroundColor: filters.distance === option.id ? colors.brandBlue : colors.cardBg,
                    color: filters.distance === option.id ? 'white' : colors.textMuted,
                    transition: 'all 0.2s ease',
                    boxShadow: filters.distance === option.id ? '0 4px 12px rgba(74, 144, 186, 0.3)' : 'none'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear All Button */}
          <button
            onClick={() => onFilterChange({
              categories: [],
              subcategories: [],
              timeRange: 'all',
              statuses: ['proposed', 'pending', 'active'],
              distance: '10'
            })}
            style={{
              padding: '14px 20px',
              backgroundColor: colors.textMuted,
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: '800',
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.2s'
            }}
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;