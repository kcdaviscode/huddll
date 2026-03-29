"""
Eventbrite API Cost Estimation Script
Tests API integration and estimates daily costs before full implementation
"""

import requests
from datetime import datetime, timedelta
import json

# Your Eventbrite credentials
EVENTBRITE_TOKEN = 'JHKQVGVI7SOTKCN7JK3Y'
BASE_URL = 'https://www.eventbriteapi.com/v3'

# Test parameters
TEST_REGIONS = {
    'Baltimore': {'lat': 39.2904, 'lng': -76.6122, 'radius': '25mi'},
    'DC': {'lat': 38.9072, 'lng': -77.0369, 'radius': '20mi'},
    'Annapolis': {'lat': 38.9784, 'lng': -76.4922, 'radius': '15mi'}
}

DAYS_AHEAD = 3  # Test with 3 days first


def test_eventbrite_connection():
    """Test basic Eventbrite API connection"""
    print("=" * 60)
    print("TESTING EVENTBRITE API CONNECTION")
    print("=" * 60)

    headers = {
        'Authorization': f'Bearer {EVENTBRITE_TOKEN}'
    }

    try:
        response = requests.get(f'{BASE_URL}/users/me/', headers=headers)

        if response.status_code == 200:
            user_data = response.json()
            print(f"✅ Connection successful!")
            print(f"   Account: {user_data.get('name', 'N/A')}")
            print(f"   Email: {user_data.get('email', 'N/A')}")
            return True
        else:
            print(f"❌ Connection failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def search_events_by_location(location_name, lat, lng, radius, days_ahead=3):
    """Search for events in a specific location"""

    headers = {
        'Authorization': f'Bearer {EVENTBRITE_TOKEN}'
    }

    # Calculate date range
    start_date = datetime.now().isoformat() + 'Z'
    end_date = (datetime.now() + timedelta(days=days_ahead)).isoformat() + 'Z'

    params = {
        'location.latitude': lat,
        'location.longitude': lng,
        'location.within': radius,
        'start_date.range_start': start_date,
        'start_date.range_end': end_date,
        'expand': 'venue',  # Get venue details too
    }

    print(f"\n📍 Searching {location_name}...")
    print(f"   Coordinates: ({lat}, {lng})")
    print(f"   Radius: {radius}")
    print(f"   Date range: {days_ahead} days")

    try:
        response = requests.get(
            f'{BASE_URL}/events/search/',
            headers=headers,
            params=params
        )

        if response.status_code == 200:
            data = response.json()
            events = data.get('events', [])
            pagination = data.get('pagination', {})

            print(f"   ✅ Found {len(events)} events")
            print(f"   Total available: {pagination.get('object_count', 0)}")

            return events, pagination
        else:
            print(f"   ❌ Search failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return [], {}

    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return [], {}


def analyze_venues(events):
    """Analyze venue data to estimate geocoding needs"""

    unique_venues = {}
    venues_need_geocoding = []

    for event in events:
        venue = event.get('venue')

        if venue and venue.get('id'):
            venue_id = venue['id']

            if venue_id not in unique_venues:
                unique_venues[venue_id] = {
                    'name': venue.get('name', 'Unknown'),
                    'address': venue.get('address', {}),
                    'has_coordinates': bool(
                        venue.get('latitude') and venue.get('longitude')
                    )
                }

                # Check if we need to geocode
                if not unique_venues[venue_id]['has_coordinates']:
                    venues_need_geocoding.append(venue_id)

    return unique_venues, venues_need_geocoding


def estimate_costs(total_events, unique_venues, venues_need_geocoding):
    """Estimate API costs"""

    print("\n" + "=" * 60)
    print("COST ESTIMATION")
    print("=" * 60)

    # Google Geocoding: $5 per 1,000 requests
    geocoding_cost = (len(venues_need_geocoding) / 1000) * 5

    # Eventbrite is FREE (2,000 calls/hour limit)
    eventbrite_cost = 0

    # Foursquare (if we use it): FREE for first 10k calls
    foursquare_cost = 0

    print(f"\n📊 API CALL BREAKDOWN:")
    print(f"   Eventbrite API calls: {total_events} events (FREE)")
    print(f"   Unique venues found: {len(unique_venues)}")
    print(f"   Venues need geocoding: {len(venues_need_geocoding)}")
    print(f"   Venues already have coordinates: {len(unique_venues) - len(venues_need_geocoding)}")

    print(f"\n💰 COST ESTIMATE (for this test):")
    print(f"   Eventbrite: $0.00 (FREE)")
    print(f"   Google Geocoding: ${geocoding_cost:.4f}")
    print(f"   Foursquare: $0.00 (FREE tier)")
    print(f"   Total: ${geocoding_cost:.4f}")

    return geocoding_cost


def project_monthly_costs(daily_events, daily_new_venues, days_ahead_production=14):
    """Project costs for full production"""

    print("\n" + "=" * 60)
    print("MONTHLY COST PROJECTION")
    print("=" * 60)

    # Scale from 3-day test to 14-day production
    scale_factor = days_ahead_production / 3

    monthly_events = daily_events * 30
    monthly_new_venues = daily_new_venues * 30

    # Costs
    monthly_geocoding_cost = (monthly_new_venues / 1000) * 5
    monthly_eventbrite_cost = 0  # FREE
    monthly_foursquare_cost = 0  # Assuming < 10k calls

    total_monthly = monthly_geocoding_cost

    print(f"\n📈 PRODUCTION ESTIMATES (14-day lookahead, daily pulls):")
    print(f"   Events per day: ~{daily_events * scale_factor:.0f}")
    print(f"   Events per month: ~{monthly_events * scale_factor:.0f}")
    print(f"   New venues per month: ~{monthly_new_venues}")
    print(f"   Geocoding calls/month: ~{monthly_new_venues}")

    print(f"\n💵 ESTIMATED MONTHLY COSTS:")
    print(f"   Eventbrite API: $0.00 (FREE)")
    print(f"   Google Geocoding: ${monthly_geocoding_cost:.2f}")
    print(f"   Foursquare API: $0.00 (FREE tier)")
    print(f"   ─────────────────────────")
    print(f"   TOTAL: ${total_monthly:.2f}/month")

    if total_monthly <= 100:
        print(f"   ✅ WITHIN BUDGET ($100/month)")
    else:
        print(f"   ⚠️  EXCEEDS BUDGET by ${total_monthly - 100:.2f}")

    return total_monthly


def main():
    """Run the complete test"""

    print("\n🧪 EVENTBRITE API COST TEST")
    print(f"Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # Step 1: Test connection
    if not test_eventbrite_connection():
        print("\n❌ Stopping test - connection failed")
        return

    # Step 2: Search all regions
    all_events = []
    all_venues = {}
    all_need_geocoding = []

    for location, config in TEST_REGIONS.items():
        events, pagination = search_events_by_location(
            location,
            config['lat'],
            config['lng'],
            config['radius'],
            DAYS_AHEAD
        )

        all_events.extend(events)

        # Analyze venues
        unique_venues, need_geocoding = analyze_venues(events)

        # Merge into all venues
        for venue_id, venue_data in unique_venues.items():
            if venue_id not in all_venues:
                all_venues[venue_id] = venue_data
                if venue_id in need_geocoding:
                    all_need_geocoding.append(venue_id)

    # Step 3: Show summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Total events found (3 days): {len(all_events)}")
    print(f"Unique venues: {len(all_venues)}")
    print(f"Venues needing geocoding: {len(all_need_geocoding)}")

    # Step 4: Estimate costs
    test_cost = estimate_costs(len(all_events), all_venues, all_need_geocoding)

    # Step 5: Project monthly costs
    daily_events = len(all_events) / 3  # Average per day
    daily_new_venues = len(all_need_geocoding) / 3

    monthly_cost = project_monthly_costs(daily_events, daily_new_venues)

    # Step 6: Show sample events
    print("\n" + "=" * 60)
    print("SAMPLE EVENTS (First 5)")
    print("=" * 60)

    for i, event in enumerate(all_events[:5], 1):
        print(f"\n{i}. {event.get('name', {}).get('text', 'Unknown Event')}")
        print(f"   URL: {event.get('url', 'N/A')}")
        print(f"   Start: {event.get('start', {}).get('local', 'N/A')}")
        venue = event.get('venue', {})
        if venue:
            print(f"   Venue: {venue.get('name', 'N/A')}")
            print(f"   Address: {venue.get('address', {}).get('localized_address_display', 'N/A')}")

    # Step 7: Recommendations
    print("\n" + "=" * 60)
    print("RECOMMENDATIONS")
    print("=" * 60)

    if monthly_cost < 50:
        print("✅ Costs are very low - safe to proceed!")
        print("   We can expand to full 14-day lookahead immediately.")
    elif monthly_cost < 100:
        print("✅ Costs are within budget - proceed with caution")
        print("   Monitor costs closely in first month.")
    else:
        print("⚠️  Costs may exceed budget")
        print("   Recommend reducing region size or days ahead.")

    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)


if __name__ == '__main__':
    main()