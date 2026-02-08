import React, { useState, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, Clock, Users, ArrowRight, Plus } from 'lucide-react';
import Header from './Header';
import CreateEventModal from './CreateEventModal';
import FilterPanel from './FilterPanel';
import EventDetailModal from './EventDetailModal';

// CUSTOM MAP THEME: "Vibrant Clean"
const mapTheme = [
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#a6cbe3" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#92998d" }] },
  { "featureType": "landscape.man_made", "elementType": "geometry", "stylers": [{ "color": "#f7f9fb" }] },
  { "featureType": "landscape.natural", "elementType": "geometry", "stylers": [{ "color": "#eff6f3" }] },
  { "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [{ "color": "#e6f0e3" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#447530" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#f8c967" }, { "lightness": 40 }] },
  { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [{ "color": "#4a90ba" }] }
];

const MapView = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailModalEvent, setDetailModalEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    categories: [],
    timeRange: 'all',
    statuses: ['proposed', 'pending', 'active'],
    distance: '10'
  });

  const center = { lat: 39.2904, lng: -76.6122 };

  const mapStyles = {
    height: "calc(100vh - 150px)",
    width: "100%"
  };

  const mapOptions = {
    styles: mapTheme,
    disableDefaultUI: true,
    zoomControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, filters]);

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

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(event =>
        filters.categories.includes(event.category)
      );
    }

    // Time range filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - today.getDay()));
    const weekend = new Date(today);
    weekend.setDate(weekend.getDate() + (6 - today.getDay()));

    filtered = filtered.filter(event => {
      const eventDate = new Date(event.start_time);
      switch(filters.timeRange) {
        case 'today':
          return eventDate >= today && eventDate < tomorrow;
        case 'tomorrow':
          const dayAfterTomorrow = new Date(tomorrow);
          dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
          return eventDate >= tomorrow && eventDate < dayAfterTomorrow;
        case 'this_week':
          return eventDate >= today && eventDate <= endOfWeek;
        case 'this_weekend':
          const sundayEnd = new Date(weekend);
          sundayEnd.setDate(sundayEnd.getDate() + 2);
          return eventDate >= weekend && eventDate < sundayEnd;
        case 'all':
        default:
          return eventDate >= today;
      }
    });

    // Status filter
    filtered = filtered.filter(event => {
      const attendeeCount = event.checkins ? event.checkins.length + 1 : 1;
      let status = 'proposed';
      if (attendeeCount === 2) status = 'pending';
      if (attendeeCount >= 3) status = 'active';
      return filters.statuses.includes(status);
    });

    // Distance filter
    const maxDistance = parseFloat(filters.distance);
    filtered = filtered.filter(event => {
      const distance = getDistance(
        center.lat,
        center.lng,
        parseFloat(event.latitude),
        parseFloat(event.longitude)
      );
      return distance <= maxDistance;
    });

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
    const attendeeCount = event.checkins ? event.checkins.length + 1 : 1;
    if (attendeeCount === 1) return '#94A3B8';
    if (attendeeCount === 2) return '#F59E0B';
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
    setFilters(newFilters);
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
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <Header />

      <div style={{ marginTop: '70px' }}>
        <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
      </div>

      <div>
        <GoogleMap
          mapContainerStyle={mapStyles}
          zoom={14}
          center={center}
          options={mapOptions}
        >
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
                      {selectedEvent.checkins ? selectedEvent.checkins.length + 1 : 1}
                      <span style={{ fontWeight: '500', color: '#64748B', marginLeft: '4px' }}>going</span>
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
        event={detailModalEvent}
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