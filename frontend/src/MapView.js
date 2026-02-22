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
    eventType: 'all'
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

  // Prevent body scroll when InfoWindow or modal is open
  useEffect(() => {
    if (selectedEvent || detailModalEvent) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedEvent, detailModalEvent]);

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
      // Fetch user-created events
      const userEventsResponse = await fetch('http://localhost:8000/api/events/');
      const userEvents = await userEventsResponse.json();

      // Fetch external events (Ticketmaster, Eventbrite)
      const externalEventsResponse = await fetch('http://localhost:8000/api/external/');
      const externalData = await externalEventsResponse.json();
      const externalEvents = externalData.events || [];

      // Combine both types of events
      const allEvents = [...userEvents, ...externalEvents];

      console.log('Fetched events:', {
        userEvents: userEvents.length,
        externalEvents: externalEvents.length,
        total: allEvents.length
      });

      setEvents(allEvents);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    console.log('=== FILTER DEBUG ===');
    console.log('Total events:', events.length);
    console.log('Filter eventType:', filters.eventType);
    console.log('Sample user event:', events.find(e => !e.type));
    console.log('Sample external event:', events.find(e => e.type === 'external'));

    // Filter by event type
    if (filters.eventType === 'huddlls') {
      // Only show user-created events (events without type field OR type !== 'external')
      filtered = filtered.filter(event => !event.type || event.type !== 'external');
      console.log('After huddlls filter:', filtered.length);
    } else if (filters.eventType === 'public') {
      // Only show external events (must have type === 'external')
      filtered = filtered.filter(event => event.type === 'external');
      console.log('After public filter:', filtered.length);
    }
    // If 'all' or undefined, show everything (no filter needed)

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
    endOfWeek.setDate(endOfWeek.getDate() + 7); // Next 7 days
    const weekend = new Date(today);
    weekend.setDate(weekend.getDate() + (6 - today.getDay())); // Next Saturday

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
      // External events don't have status - always show them
      if (event.type === 'external') {
        return true;
      }

      // User events - check status
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

    console.log('Final filtered count:', filtered.length);
    console.log('===================');

    setFilteredEvents(filtered);

    // Update selected event if popup is open
    setSelectedEvent(prev => {
      if (!prev) return null;

      const stillVisible = filtered.find(e =>
        (e.type === 'external' ? `ext-${e.id}` : `user-${e.id}`) ===
        (prev.type === 'external' ? `ext-${prev.id}` : `user-${prev.id}`)
      );

      if (stillVisible) {
        // Update the eventsAtLocation list for the popup
        const eventsAtLocation = filtered.filter(e =>
          parseFloat(e.latitude) === parseFloat(stillVisible.latitude) &&
          parseFloat(e.longitude) === parseFloat(stillVisible.longitude)
        );
        console.log('Updating popup - events at location:', eventsAtLocation.length);
        return { ...stillVisible, eventsAtLocation };
      } else {
        // Event is no longer visible, close popup
        console.log('Selected event filtered out, closing popup');
        return null;
      }
    });
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
    // External events (Ticketmaster/Eventbrite) - use gold/yellow
    if (event.type === 'external') {
      return '#FFD700'; // Gold for professional events
    }

    // User-created events - use existing logic
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
              key={event.type === 'external' ? `ext-${event.id}` : `user-${event.id}`}
              position={{ lat: parseFloat(event.latitude), lng: parseFloat(event.longitude) }}
              onClick={() => {
                // Find all events at this exact location
                const eventsAtLocation = filteredEvents.filter(e =>
                  parseFloat(e.latitude) === parseFloat(event.latitude) &&
                  parseFloat(e.longitude) === parseFloat(event.longitude)
                );
                setSelectedEvent({ ...event, eventsAtLocation });
              }}
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
                minWidth: '280px',
                maxWidth: '320px',
                padding: '16px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                backgroundColor: theme.slateLight,
                borderRadius: '16px',
                border: `1px solid ${theme.border}`
              }}>

                {/* Venue Header */}
                <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: `1px solid ${theme.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={16} color={theme.skyBlue} />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: theme.textMain }}>
                      {selectedEvent.venue_name}
                    </h3>
                  </div>
                  {selectedEvent.eventsAtLocation && selectedEvent.eventsAtLocation.length > 1 && (
                    <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '4px', marginLeft: '24px' }}>
                      {selectedEvent.eventsAtLocation.length} events at this location
                    </div>
                  )}
                </div>

                {/* Event List */}
                <div style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {selectedEvent.eventsAtLocation && selectedEvent.eventsAtLocation.length > 0 ? (
                    selectedEvent.eventsAtLocation
                      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                      .map((event) => (
                        <div
                          key={event.type === 'external' ? `ext-${event.id}` : `user-${event.id}`}
                          onClick={() => {
                            setDetailModalEvent(event);
                            setSelectedEvent(null);
                          }}
                          style={{
                            padding: '12px',
                            backgroundColor: theme.deepNavy,
                            borderRadius: '12px',
                            border: `1px solid ${event.type === 'external' ? '#FFD700' : theme.border}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme.slate;
                            e.currentTarget.style.transform = 'translateX(4px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = theme.deepNavy;
                            e.currentTarget.style.transform = 'translateX(0)';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                            <div style={{ fontSize: '24px', lineHeight: '1' }}>
                              {getCategoryEmoji(event.category)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: '700',
                                color: theme.textMain,
                                marginBottom: '4px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}>
                                {event.title}
                              </div>
                              <div style={{
                                fontSize: '11px',
                                color: theme.textSecondary,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <Clock size={10} />
                                {formatEventTime(event.start_time)}
                              </div>
                              {event.type === 'external' && (
                                <div style={{
                                  display: 'inline-block',
                                  background: '#FFD700',
                                  color: theme.deepNavy,
                                  fontSize: '9px',
                                  fontWeight: '800',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  marginTop: '4px',
                                  textTransform: 'uppercase'
                                }}>
                                  🎫 Ticketmaster
                                </div>
                              )}
                            </div>
                            <ArrowRight size={14} color={theme.skyBlue} style={{ flexShrink: 0, marginTop: '2px' }} />
                          </div>
                        </div>
                      ))
                  ) : (
                    <div>No events found</div>
                  )}
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