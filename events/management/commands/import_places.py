import time
import requests
from django.core.management.base import BaseCommand
from django.conf import settings
from events.models import PlaceCache

PLACE_TYPES = {
    'bars': {'google_type': 'bar', 'model_type': 'bar', 'label': 'Bars'},
    'restaurants': {'google_type': 'restaurant', 'model_type': 'restaurant', 'label': 'Restaurants'},
    'parks': {'google_type': 'park', 'model_type': 'park', 'label': 'Parks'},
    'venues': {'google_type': 'event_venue', 'model_type': 'event_venue', 'label': 'Event Venues'},
}

SEARCH_CENTERS = [
    {'lat': 39.2904, 'lng': -76.6122, 'name': 'Downtown'},
    {'lat': 39.3280, 'lng': -76.6219, 'name': 'Hampden/Remington'},
    {'lat': 39.2840, 'lng': -76.5920, 'name': 'Fells Point/Canton'},
    {'lat': 39.2780, 'lng': -76.6280, 'name': 'Federal Hill'},
    {'lat': 39.3100, 'lng': -76.6100, 'name': 'Charles Village'},
]

def fetch_nearby(api_key, location, place_type, radius=3000):
    url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
    results = []
    params = {'location': f"{location['lat']},{location['lng']}", 'radius': radius, 'type': place_type, 'key': api_key}
    while len(results) < 60:
        resp = requests.get(url, params=params, timeout=15).json()
        if resp.get('status') not in ('OK', 'ZERO_RESULTS'):
            break
        results.extend(resp.get('results', []))
        token = resp.get('next_page_token')
        if not token:
            break
        time.sleep(2)
        params = {'pagetoken': token, 'key': api_key}
    return results

class Command(BaseCommand):
    help = 'Import places from Google Places API into local cache'

    def add_arguments(self, parser):
        parser.add_argument('--types', nargs='+', default=list(PLACE_TYPES.keys()))
        parser.add_argument('--radius', type=int, default=3000)
        parser.add_argument('--clear', action='store_true')

    def handle(self, *args, **options):
        api_key = getattr(settings, 'GOOGLE_MAPS_API_KEY', None)
        if not api_key:
            self.stderr.write('GOOGLE_MAPS_API_KEY not found in settings.py')
            return

        types_to_import = options['types']
        radius = options['radius']

        if options['clear']:
            PlaceCache.objects.filter(place_type__in=[PLACE_TYPES[t]['model_type'] for t in types_to_import]).delete()

        self.stdout.write(f'\nImporting {len(types_to_import)} type(s) from {len(SEARCH_CENTERS)} neighborhoods...\n')
        total_new = total_updated = 0

        for type_key in types_to_import:
            config = PLACE_TYPES[type_key]
            self.stdout.write(f'  📍 {config["label"]}...')
            type_new = type_updated = 0

            for center in SEARCH_CENTERS:
                try:
                    results = fetch_nearby(api_key, center, config['google_type'], radius)
                    for place in results:
                        try:
                            geo = place.get('geometry', {}).get('location', {})
                            lat, lng = geo.get('lat'), geo.get('lng')
                            if not lat or not lng:
                                continue
                            photos = place.get('photos', [])
                            photo_ref = photos[0].get('photo_reference') if photos else None
                            photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference={photo_ref}&key={api_key}" if photo_ref else None
                            place_id = place.get('place_id', '')
                            obj, created = PlaceCache.objects.update_or_create(
                                place_id=place_id,
                                defaults={
                                    'name': place.get('name', '')[:200],
                                    'place_type': config['model_type'],
                                    'address': place.get('vicinity', '')[:300],
                                    'latitude': lat, 'longitude': lng,
                                    'rating': place.get('rating'),
                                    'rating_count': place.get('user_ratings_total'),
                                    'price_level': place.get('price_level'),
                                    'is_open_now': place.get('opening_hours', {}).get('open_now'),
                                    'photo_url': photo_url,
                                    'google_maps_url': f"https://www.google.com/maps/place/?q=place_id:{place_id}",
                                    'is_active': True,
                                }
                            )
                            if created: type_new += 1
                            else: type_updated += 1
                        except Exception:
                            continue
                    time.sleep(1)
                except Exception as e:
                    self.stdout.write(f'    ❌ {center["name"]}: {e}')

            total_new += type_new
            total_updated += type_updated
            self.stdout.write(self.style.SUCCESS(f'     ✅ {type_new} new, {type_updated} updated'))

        self.stdout.write(self.style.SUCCESS(f'\nDone! {total_new} new • {total_updated} updated\nRun again anytime to refresh.'))
