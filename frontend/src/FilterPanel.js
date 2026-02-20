import React, { useState } from 'react';
import theme from './theme';

const FilterPanel = ({ filters, onFilterChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingFilters, setPendingFilters] = useState(filters);

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
    { id: 'happening_now', label: '🔴 Happening Now' },
    { id: 'today', label: 'Today' },
    { id: 'tomorrow', label: 'Tomorrow' },
    { id: 'this_week', label: 'This Week' },
    { id: 'this_weekend', label: 'Weekend' },
    { id: 'all', label: 'All Upcoming' }
  ];

  const statusOptions = [
    { id: 'proposed', label: 'Proposed', color: theme.textLight },
    { id: 'pending', label: 'Pending', color: theme.peach },
    { id: 'active', label: 'Active', color: theme.skyBlue }
  ];

  const distanceOptions = [
    { id: '1', label: '1 mi' },
    { id: '5', label: '5 mi' },
    { id: '10', label: '10 mi' },
    { id: '25', label: '25 mi' },
    { id: 'all', label: 'All' }
  ];

  const toggleCategory = (categoryId) => {
    const newCategories = pendingFilters.categories.includes(categoryId)
      ? pendingFilters.categories.filter(c => c !== categoryId)
      : [...pendingFilters.categories, categoryId];

    setPendingFilters({ ...pendingFilters, categories: newCategories, subcategories: [] });
  };

  const toggleSubcategory = (subcategoryId) => {
    const newSubcategories = pendingFilters.subcategories?.includes(subcategoryId)
      ? pendingFilters.subcategories.filter(s => s !== subcategoryId)
      : [...(pendingFilters.subcategories || []), subcategoryId];
    setPendingFilters({ ...pendingFilters, subcategories: newSubcategories });
  };

  const toggleStatus = (statusId) => {
    const newStatuses = pendingFilters.statuses.includes(statusId)
      ? pendingFilters.statuses.filter(s => s !== statusId)
      : [...pendingFilters.statuses, statusId];
    setPendingFilters({ ...pendingFilters, statuses: newStatuses });
  };

  const applyFilters = () => {
    onFilterChange(pendingFilters);
    setIsExpanded(false);
  };

  const clearFilters = () => {
    const clearedFilters = {
      categories: [],
      subcategories: [],
      timeRange: 'all',
      statuses: ['proposed', 'pending', 'active'],
      distance: 'all',
      showMyEvents: false
    };
    setPendingFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const activeFilterCount =
    filters.categories.length +
    (filters.subcategories?.length || 0) +
    (filters.timeRange !== 'all' ? 1 : 0) +
    (3 - filters.statuses.length) +
    (filters.showMyEvents ? 1 : 0);

  const getAvailableSubcategories = () => {
    if (pendingFilters.categories.length === 0) return [];
    if (pendingFilters.categories.length === 1) {
      return subcategories[pendingFilters.categories[0]] || [];
    }
    let allSubs = [];
    pendingFilters.categories.forEach(cat => {
      if (subcategories[cat]) {
        allSubs = [...allSubs, ...subcategories[cat]];
      }
    });
    return allSubs;
  };

  const availableSubcategories = getAvailableSubcategories();

  return (
    <div style={{
      backgroundColor: theme.slate,
      borderBottom: `1px solid ${theme.border}`,
      position: 'relative',
      zIndex: 100,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '16px 24px',
          backgroundColor: theme.slate,
          border: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '800',
          color: theme.textMain
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🎯</span>
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span style={{
              background: theme.accentGradient,
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '800',
              boxShadow: `0 0 12px ${theme.skyBlue}40`
            }}>
              {activeFilterCount}
            </span>
          )}
        </div>
        <span style={{ fontSize: '16px', color: theme.textSecondary }}>
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {isExpanded && (
        <div style={{
          padding: '24px',
          backgroundColor: theme.deepNavy,
          borderTop: `1px solid ${theme.border}`
        }}>

          {/* My Events Toggle */}
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => setPendingFilters({ ...pendingFilters, showMyEvents: !pendingFilters.showMyEvents })}
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '14px 20px',
                borderRadius: '16px',
                border: `2px solid ${pendingFilters.showMyEvents ? theme.skyBlue : theme.border}`,
                fontSize: '15px',
                fontWeight: '800',
                cursor: 'pointer',
                background: pendingFilters.showMyEvents ? theme.accentGradient : theme.slateLight,
                color: 'white',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: pendingFilters.showMyEvents ? `0 4px 16px ${theme.skyBlue}40` : 'none'
              }}
            >
              <span style={{ fontSize: '18px' }}>👤</span>
              <span>My Events Only</span>
            </button>
          </div>

          {/* Time Filter */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '12px',
              fontSize: '13px',
              fontWeight: '800',
              color: theme.textMain,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              textAlign: 'center'
            }}>
              When
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {timeOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setPendingFilters({ ...pendingFilters, timeRange: option.id })}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '50px',
                    border: `1px solid ${pendingFilters.timeRange === option.id ? theme.skyBlue : theme.border}`,
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: pendingFilters.timeRange === option.id ? theme.accentGradient : theme.slateLight,
                    color: pendingFilters.timeRange === option.id ? 'white' : theme.textSecondary,
                    transition: 'all 0.2s ease',
                    boxShadow: pendingFilters.timeRange === option.id ? `0 4px 12px ${theme.skyBlue}40` : 'none'
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
              color: theme.textMain,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              textAlign: 'center'
            }}>
              Vibe
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '50px',
                    border: `1px solid ${pendingFilters.categories.includes(cat.id) ? theme.skyBlue : theme.border}`,
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: pendingFilters.categories.includes(cat.id) ? theme.accentGradient : theme.slateLight,
                    color: pendingFilters.categories.includes(cat.id) ? 'white' : theme.textSecondary,
                    transition: 'all 0.2s ease',
                    boxShadow: pendingFilters.categories.includes(cat.id) ? `0 4px 12px ${theme.skyBlue}40` : 'none'
                  }}
                >
                  <span style={{ marginRight: '6px' }}>{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subcategory Filter */}
          {availableSubcategories.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '12px',
                fontSize: '13px',
                fontWeight: '800',
                color: theme.textMain,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                textAlign: 'center'
              }}>
                Specific Activity
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {availableSubcategories.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => toggleSubcategory(sub.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '50px',
                      border: `1px solid ${pendingFilters.subcategories?.includes(sub.id) ? theme.skyBlue : theme.border}`,
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      background: pendingFilters.subcategories?.includes(sub.id) ? theme.accentGradient : theme.slateLight,
                      color: pendingFilters.subcategories?.includes(sub.id) ? 'white' : theme.textSecondary,
                      transition: 'all 0.2s ease',
                      boxShadow: pendingFilters.subcategories?.includes(sub.id) ? `0 4px 12px ${theme.skyBlue}40` : 'none'
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
              color: theme.textMain,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              textAlign: 'center'
            }}>
              Status
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {statusOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => toggleStatus(option.id)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '50px',
                    border: `1px solid ${pendingFilters.statuses.includes(option.id) ? option.color : theme.border}`,
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    backgroundColor: pendingFilters.statuses.includes(option.id) ? option.color : theme.slateLight,
                    color: 'white',
                    transition: 'all 0.2s ease',
                    boxShadow: pendingFilters.statuses.includes(option.id) ? `0 4px 12px ${option.color}40` : 'none'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Distance Filter */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '12px',
              fontSize: '13px',
              fontWeight: '800',
              color: theme.textMain,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              textAlign: 'center'
            }}>
              Distance
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {distanceOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setPendingFilters({ ...pendingFilters, distance: option.id })}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '50px',
                    border: `1px solid ${pendingFilters.distance === option.id ? theme.skyBlue : theme.border}`,
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: pendingFilters.distance === option.id ? theme.accentGradient : theme.slateLight,
                    color: pendingFilters.distance === option.id ? 'white' : theme.textSecondary,
                    transition: 'all 0.2s ease',
                    boxShadow: pendingFilters.distance === option.id ? `0 4px 12px ${theme.skyBlue}40` : 'none'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={applyFilters}
              style={{
                flex: 1,
                maxWidth: '300px',
                padding: '14px 20px',
                background: theme.accentGradient,
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontSize: '15px',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: `0 4px 16px ${theme.skyBlue}60`
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 8px 24px ${theme.skyBlue}80`}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = `0 4px 16px ${theme.skyBlue}60`}
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              style={{
                flex: 1,
                maxWidth: '300px',
                padding: '14px 20px',
                backgroundColor: theme.slateLight,
                color: theme.textMain,
                border: `1px solid ${theme.border}`,
                borderRadius: '16px',
                fontSize: '15px',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;