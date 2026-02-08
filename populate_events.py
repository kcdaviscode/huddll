import os
import django
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'huddll.settings')
django.setup()

from events.models import Event
from users.models import User

# Get the admin user (or create one if needed)
try:
    admin = User.objects.get(username='admin')
except User.DoesNotExist:
    print("Admin user not found. Please create a superuser first.")
    exit()

# Clear existing events (optional)
Event.objects.all().delete()

# Tomorrow's date
tomorrow = datetime.now() + timedelta(days=1)

# Test events data
events_data = [
    {
        'title': 'Morning Coffee Meetup',
        'description': 'Join us for coffee and networking at Federal Hill. Great way to start your day and meet new people!',
        'venue_name': 'The Daily Grind',
        'address': '1720 Thames St',
        'city': 'Baltimore',
        'latitude': 39.2753,
        'longitude': -76.6094,
        'start_time': tomorrow.replace(hour=9, minute=0),
        'end_time': tomorrow.replace(hour=11, minute=0),
        'category': 'food',
        'status': 'published',
        'is_public': True,
    },
    {
        'title': 'Inner Harbor Yoga Session',
        'description': 'Outdoor yoga by the water. All levels welcome! Bring your own mat.',
        'venue_name': 'Inner Harbor Pavilion',
        'address': '201 E Pratt St',
        'city': 'Baltimore',
        'latitude': 39.2854,
        'longitude': -76.6083,
        'start_time': tomorrow.replace(hour=7, minute=30),
        'end_time': tomorrow.replace(hour=8, minute=30),
        'category': 'sports',
        'status': 'published',
        'is_public': True,
    },
    {
        'title': 'Fells Point Pub Crawl',
        'description': 'Explore the historic bars of Fells Point! Meet at the square and we\'ll hit 5 great spots.',
        'venue_name': 'Broadway Square',
        'address': '1600 Thames St',
        'city': 'Baltimore',
        'latitude': 39.2838,
        'longitude': -76.5935,
        'start_time': tomorrow.replace(hour=20, minute=0),
        'end_time': tomorrow.replace(hour=23, minute=30),
        'category': 'nightlife',
        'status': 'published',
        'is_public': True,
    },
    {
        'title': 'Canton Waterfront Art Walk',
        'description': 'Casual stroll through Canton checking out local street art and galleries. Perfect for art lovers!',
        'venue_name': 'Canton Waterfront Park',
        'address': '3001 Boston St',
        'city': 'Baltimore',
        'latitude': 39.2797,
        'longitude': -76.5825,
        'start_time': tomorrow.replace(hour=14, minute=0),
        'end_time': tomorrow.replace(hour=16, minute=0),
        'category': 'arts',
        'status': 'published',
        'is_public': True,
    },
    {
        'title': 'Mount Vernon Jazz Night',
        'description': 'Live jazz music at the beautiful Peabody Conservatory. Wine and light appetizers included.',
        'venue_name': 'Peabody Conservatory',
        'address': '1 E Mt Vernon Pl',
        'city': 'Baltimore',
        'latitude': 39.2968,
        'longitude': -76.6163,
        'start_time': tomorrow.replace(hour=19, minute=0),
        'end_time': tomorrow.replace(hour=22, minute=0),
        'category': 'music',
        'status': 'published',
        'is_public': True,
    },
]

# Create events
print("Creating test events...")
for event_data in events_data:
    event = Event.objects.create(
        created_by=admin,
        **event_data
    )
    print(f"✓ Created: {event.title}")

print(f"\n🎉 Successfully created {len(events_data)} events!")
print("Visit http://127.0.0.1:8000/api/events/ to see them")