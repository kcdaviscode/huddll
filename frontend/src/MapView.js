import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GoogleMap, Marker, InfoWindow, Circle } from '@react-google-maps/api';
import { MapPin, Clock, Users, ArrowRight, Plus, Navigation } from 'lucide-react';
import Header from './Header';
import CreateEventModal from './CreateEventModal';
import FilterPanel from './FilterPanel';
import EventDetailModal from './EventDetailModal';
import { DarkMapStyle } from './MapStyles';
import theme from './theme';

const MapView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailModalEvent, setDetailModalEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState({ lat: 39.2904, lng: -76.6122 });
  const [circleCenter, setCircleCenter] = useState({ lat: 39.2904, lng: -76.6122 });
  const [showCircle, setShowCircle] = useState(true);
  const [filters, setFilters] = useState({
    categories: [],
    subcategories: [],
    timeRange: 'all',
    statuses: ['proposed', 'pending', 'active'],
    distance: 'all',
    showMyEvents: false
  });

  const mapStyles = {
    height: "calc(100vh - 150px)",
    width: "100%"
  };

  const mapOptions = {
    styles: DarkMapStyle,
    disableDefaultUI: true,
    zoomControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
  };

  useEffect(() => {
    fetchEvents();

    const saved = localStorage.getItem('mapCenter');
    if (saved) {
      const savedCenter = JSON.parse(saved);
      setMapCenter(savedCenter);
      setCircleCenter(savedCenter);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setMapCenter(userLocation);
          setCircleCenter(userLocation);
          localStorage.setItem('mapCenter', JSON.stringify(userLocation));
        },
        () => {
          console.log('Using default Baltimore center');
        }
      );
    }
  }, []);

  // Handle URL parameter for opening specific event from notification
  useEffect(() => {
    const eventId = searchParams.get('event');
    if (eventId && !loading) {
      fetchEventById(eventId);
      // Clear the URL parameter
      setSearchParams({});
    }
  }, [searchParams, loading]);

  const fetchEventById = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/events/${eventId}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      if (response.ok) {
        const event = await response.json();
        setDetailModalEvent(event);

        // Center map on the event
        const eventLocation = {
          lat: parseFloat(event.latitude),
          lng: parseFloat(event.longitude)
        };
        setMapCenter(eventLocation);
        if (window.mapInstance) {
          window.mapInstance.panTo(eventLocation);
        }
      } else {
        console.error('Event not found');
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [events, filters, mapCenter]);

  useEffect(() => {
    if (filters.distance !== 'all') {
      setShowCircle(false);
      setTimeout(() => {
        setCircleCenter(mapCenter);
        setShowCircle(true);
      }, 10);
    }
  }, [mapCenter, filters.distance]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/events/');
      const data = await response.json();
      console.log('Fetched events:', data);
      setEvents(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    if (filters.showMyEvents) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      filtered = filtered.filter(event =>
        event.interested_user_ids && event.interested_user_ids.includes(Number(user.id))
      );
    }

    if (filters.categories.length > 0) {
      filtered = filtered.filter(event =>
        filters.categories.includes(event.category)
      );
    }

    if (filters.subcategories && filters.subcategories.length > 0) {
      filtered = filtered.filter(event =>
        filters.subcategories.includes(event.subcategory)
      );
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - today.getDay()));
    const weekend = new Date(today);
    weekend.setDate(weekend.getDate() + (6 - today.getDay()));

    filtered = filtered.filter(event => {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);

      switch(filters.timeRange) {
        case 'happening_now':
          return now >= eventStart && now <= eventEnd;
        case 'today':
          return eventStart >= today && eventStart < tomorrow;
        case 'tomorrow':
          const dayAfterTomorrow = new Date(tomorrow);
          dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
          return eventStart >= tomorrow && eventStart < dayAfterTomorrow;
        case 'this_week':
          return eventStart >= today && eventStart <= endOfWeek;
        case 'this_weekend':
          const sundayEnd = new Date(weekend);
          sundayEnd.setDate(sundayEnd.getDate() + 2);
          return eventStart >= weekend && eventStart < sundayEnd;
        case 'all':
        default:
          return eventStart >= today;
      }
    });

    filtered = filtered.filter(event => {
      const interestedCount = event.interested_count || 1;
      const minAttendees = event.min_attendees || 3;

      let status = 'proposed';
      if (interestedCount >= 2 && interestedCount < minAttendees) status = 'pending';
      if (interestedCount >= minAttendees) status = 'active';

      return filters.statuses.includes(status);
    });

    if (filters.distance !== 'all') {
      const maxDistance = parseFloat(filters.distance);
      filtered = filtered.filter(event => {
        const distance = getDistance(
          mapCenter.lat,
          mapCenter.lng,
          parseFloat(event.latitude),
          parseFloat(event.longitude)
        );
        return distance <= maxDistance;
      });
    }

    setFilteredEvents(filtered);
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getPinColor = (event) => {
    const interestedCount = event.interested_count || 1;
    const minAttendees = event.min_attendees || 3;

    if (interestedCount < 2) return theme.textLight;
    if (interestedCount >= 2 && interestedCount < minAttendees) return theme.peach;
    return theme.skyBlue;
  };

  const getCategoryEmoji = (category) => {
    const emojiMap = { food: '🍔', sports: '⚽', nightlife: '🎉', arts: '🎨', music: '🎵', social: '👥' };
    return emojiMap[category] || '📍';
  };

  const formatEventTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    if (isToday) return `Today, ${timeStr}`;
    if (isTomorrow) return `Tomorrow, ${timeStr}`;

    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${dateStr}, ${timeStr}`;
  };

  const handleEventCreated = (newEvent) => {
    console.log('New event created:', newEvent);
    fetchEvents();
  };

  const handleFilterChange = (newFilters) => {
    if (newFilters.distance !== 'all' && filters.distance === 'all') {
      if (window.mapInstance) {
        const currentCenter = {
          lat: window.mapInstance.getCenter().lat(),
          lng: window.mapInstance.getCenter().lng()
        };
        setMapCenter(currentCenter);
        setCircleCenter(currentCenter);
      }
    }
    setFilters(newFilters);
  };

  const handleMapIdle = useCallback(() => {
    if (window.mapInstance) {
      const newCenter = {
        lat: window.mapInstance.getCenter().lat(),
        lng: window.mapInstance.getCenter().lng()
      };
      const latDiff = Math.abs(newCenter.lat - mapCenter.lat);
      const lngDiff = Math.abs(newCenter.lng - mapCenter.lng);

      if (latDiff > 0.0001 || lngDiff > 0.0001) {
        setMapCenter(newCenter);
        localStorage.setItem('mapCenter', JSON.stringify(newCenter));
      }
    }
  }, [mapCenter]);

  const handleRecenter = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setMapCenter(userLocation);
          setCircleCenter(userLocation);
          localStorage.setItem('mapCenter', JSON.stringify(userLocation));
          if (window.mapInstance) {
            window.mapInstance.panTo(userLocation);
          }
        },
        (error) => {
          console.error('Location error:', error);
          alert('Please enable location services to use this feature');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: theme.deepNavy }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: `3px solid ${theme.slateLight}`,
          borderTop: `3px solid ${theme.skyBlue}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          boxShadow: `0 0 20px ${theme.skyBlue}40`
        }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: theme.deepNavy, minHeight: '100vh' }}>
      <Header />

      <div style={{ marginTop: '70px' }}>
        <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
      </div>

      <div>
        <GoogleMap
          mapContainerStyle={mapStyles}
          zoom={14}
          center={mapCenter}
          options={mapOptions}
          onLoad={(map) => {
            window.mapInstance = map;
          }}
          onIdle={handleMapIdle}
        >
          {false && filters.distance !== 'all' && (
            <Circle
              center={circleCenter}
              radius={parseFloat(filters.distance) * 1609.34}
              options={{
                strokeColor: theme.skyBlue,
                strokeOpacity: 0.6,
                strokeWeight: 2,
                fillColor: theme.skyBlue,
                fillOpacity: 0.1,
                clickable: false,
                editable: false,
                zIndex: 1
              }}
            />
          )}

          {filteredEvents.map((event) => (
            <Marker
              key={event.id}
              position={{ lat: parseFloat(event.latitude), lng: parseFloat(event.longitude) }}
              onClick={() => setSelectedEvent(event)}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 14,
                fillColor: getPinColor(event),
                fillOpacity: 1,
                strokeColor: theme.deepNavy,
                strokeWeight: 3,
              }}
            />
          ))}

          {selectedEvent && (
            <InfoWindow
              position={{ lat: parseFloat(selectedEvent.latitude), lng: parseFloat(selectedEvent.longitude) }}
              onCloseClick={() => setSelectedEvent(null)}
              options={{ pixelOffset: new window.google.maps.Size(0, -20) }}
            >
              <div style={{
                minWidth: '240px',
                padding: '12px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                backgroundColor: theme.slateLight,
                borderRadius: '16px',
                border: `1px solid ${theme.border}`
              }}>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '32px', lineHeight: '1', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                    {getCategoryEmoji(selectedEvent.category)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: theme.textMain, lineHeight: '1.2' }}>
                      {selectedEvent.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', color: theme.textSecondary }}>
                      <MapPin size={12} strokeWidth={2.5} />
                      <span style={{ fontSize: '12px', fontWeight: '600' }}>{selectedEvent.venue_name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', color: theme.textSecondary }}>
                      <Clock size={12} strokeWidth={2.5} />
                      <span style={{ fontSize: '12px', fontWeight: '500' }}>{formatEventTime(selectedEvent.start_time)}</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: theme.deepNavy,
                  padding: '10px 12px',
                  borderRadius: '12px',
                  marginTop: '12px',
                  border: `1px solid ${theme.border}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} color={theme.skyBlue} />
                    <span style={{ fontSize: '13px', fontWeight: '700', color: theme.textMain }}>
                      {selectedEvent.interested_count || 1}
                      {selectedEvent.max_attendees ? `/${selectedEvent.max_attendees}` : '+'}
                      <span style={{ fontWeight: '500', color: theme.textSecondary, marginLeft: '4px' }}>going</span>
                    </span>
                  </div>

                  <div
                    onClick={() => {
                      setDetailModalEvent(selectedEvent);
                      setSelectedEvent(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      color: theme.skyBlue,
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(3px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                  >
                    Details <ArrowRight size={12} style={{ marginLeft: '3px' }}/>
                  </div>
                </div>

              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {/* Recenter Button */}
      <button
        onClick={handleRecenter}
        style={{
          position: 'fixed',
          bottom: '120px',
          left: '24px',
          backgroundColor: theme.slateLight,
          color: theme.skyBlue,
          padding: '16px',
          borderRadius: '50%',
          border: `1px solid ${theme.border}`,
          cursor: 'pointer',
          boxShadow: `0 8px 24px rgba(0, 0, 0, 0.4), 0 0 20px ${theme.skyBlue}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          width: '56px',
          height: '56px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = `0 12px 32px rgba(0, 0, 0, 0.5), 0 0 30px ${theme.skyBlue}40`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = `0 8px 24px rgba(0, 0, 0, 0.4), 0 0 20px ${theme.skyBlue}20`;
        }}
        title="Return to my location"
      >
        <Navigation size={24} strokeWidth={2.5} />
      </button>

      {/* Create Event Button */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        style={{
          position: 'fixed',
          bottom: '120px',
          right: '24px',
          background: theme.accentGradient,
          color: 'white',
          padding: '16px 24px',
          borderRadius: '50px',
          border: 'none',
          cursor: 'pointer',
          boxShadow: `0 8px 30px ${theme.skyBlue}60`,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 1000,
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = `0 12px 40px ${theme.skyBlue}80`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = `0 8px 30px ${theme.skyBlue}60`;
        }}
      >
        <Plus size={24} strokeWidth={3} />
        <span style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '-0.3px' }}>New Huddll</span>
      </button>

      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateEvent={handleEventCreated}
      />

      <EventDetailModal
        event={detailModalEvent ? events.find(e => e.id === detailModalEvent.id) || detailModalEvent : null}
        isOpen={!!detailModalEvent}
        onClose={() => setDetailModalEvent(null)}
        onEventUpdated={fetchEvents}
      />

      <style>{`
        .gm-style-iw { 
          padding: 0 !important; 
          overflow: hidden !important; 
          border-radius: 16px !important; 
          box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important;
          background-color: ${theme.slateLight} !important;
        }
        .gm-style-iw-d { 
          overflow: hidden !important; 
          padding: 0 !important; 
        }
        .gm-ui-hover-effect { 
          top: 8px !important; 
          right: 8px !important; 
          opacity: 0.8 !important;
          background-color: ${theme.deepNavy} !important;
          border-radius: 50% !important;
        }
        .gm-ui-hover-effect img {
          filter: brightness(0) invert(1);
        }
      `}</style>
    </div>
  );
};

export default MapView;