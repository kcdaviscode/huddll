"""
Management command to import events from Ticketmaster and Eventbrite
Run with: python manage.py import_external_events
"""

import requests
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.conf import settings
from events.models import ExternalEvent
import time


class Command(BaseCommand):
    help = 'Import events from Ticketmaster and Eventbrite'

    def geocode_address(self, address, city, state):
        """Use Google Geocoding API to get accurate coordinates"""
        try:
            google_api_key = settings.GOOGLE_MAPS_API_KEY
            full_address = f"{address}, {city}, {state}"

            geocode_url = "https://maps.googleapis.com/maps/api/geocode/json"
            params = {
                'address': full_address,
                'key': google_api_key
            }

            response = requests.get(geocode_url, params=params, timeout=5)
            data = response.json()

            if data['status'] == 'OK' and len(data['results']) > 0:
                location = data['results'][0]['geometry']['location']
                return location['lat'], location['lng']

            return None, None
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Geocoding failed: {str(e)}'))
            return None, None

    def add_arguments(self, parser):
        parser.add_argument(
            '--source',
            type=str,
            choices=['ticketmaster', 'eventbrite', 'all'],
            default='all',
            help='Which source to import from'
        )
        parser.add_argument(
            '--days',
            type=int,
            default=60,  # 60 days to catch baseball season
            help='How many days ahead to fetch events'
        )

    def handle(self, *args, **options):
        source = options['source']
        days_ahead = options['days']

        if source in ['ticketmaster', 'all']:
            self.stdout.write('Importing from Ticketmaster...')
            count = self.import_ticketmaster(days_ahead)
            self.stdout.write(self.style.SUCCESS(f'✅ Imported {count} Ticketmaster events'))

        if source in ['eventbrite', 'all']:
            self.stdout.write('Importing from Eventbrite...')
            count = self.import_eventbrite(days_ahead)
            self.stdout.write(self.style.SUCCESS(f'✅ Imported {count} Eventbrite events'))

    def import_ticketmaster(self, days_ahead):
        """Import events from Ticketmaster Discovery API with pagination"""
        api_key = settings.TICKETMASTER_API_KEY
        url = 'https://app.ticketmaster.com/discovery/v2/events.json'

        # Baltimore coordinates - using latlong for proper radius search
        baltimore_lat = 39.2904
        baltimore_lng = -76.6122

        base_params = {
            'apikey': api_key,
            'latlong': f'{baltimore_lat},{baltimore_lng}',
            'radius': '50',  # 50 miles - includes DC, Annapolis, etc.
            'unit': 'miles',
            'size': 200,  # Max results per request (Ticketmaster limit)
            'sort': 'date,asc',
            'startDateTime': datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ'),
            'endDateTime': (datetime.now() + timedelta(days=days_ahead)).strftime('%Y-%m-%dT%H:%M:%SZ')
        }

        all_events = []
        page = 0
        total_pages = 1  # Will be updated from first response

        try:
            # Paginate through all results
            while page < total_pages:
                params = {**base_params, 'page': page}

                self.stdout.write(f'Fetching page {page + 1}...')

                try:
                    response = requests.get(url, params=params, timeout=10)
                    response.raise_for_status()
                    data = response.json()
                except requests.exceptions.RequestException as e:
                    self.stdout.write(self.style.WARNING(f'Failed to fetch page {page + 1}: {e}'))
                    # If it's the last page and fails, just break (common with Ticketmaster)
                    if page == total_pages - 1:
                        self.stdout.write('Last page failed, continuing with data we have...')
                        break
                    # Otherwise, try next page
                    page += 1
                    continue

                if '_embedded' not in data or 'events' not in data['_embedded']:
                    self.stdout.write(self.style.WARNING(f'No events found on page {page}'))
                    break

                # Get pagination info
                if 'page' in data:
                    total_pages = data['page'].get('totalPages', 1)
                    total_events = data['page'].get('totalElements', 0)
                    self.stdout.write(f'Page {page + 1}/{total_pages} (Total events: {total_events})')

                events = data['_embedded']['events']
                all_events.extend(events)

                page += 1

                # Be nice to Ticketmaster's API - small delay between requests
                if page < total_pages:
                    time.sleep(0.2)  # 200ms delay between pages

            self.stdout.write(self.style.SUCCESS(f'Fetched {len(all_events)} total events from Ticketmaster'))
            print(f"DEBUG: Ticketmaster returned {len(all_events)} events across {page} pages")
            orioles_count = len([e for e in all_events if 'orioles' in e.get('name', '').lower()])
            print(f"DEBUG: {orioles_count} Orioles games in response")
            if len(all_events) > 0:
                print(f"DEBUG: First event date: {all_events[0]['dates']['start'].get('dateTime', 'N/A')}")
                print(f"DEBUG: Last event date: {all_events[-1]['dates']['start'].get('dateTime', 'N/A')}")

            imported_count = 0

            for event_data in all_events:
                try:
                    # Extract event ID first
                    external_id = f"tm_{event_data['id']}"

                    # Check if event already exists - if so, skip geocoding!
                    if ExternalEvent.objects.filter(external_id=external_id).exists():
                        # Event already exists, just update it without re-geocoding
                        existing_event = ExternalEvent.objects.get(external_id=external_id)
                        existing_event.is_active = True  # Mark as still active
                        existing_event.save()
                        continue

                    # NEW EVENT - geocode it
                    # Get venue info
                    venue = event_data['_embedded']['venues'][0]
                    venue_address = venue.get('address', {}).get('line1', '')
                    venue_city = venue.get('city', {}).get('name', 'Baltimore')
                    venue_state = venue.get('state', {}).get('stateCode', 'MD')

                    # Use Google Geocoding for accurate coordinates
                    lat, lng = self.geocode_address(venue_address, venue_city, venue_state)

                    # Fallback to Ticketmaster coordinates if geocoding fails
                    if lat is None or lng is None:
                        lat = float(venue['location']['latitude'])
                        lng = float(venue['location']['longitude'])
                        self.stdout.write(self.style.WARNING(f'Using Ticketmaster coords for {venue["name"]}'))
                    else:
                        self.stdout.write(self.style.SUCCESS(f'✓ Geocoded {venue["name"]}'))

                    # Small delay to avoid hitting rate limits (50 requests/sec limit)
                    time.sleep(0.02)  # 50ms delay = ~20 requests/sec

                    # Map Ticketmaster categories to our categories
                    category = self.map_ticketmaster_category(event_data.get('classifications', []))

                    # Get image
                    image_url = None
                    if 'images' in event_data and len(event_data['images']) > 0:
                        image_url = event_data['images'][0]['url']

                    # Create or update event
                    event, created = ExternalEvent.objects.update_or_create(
                        external_id=external_id,
                        defaults={
                            'source': 'ticketmaster',
                            'title': event_data['name'],
                            'description': event_data.get('info', ''),
                            'category': category,
                            'venue_name': venue['name'],
                            'address': venue_address,
                            'city': venue_city,
                            'state': venue_state,
                            'latitude': lat,
                            'longitude': lng,
                            'start_time': datetime.fromisoformat(event_data['dates']['start']['dateTime'].replace('Z', '+00:00')),
                            'end_time': datetime.fromisoformat(event_data['dates']['start']['dateTime'].replace('Z', '+00:00')) if 'end' in event_data['dates'] else None,
                            'image_url': image_url,
                            'external_url': event_data['url'],
                            'ticket_url': event_data['url'],  # Can add affiliate tracking later
                            'is_active': True
                        }
                    )

                    if created:
                        imported_count += 1

                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error importing event {event_data.get("id")}: {str(e)}'))
                    continue

            return imported_count

        except requests.exceptions.RequestException as e:
            self.stdout.write(self.style.ERROR(f'API request failed: {str(e)}'))
            return 0

    def import_eventbrite(self, days_ahead):
        """Import events from Eventbrite API"""
        api_token = settings.EVENTBRITE_API_TOKEN
        url = 'https://www.eventbriteapi.com/v3/destination/events/'

        headers = {
            'Authorization': f'Bearer {api_token}'
        }

        # Use city search instead of location.address
        params = {
            'city': 'Baltimore',
            'state': 'MD',
            'country': 'US',
            'page_size': 50,
            'expand': 'venue'
        }

        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            if 'events' not in data:
                self.stdout.write(self.style.WARNING('No events found'))
                return 0

            events = data['events']
            imported_count = 0

            for event_data in events:
                try:
                    external_id = f"eb_{event_data['id']}"

                    # Get venue
                    venue = event_data.get('venue', {}) if 'venue' in event_data else {}

                    # Skip if no location data
                    if not venue or 'latitude' not in venue or 'longitude' not in venue:
                        continue

                    # Map category
                    category = self.map_eventbrite_category(event_data.get('category', {}))

                    # Create or update
                    event, created = ExternalEvent.objects.update_or_create(
                        external_id=external_id,
                        defaults={
                            'source': 'eventbrite',
                            'title': event_data['name']['text'],
                            'description': event_data.get('description', {}).get('text', ''),
                            'category': category,
                            'venue_name': venue.get('name', 'TBD'),
                            'address': venue.get('address', {}).get('localized_address_display', ''),
                            'city': venue.get('address', {}).get('city', 'Baltimore'),
                            'state': venue.get('address', {}).get('region', 'MD'),
                            'latitude': float(venue['latitude']),
                            'longitude': float(venue['longitude']),
                            'start_time': datetime.fromisoformat(event_data['start']['utc'].replace('Z', '+00:00')),
                            'end_time': datetime.fromisoformat(event_data['end']['utc'].replace('Z', '+00:00')) if 'end' in event_data else None,
                            'image_url': event_data.get('logo', {}).get('url'),
                            'external_url': event_data['url'],
                            'ticket_url': event_data['url'],
                            'is_active': True
                        }
                    )

                    if created:
                        imported_count += 1

                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error importing event {event_data.get("id")}: {str(e)}'))
                    continue

            return imported_count

        except requests.exceptions.RequestException as e:
            self.stdout.write(self.style.ERROR(f'API request failed: {str(e)}'))
            return 0

    def map_ticketmaster_category(self, classifications):
        """Map Ticketmaster categories to Huddll categories"""
        if not classifications:
            return 'social'

        segment = classifications[0].get('segment', {}).get('name', '').lower()
        genre = classifications[0].get('genre', {}).get('name', '').lower()

        # Map to our categories: food, sports, nightlife, arts, music, social
        if 'music' in segment or 'concert' in genre:
            return 'music'
        elif 'sports' in segment:
            return 'sports'
        elif 'arts' in segment or 'theatre' in segment:
            return 'arts'
        elif 'film' in segment:
            return 'arts'
        else:
            return 'nightlife'  # Default for entertainment events

    def map_eventbrite_category(self, category):
        """Map Eventbrite categories to Huddll categories"""
        if not category:
            return 'social'

        name = category.get('name', '').lower()

        if 'music' in name:
            return 'music'
        elif 'sports' in name or 'fitness' in name:
            return 'sports'
        elif 'food' in name or 'drink' in name:
            return 'food'
        elif 'art' in name or 'film' in name or 'media' in name:
            return 'arts'
        elif 'nightlife' in name or 'hobbies' in name:
            return 'nightlife'
        else:
            return 'social'