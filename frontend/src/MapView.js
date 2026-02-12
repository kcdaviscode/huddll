import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow, Circle } from '@react-google-maps/api';
import { MapPin, Clock, Users, ArrowRight, Plus, Navigation } from 'lucide-react';
import Header from './Header';
import CreateEventModal from './CreateEventModal';
import FilterPanel from './FilterPanel';
import EventDetailModal from './EventDetailModal';
import { DarkMapStyle } from './MapStyles';

const MapView = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailModalEvent, setDetailModalEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState({ lat: 39.2904, lng: -76.6122 });
  const [circleCenter, setCircleCenter] = useState({ lat: 39.2904, lng: -76.6122 });
  const [showCircle, setShowCircle] = useState(true); // Toggle to force remount
  const [filters, setFilters] = useState({
    categories: [],
    subcategories: [],
    timeRange: 'all',
    statuses: ['proposed', 'pending', 'active'],
    distance: 'all',
    showMyEvents: false
  });

  const colors = {
    bg: '#F8FAFC',
    header: '#0F172A',
    brandBlue: '#4A90BA',
    brandYellow: '#F59E0B',
    brandGreen: '#10B981',
    textMain: '#1E293B',
    textMuted: '#64748B',
    cardBg: '#FFFFFF'
  };

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

  useEffect(() => {
    applyFilters();
  }, [events, filters, mapCenter]);

  // Update circle by unmounting and remounting when center changes
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

    if (interestedCount < 2) return '#94A3B8';
    if (interestedCount >= 2 && interestedCount < minAttendees) return '#F59E0B';
    return '#4A90BA';
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#F8FAFC' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTop: '3px solid #0F172A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh' }}>
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
          {/* Distance Circle - DISABLED FOR NOW due to technical issues */}
{/* We'll revisit this feature later */}
{false && filters.distance !== 'all' && (
  <Circle
    center={circleCenter}
    radius={parseFloat(filters.distance) * 1609.34}
    options={{
      strokeColor: '#4A90BA',
      strokeOpacity: 0.6,
      strokeWeight: 2,
      fillColor: '#4A90BA',
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
                strokeColor: '#FFFFFF',
                strokeWeight: 4,
              }}
            />
          ))}

          {selectedEvent && (
            <InfoWindow
              position={{ lat: parseFloat(selectedEvent.latitude), lng: parseFloat(selectedEvent.longitude) }}
              onCloseClick={() => setSelectedEvent(null)}
              options={{ pixelOffset: new window.google.maps.Size(0, -20) }}
            >
              <div style={{ minWidth: '220px', padding: '4px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '24px', lineHeight: '1' }}>{getCategoryEmoji(selectedEvent.category)}</div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0F172A', lineHeight: '1.2' }}>
                      {selectedEvent.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: '#64748B' }}>
                      <MapPin size={12} strokeWidth={2.5} />
                      <span style={{ fontSize: '12px', fontWeight: '600' }}>{selectedEvent.venue_name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', color: '#64748B' }}>
                      <Clock size={12} strokeWidth={2.5} />
                      <span style={{ fontSize: '12px', fontWeight: '500' }}>{formatEventTime(selectedEvent.start_time)}</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: '#F1F5F9', padding: '8px 10px', borderRadius: '10px', marginTop: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Users size={14} color="#0F172A" />
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                      {selectedEvent.interested_count || 1}
                      {selectedEvent.max_attendees ? `/${selectedEvent.max_attendees}` : '+'}
                      <span style={{ fontWeight: '500', color: '#64748B', marginLeft: '4px' }}>interested</span>
                    </span>
                  </div>

                  <div
                    onClick={() => {
                      setDetailModalEvent(selectedEvent);
                      setSelectedEvent(null);
                    }}
                    style={{ display: 'flex', alignItems: 'center', color: '#4A90BA', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Details <ArrowRight size={12} style={{ marginLeft: '2px' }}/>
                  </div>
                </div>

              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      <button
        onClick={handleRecenter}
        style={{
          position: 'fixed',
          bottom: '120px',
          left: '24px',
          backgroundColor: '#FFFFFF',
          color: colors.header,
          padding: '16px',
          borderRadius: '50%',
          border: '2px solid #E2E8F0',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
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
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        }}
        title="Return to my location"
      >
        <Navigation size={24} strokeWidth={2.5} />
      </button>

      <button
        onClick={() => setIsCreateModalOpen(true)}
        style={{
          position: 'fixed',
          bottom: '120px',
          right: '24px',
          backgroundColor: '#0F172A',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '50px',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 1000,
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
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
        .gm-style-iw { padding: 0 !important; overflow: hidden !important; border-radius: 16px !important; box-shadow: 0 10px 40px rgba(0,0,0,0.2) !important; }
        .gm-style-iw-d { overflow: hidden !important; padding: 0 !important; }
        .gm-ui-hover-effect { top: 4px !important; right: 4px !important; opacity: 0.6 !important; }
      `}</style>
    </div>
  );
};

export default MapView;