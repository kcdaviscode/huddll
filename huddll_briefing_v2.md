# Huddll Project Briefing v2

**Last Updated:** March 26, 2026  
**Status:** Local development running on new machine

---

## Quick Start (New Machine Setup)

```bash
# Install prerequisites
brew install redis node
brew services start redis

# Backend setup
cd /Users/kevindavis/PycharmProjects/huddll
python3 -m venv .venv
source .venv/bin/activate
pip install django djangorestframework daphne channels channels-redis pillow dj-database-url django-cors-headers
python manage.py migrate
./start-django.sh

# Frontend (separate terminal)
cd /Users/kevindavis/PycharmProjects/huddll/frontend
npm install
npm start
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/api/

---

## Test Accounts

| Username | Password | Notes |
|----------|----------|-------|
| kevin | yourpassword | Main account |
| admin | yourpassword | Admin account |
| sam | nicaragua | Test account |

**Reset a password:**
```bash
source .venv/bin/activate
python manage.py shell -c "from users.models import User; u = User.objects.get(username='USERNAME'); u.set_password('NEWPASS'); u.save(); print('Done!')"
```

**List all users:**
```bash
python manage.py shell -c "from users.models import User; print('\n'.join([f'{u.id}: {u.username} - {u.email}' for u in User.objects.all()]))"
```

---

## Project Overview

Huddll is a social event discovery and coordination app:
- View events on a map (user-created "Huddlls" + Ticketmaster events)
- Create events and invite friends
- Mark interest / check in at events
- Create private "Huddlls" (friend groups) around public events
- Chat with attendees

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Django 5.x + Django REST Framework |
| Realtime | Django Channels + Daphne + Redis |
| Database | SQLite (dev) / PostgreSQL-ready |
| Frontend | React 18 + React Router |
| Maps | Google Maps API |
| External Events | Ticketmaster API |
| Auth | Token-based (DRF authtoken) |

---

## File Structure

```
HUDDLL/
├── huddll/                 # Django project settings
│   ├── settings.py         # Config, API keys
│   ├── urls.py             # Root URL routing
│   └── asgi.py             # Channels/Daphne config
│
├── events/                 # Core events app
│   ├── models.py           # Event, ExternalEvent, EventInterest, CheckIn
│   ├── views.py            # EventViewSet, external events, Huddll creation
│   ├── serializers.py      # EventListSerializer, EventDetailSerializer
│   └── urls.py             # /api/events/, /api/external/
│
├── users/                  # User accounts & profiles
├── connections/            # Friend connections
├── notifications/          # In-app notifications
├── chat/                   # WebSocket chat
│
└── frontend/src/           # React frontend
    ├── App.js              # Routing & layout
    ├── MapView.js          # Main map (~800 lines)
    ├── EventDetailModal.js # Event details popup
    ├── FilterPanel.js      # Filters
    ├── CreateEventModal.js # New event form
    └── theme.js            # Colors/styles
```

---

## 🔴 UNFIXED BUGS (Do These First)

### Bug #1: `type` missing from EventListSerializer
**File:** `events/serializers.py` lines 15-19

**Change:**
```python
fields = [
    'id', 'title', 'category', 'subcategory', 'venue_name', 'city',
    'latitude', 'longitude', 'start_time', 'end_time',
    'image', 'created_by', 'created_by_name', 'attendee_count', 
    'interested_count', 'interested_user_ids', 'type', 'emoji', 'min_attendees'  # ADD THESE 3
]
```

**Also change lines 21-22:**
```python
def get_interested_user_ids(self, obj):
    return [interest.user_id for interest in obj.interests.all()]  # Use prefetched data
```

### Bug #2: Huddlls leaking to public map
**File:** `events/views.py` lines 29-33

**Change to:**
```python
def get_queryset(self):
    queryset = Event.objects.filter(
        status='published'
    ).exclude(
        type='huddll'  # Don't show private Huddlls on public map
    ).prefetch_related(
        'interests'  # Eliminate N+1 query
    ).annotate(
        attendee_count=Count('checkins', distinct=True),
        interested_count=Count('interests', distinct=True)
    )
```

### Bug #3: boundsUpdateTimeout performance issue
**File:** `frontend/src/MapView.js`

Search for `boundsUpdateTimeout`. If it uses `useState`, change to `useRef`:
```javascript
// From:
const [boundsUpdateTimeout, setBoundsUpdateTimeout] = useState(null);

// To:
const boundsUpdateTimeout = useRef(null);

// And update usage:
if (boundsUpdateTimeout.current) clearTimeout(boundsUpdateTimeout.current);
boundsUpdateTimeout.current = setTimeout(() => handleBoundsChanged(map), 100);
```

### Bug #4: EventDetailModal bugs
**Status:** User has a list to share — not yet documented

---

## ✅ ALREADY FIXED

| Bug | Fix Applied |
|-----|-------------|
| Import error (`Notification` from wrong module) | Changed to `from notifications.models import Notification` |
| `mapCenter` causing re-renders | Removed from useEffect dependency array |

---

## Feature Roadmap

### Phase 1: Core Social (2-3 weeks)
1. **Enhanced Chat** — DMs between friends, chat list page
2. **Notification Polish** — group by type, separate badges
3. **Friend Groups** — persistent groups outside events

### Phase 2: Event Discovery (2-3 weeks)
4. Search & Filters
5. Interest-Based Recommendations  
6. Suggested Friends
7. Eventbrite + Yelp integration

### Phase 3: Event Planning (2-3 weeks)
8. Collaborative Event Planning (voting on time/location)
9. Huddlls for Public Events
10. Check-in/Attendance system

### Phase 4: Vendor Features (1-2 weeks)
11. Vendor accounts & dashboard

### Phase 5: Launch Prep (1-2 weeks)
12. Public landing page (map without login)
13. 2FA authentication (email/phone)
14. Security hardening
15. Legal/Terms
16. Deploy to huddll.com

---

## API Keys (from settings.py)

```python
TICKETMASTER_API_KEY = 'SKth1gGOScAZeG5ri9pE6AJ6psAtGQ8g'
EVENTBRITE_API_TOKEN = 'JHKQVGVI7SOTKCN7JK3Y'
GOOGLE_MAPS_API_KEY = 'AIzaSyBtw8mvh4JYNpReUxlJNlpHWc2M3iCglsA'
```

---

## Useful Commands

```bash
# Activate venv (required for all python commands)
source .venv/bin/activate

# Check Django health
python manage.py check

# Run migrations
python manage.py migrate

# Django shell
python manage.py shell

# Import external events
python manage.py import_external_events

# Count events
python manage.py shell -c "from events.models import Event, ExternalEvent; print(f'User: {Event.objects.count()}, External: {ExternalEvent.objects.count()}')"

# Regenerate requirements.txt
pip freeze > requirements.txt
```

---

## Future To-Do (Not Yet Started)

- Password reset flow (email-based)
- Admin role protections
- Environment variables for API URLs (remove hardcoded localhost)
- Error boundaries in React
- Loading skeletons
- Pagination on /api/events/

---

*Paste this document at the start of a new Claude chat to continue where you left off.*
