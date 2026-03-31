"""
Baltimore Local Venue Scraper
Scrapes events from independent Baltimore music venues and museums
and imports them into the ExternalEvent table.

Usage:
    python manage.py scrape_baltimore_venues
    python manage.py scrape_baltimore_venues --venue walters
    python manage.py scrape_baltimore_venues --dry-run

Venues:
    Music: ottobar, metro, the8x10, keystone, andiemusik, creativealliance
    Museums: walters, bma, mdhs, avm

Install dependencies first:
    pip install requests beautifulsoup4 lxml --break-system-packages
"""

import re
import hashlib
import time
from datetime import datetime, timedelta
from dateutil import parser as dateparser
from django.core.management.base import BaseCommand
from django.utils import timezone

try:
    import requests
    from bs4 import BeautifulSoup
    SCRAPING_AVAILABLE = True
except ImportError:
    SCRAPING_AVAILABLE = False

from events.models import ExternalEvent


# ============================================================================
# VENUE REGISTRY — fixed coordinates, no geocoding needed
# ============================================================================

VENUES = {
    'walters': {
        'name': 'Walters Art Museum',
        'address': '600 N Charles St',
        'city': 'Baltimore',
        'state': 'MD',
        'lat': 39.2958,
        'lng': -76.6154,
        'url': 'https://thewalters.org/events/',
        'category': 'arts',
        'scraper': 'scrape_walters',
    },
    'bma': {
        'name': 'Baltimore Museum of Art',
        'address': '10 Art Museum Dr',
        'city': 'Baltimore',
        'state': 'MD',
        'lat': 39.326200,
        'lng': -76.623100,
        'url': 'https://artbma.org/events',
        'category': 'arts',
        'scraper': 'scrape_bma',
    },
    'ottobar': {
        'name': 'Ottobar',
        'address': '2549 N Howard St',
        'city': 'Baltimore',
        'state': 'MD',
        'lat': 39.322600,
        'lng': -76.638400,
        'url': 'https://theottobar.com/calendar/',
        'category': 'music',
        'scraper': 'scrape_ottobar',
    },
    'metro': {
        'name': 'Metro Baltimore',
        'address': '1700 N Charles St',
        'city': 'Baltimore',
        'state': 'MD',
        'lat': 39.310000,
        'lng': -76.619100,
        'url': 'https://metrobmore.com/',
        'category': 'music',
        'scraper': 'scrape_metro',
    },
    'the8x10': {
        'name': 'The 8x10',
        'address': '10 E Cross St',
        'city': 'Baltimore',
        'state': 'MD',
        'lat': 39.278400,
        'lng': -76.610600,
        'url': 'https://www.the8x10.com/events',
        'category': 'music',
        'scraper': 'scrape_the8x10',
    },
    'keystone': {
        'name': 'Keystone Korner Baltimore',
        'address': '1350 Lancaster St',
        'city': 'Baltimore',
        'state': 'MD',
        'lat': 39.284600,
        'lng': -76.595400,
        'url': 'https://www.keystonekornerbaltimore.com/calendar',
        'category': 'music',
        'scraper': 'scrape_keystone',
    },
    'andiemusik': {
        'name': 'An Die Musik Live',
        'address': '409 N Charles St',
        'city': 'Baltimore',
        'state': 'MD',
        'lat': 39.297500,
        'lng': -76.615200,
        'url': 'https://andiemusiklive.com/live-events/',
        'category': 'music',
        'scraper': 'scrape_andiemusik',
    },
    'creativealliance': {
        'name': 'Creative Alliance',
        'address': '3134 Eastern Ave',
        'city': 'Baltimore',
        'state': 'MD',
        'lat': 39.286900,
        'lng': -76.563700,
        'url': 'https://creativealliance.org/events/',
        'category': 'arts',
        'scraper': 'scrape_creativealliance',
    },
    'mdhs': {
        'name': 'Maryland Center for History and Culture',
        'address': '201 W Monument St',
        'city': 'Baltimore',
        'state': 'MD',
        'lat': 39.299700,
        'lng': -76.622600,
        'url': 'https://mdhs.org/events',
        'category': 'arts',
        'scraper': 'scrape_mdhs',
    },
    'avm': {
        'name': 'American Visionary Art Museum',
        'address': '800 Key Hwy',
        'city': 'Baltimore',
        'state': 'MD',
        'lat': 39.279200,
        'lng': -76.611800,
        'url': 'https://www.avam.org/events',
        'category': 'arts',
        'scraper': 'scrape_avm',
    },
}


# ============================================================================
# HELPERS
# ============================================================================

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                  'AppleWebKit/537.36 (KHTML, like Gecko) '
                  'Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}


def fetch_page(url):
    """Fetch a page and return BeautifulSoup object, or None on failure."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        return BeautifulSoup(resp.text, 'lxml')
    except Exception as e:
        return None


def make_event_id(source, title, start_time):
    """Generate a stable unique ID for deduplication."""
    key = f"{source}_{title}_{start_time}".lower()
    return hashlib.md5(key.encode()).hexdigest()[:20]


def parse_date(text):
    """Try to parse a date string into a datetime. Returns None if it fails."""
    if not text:
        return None
    try:
        text = re.sub(r'\s+', ' ', text.strip())

        # Walters concatenates date+time without space e.g. "Thu April 2, 20264 to 6 p.m."
        # Strip everything after the year
        year_match = re.search(r'(202\d)', text)
        if year_match:
            text = text[:year_match.end()].strip()

        dt = dateparser.parse(text, fuzzy=True)
        if dt and dt.year >= 2026:
            from django.utils.timezone import make_aware
            from datetime import timezone as tz
            if dt.tzinfo is None:
                dt = make_aware(dt)
            return dt
    except Exception:
        pass
    return None


def save_event(venue_key, venue, title, start_time, description='',
               image_url=None, event_url=None, end_time=None, dry_run=False):
    """Save or update an ExternalEvent. Returns (event, created) or None."""
    if not title or not start_time:
        return None

    # Skip past events
    if start_time < timezone.now():
        return None

    external_id = make_event_id(venue_key, title, str(start_time))

    if dry_run:
        return ('DRY_RUN', True)

    event, created = ExternalEvent.objects.update_or_create(
        external_id=external_id,
        defaults={
            'source': venue_key[:20],
            'title': title[:200],
            'description': description or '',
            'category': venue['category'],
            'venue_name': venue['name'],
            'address': venue['address'],
            'city': venue['city'],
            'state': venue['state'],
            'latitude': venue['lat'],
            'longitude': venue['lng'],
            'start_time': start_time,
            'end_time': end_time or (start_time + timedelta(hours=2)),
            'image_url': image_url,
            'external_url': event_url or venue['url'],
            'ticket_url': event_url,
            'is_active': True,
        }
    )
    return event, created


# ============================================================================
# VENUE SCRAPERS
# ============================================================================

def scrape_walters(venue, dry_run=False):
    """
    Walters Art Museum — custom WordPress theme with pagination.
    Scrapes multiple pages until no more events found.
    """
    events = []
    page = 1

    while page <= 10:
        url = venue['url'] if page == 1 else f"https://thewalters.org/events?page={page}&"
        soup = fetch_page(url)
        if not soup:
            break

        h3_tags = soup.find_all('h3')
        found_on_page = 0

        for h3 in h3_tags:
            link = h3.find('a', href=re.compile(r'/event/'))
            if not link:
                continue

            title = link.get_text(strip=True)
            event_url = link['href']
            if not event_url.startswith('http'):
                event_url = 'https://thewalters.org' + event_url

            # Image: look for <img> in any preceding sibling
            image_url = None
            for sibling in h3.previous_siblings:
                if not hasattr(sibling, 'find'):
                    continue
                img = sibling.find('img')
                if img and hasattr(img, 'get'):
                    image_url = img.get('src')
                    break

            # Date from next sibling
            date_text = ''
            for sibling in h3.next_siblings:
                if not hasattr(sibling, 'get_text'):
                    continue
                text = sibling.get_text(strip=True)
                if re.search(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Mon|Tue|Wed|Thu|Fri|Sat|Sun)',
                             text, re.I):
                    date_text = text
                    break

            start_time = parse_date(date_text)
            if not start_time:
                continue

            found_on_page += 1
            result = save_event(
                'walters', venue, title, start_time,
                image_url=image_url,
                event_url=event_url,
                dry_run=dry_run
            )
            if result:
                events.append((title, start_time, result[1]))

        # If this page had zero h3 event links at all, we've gone past the end
        if found_on_page == 0:
            break
        page += 1
        time.sleep(0.5)
        page += 1
        time.sleep(0.5)

    return events, None


def scrape_keystone(venue, dry_run=False):
    """
    Keystone Korner Baltimore — Squarespace site, calendar loads via JavaScript.
    Cannot be scraped with plain requests. Returns 0 events with explanation.
    """
    return [], 'Calendar loads via JavaScript (Squarespace) — needs Playwright to scrape'


def scrape_bma(venue, dry_run=False):
    """
    Baltimore Museum of Art — events page loads via JavaScript.
    Cannot be scraped with plain requests. Returns 0 events with explanation.
    """
    return [], 'Events page loads via JavaScript — needs Playwright to scrape'


def scrape_ottobar(venue, dry_run=False):
    """
    Ottobar calendar page. Each event has:
      <a href="/event/..."><img .../>Mon, Apr 02</a>  <- img anchor with date text
      <h2><a href="/event/...">Title</a></h2>          <- title follows
    """
    events = []
    soup = fetch_page(venue['url'])
    if not soup:
        return events, 'Failed to fetch page'

    from datetime import date as date_obj
    current_year = date_obj.today().year
    current_month = date_obj.today().month

    MONTH_MAP = {
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
        'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
    }

    # Find every anchor that wraps an event image — these have the date in their text
    seen_urls = set()
    for a_tag in soup.find_all('a', href=re.compile(r'/event/')):
        try:
            img = a_tag.find('img')
            if not img:
                continue

            text = a_tag.get_text(strip=True)
            m = re.search(
                r'(Mon|Tue|Wed|Thu|Fri|Sat|Sun)[,\s]+([A-Za-z]{3})\s+(\d{1,2})',
                text, re.I
            )
            if not m:
                continue

            month_key = m.group(2)[:3].lower()
            day = int(m.group(3))
            month_num = MONTH_MAP.get(month_key, 0)
            if not month_num:
                continue

            year = current_year
            if month_num < current_month - 1:
                year = current_year + 1

            start_time = parse_date(f"{m.group(2)} {day} {year}")
            if not start_time:
                continue

            event_url = a_tag['href']
            if not event_url.startswith('http'):
                event_url = 'https://theottobar.com' + event_url

            if event_url in seen_urls:
                continue
            seen_urls.add(event_url)

            image_url = img.get('src') or img.get('data-src')

            h2 = a_tag.find_next('h2')
            if not h2:
                continue
            title = h2.get_text(strip=True)
            if not title:
                continue

            h4 = h2.find_next('h4')
            description = h4.get_text(strip=True) if h4 else ''

            result = save_event(
                'ottobar', venue, title, start_time,
                description=description,
                image_url=image_url,
                event_url=event_url,
                dry_run=dry_run
            )
            if result:
                events.append((title, start_time, result[1]))
        except Exception:
            continue

    return events, None if events else 'No events parsed — structure may have changed'


def scrape_andiemusik(venue, dry_run=False):
    """
    An Die Musik — WordPress. Events appear as posts on the live-events page.
    """
    events = []
    soup = fetch_page(venue['url'])
    if not soup:
        return events, 'Failed to fetch page'

    # WordPress posts
    posts = soup.find_all(['article', 'div'], class_=re.compile(r'post|event|entry'))

    for post in posts:
        try:
            title_el = post.find(['h1', 'h2', 'h3', 'h4'])
            if not title_el:
                continue
            title = title_el.get_text(strip=True)
            if len(title) < 3:
                continue

            # Look for date in post metadata or title
            date_el = post.find(['time', 'span'], class_=re.compile(r'date|time|published'))
            date_text = ''
            if date_el:
                date_text = date_el.get('datetime', '') or date_el.get_text(strip=True)
            # An Die Musik often puts dates in the title/heading
            if not date_text:
                date_text = title
            start_time = parse_date(date_text)
            if not start_time:
                continue

            img = post.find('img')
            image_url = img.get('src') if img else None

            link = post.find('a', href=True)
            event_url = link['href'] if link else venue['url']

            result = save_event(
                'andiemusik', venue, title, start_time,
                image_url=image_url,
                event_url=event_url,
                dry_run=dry_run
            )
            if result:
                events.append((title, start_time, result[1]))
        except Exception:
            continue

    return events, None


def scrape_metro(venue, dry_run=False):
    """
    Metro Baltimore (metrobmore.com) — may use embedded ticketing widget.
    Falls back to generic event extraction.
    """
    events = []
    soup = fetch_page(venue['url'])
    if not soup:
        return events, 'Failed to fetch page — site may block scrapers'

    # Generic approach
    for tag in soup.find_all(['article', 'div', 'li'],
                              class_=re.compile(r'event|show|gig|performance')):
        try:
            title_el = tag.find(['h1', 'h2', 'h3', 'h4', 'strong'])
            if not title_el:
                continue
            title = title_el.get_text(strip=True)
            if len(title) < 3:
                continue

            date_el = tag.find(['time', 'span'], class_=re.compile(r'date|time'))
            date_text = date_el.get('datetime', '') or date_el.get_text(strip=True) if date_el else ''
            start_time = parse_date(date_text)
            if not start_time:
                continue

            img = tag.find('img')
            image_url = img.get('src') if img else None

            link = tag.find('a', href=True)
            event_url = link['href'] if link else venue['url']

            result = save_event(
                'metro', venue, title, start_time,
                image_url=image_url,
                event_url=event_url,
                dry_run=dry_run
            )
            if result:
                events.append((title, start_time, result[1]))
        except Exception:
            continue

    return events, None if events else 'No events found — site may load events via JavaScript'


def scrape_the8x10(venue, dry_run=False):
    """
    The 8x10 — uses DICE.fm for ticketing. Try their events page directly.
    """
    events = []
    soup = fetch_page(venue['url'])
    if not soup:
        return events, 'Failed to fetch page'

    for tag in soup.find_all(['article', 'div', 'li'],
                              class_=re.compile(r'event|show|gig')):
        try:
            title_el = tag.find(['h2', 'h3', 'h4', 'strong', 'a'])
            if not title_el:
                continue
            title = title_el.get_text(strip=True)
            if len(title) < 3:
                continue

            date_el = tag.find(['time', 'span'], class_=re.compile(r'date|time'))
            date_text = date_el.get('datetime', '') or date_el.get_text(strip=True) if date_el else ''
            start_time = parse_date(date_text)
            if not start_time:
                continue

            img = tag.find('img')
            image_url = img.get('src') if img else None
            link = tag.find('a', href=True)
            event_url = link['href'] if link else venue['url']

            result = save_event(
                'the8x10', venue, title, start_time,
                image_url=image_url,
                event_url=event_url,
                dry_run=dry_run
            )
            if result:
                events.append((title, start_time, result[1]))
        except Exception:
            continue

    return events, None if events else 'No events found — site may use JS ticketing widget'


def scrape_creativealliance(venue, dry_run=False):
    """
    Creative Alliance — WordPress with The Events Calendar (tribe_events).
    URL: creativealliance.org/events/
    Event links: /event/xxx/
    """
    events = []
    soup = fetch_page(venue['url'])
    if not soup:
        return events, 'Failed to fetch page'

    # Same h3 pattern as Walters — find h3 with /event/ links
    h3_tags = soup.find_all('h3')
    for h3 in h3_tags:
        link = h3.find('a', href=re.compile(r'/event/'))
        if not link:
            continue

        title = link.get_text(strip=True)
        if len(title) < 3:
            continue

        event_url = link['href']
        if not event_url.startswith('http'):
            event_url = 'https://creativealliance.org' + event_url

        # Date from next sibling
        date_text = ''
        for sibling in h3.next_siblings:
            if not hasattr(sibling, 'get_text'):
                continue
            text = sibling.get_text(strip=True)
            if re.search(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Mon|Tue|Wed|Thu|Fri|Sat|Sun)',
                         text, re.I):
                date_text = text
                break

        # Also check tribe_events time elements
        if not date_text:
            time_el = h3.find_next(['abbr', 'time', 'span'], class_=re.compile(r'tribe|date|time|dtstart'))
            if time_el:
                date_text = time_el.get('title', '') or time_el.get('datetime', '') or time_el.get_text(strip=True)

        start_time = parse_date(date_text)
        if not start_time:
            continue

        img = None
        for sibling in h3.previous_siblings:
            if not hasattr(sibling, 'find'):
                continue
            found = sibling.find('img')
            if found and hasattr(found, 'get'):
                img = found
                break
        image_url = img.get('src') if img else None

        result = save_event(
            'creativealliance', venue, title, start_time,
            image_url=image_url,
            event_url=event_url,
            dry_run=dry_run
        )
        if result:
            events.append((title, start_time, result[1]))

    return events, None


def scrape_mdhs(venue, dry_run=False):
    """
    Maryland Center for History and Culture — standard WordPress events.
    """
    events = []
    soup = fetch_page(venue['url'])
    if not soup:
        return events, 'Failed to fetch page'

    articles = soup.find_all(['article', 'div', 'li'],
                              class_=re.compile(r'event|post|tribe|item'))

    for article in articles:
        try:
            title_el = article.find(['h2', 'h3', 'h4'])
            if not title_el:
                continue
            title = title_el.get_text(strip=True)

            date_el = article.find(['time', 'span', 'abbr'],
                                    class_=re.compile(r'date|start|dtstart|time'))
            date_text = ''
            if date_el:
                date_text = date_el.get('datetime', '') or date_el.get_text(strip=True)
            start_time = parse_date(date_text)
            if not start_time:
                continue

            img = article.find('img')
            image_url = img.get('src') if img else None

            link = article.find('a', href=True)
            event_url = link['href'] if link else venue['url']
            if event_url and not event_url.startswith('http'):
                event_url = 'https://mdhs.org' + event_url

            result = save_event(
                'mdhs', venue, title, start_time,
                image_url=image_url,
                event_url=event_url,
                dry_run=dry_run
            )
            if result:
                events.append((title, start_time, result[1]))
        except Exception:
            continue

    return events, None


def scrape_avm(venue, dry_run=False):
    """
    American Visionary Art Museum — events page.
    """
    events = []
    soup = fetch_page(venue['url'])
    if not soup:
        return events, 'Failed to fetch page'

    for tag in soup.find_all(['article', 'div', 'li'],
                              class_=re.compile(r'event|post|item|card')):
        try:
            title_el = tag.find(['h2', 'h3', 'h4'])
            if not title_el:
                continue
            title = title_el.get_text(strip=True)

            date_el = tag.find(['time', 'span'], class_=re.compile(r'date|time'))
            date_text = date_el.get('datetime', '') or date_el.get_text(strip=True) if date_el else ''
            start_time = parse_date(date_text)
            if not start_time:
                continue

            img = tag.find('img')
            image_url = img.get('src') if img else None

            link = tag.find('a', href=True)
            event_url = link['href'] if link else venue['url']
            if event_url and not event_url.startswith('http'):
                event_url = 'https://www.avam.org' + event_url

            result = save_event(
                'avm', venue, title, start_time,
                image_url=image_url,
                event_url=event_url,
                dry_run=dry_run
            )
            if result:
                events.append((title, start_time, result[1]))
        except Exception:
            continue

    return events, None


# ============================================================================
# MANAGEMENT COMMAND
# ============================================================================

SCRAPER_MAP = {
    'walters': scrape_walters,
    'bma': scrape_bma,
    'ottobar': scrape_ottobar,
    'keystone': scrape_keystone,
    'andiemusik': scrape_andiemusik,
    'metro': scrape_metro,
    'the8x10': scrape_the8x10,
    'creativealliance': scrape_creativealliance,
    'mdhs': scrape_mdhs,
    'avm': scrape_avm,
}


class Command(BaseCommand):
    help = 'Scrape Baltimore local venues and museums for events'

    def add_arguments(self, parser):
        parser.add_argument(
            '--venue',
            type=str,
            default='all',
            help=f'Venue key to scrape. Options: all, {", ".join(VENUES.keys())}'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Print events without saving to database'
        )

    def handle(self, *args, **options):
        if not SCRAPING_AVAILABLE:
            self.stderr.write(self.style.ERROR(
                'Missing dependencies. Run:\n'
                'pip install requests beautifulsoup4 lxml python-dateutil --break-system-packages'
            ))
            return

        venue_key = options['venue']
        dry_run = options['dry_run']

        if venue_key == 'all':
            targets = VENUES
        elif venue_key in VENUES:
            targets = {venue_key: VENUES[venue_key]}
        else:
            self.stderr.write(self.style.ERROR(
                f'Unknown venue: {venue_key}\nOptions: {", ".join(VENUES.keys())}'
            ))
            return

        total_new = 0
        total_updated = 0
        total_skipped = 0

        self.stdout.write(self.style.SUCCESS(
            f'\n{"DRY RUN — " if dry_run else ""}Scraping {len(targets)} venue(s)...\n'
        ))

        for key, venue in targets.items():
            self.stdout.write(f'  📍 {venue["name"]}... ', ending='')
            self.stdout.flush()

            scraper_fn = SCRAPER_MAP.get(key)
            if not scraper_fn:
                self.stdout.write(self.style.WARNING('No scraper'))
                continue

            try:
                events, error = scraper_fn(venue, dry_run=dry_run)

                if error and not events:
                    self.stdout.write(self.style.WARNING(f'⚠️  {error}'))
                    total_skipped += 1
                    continue

                new_count = sum(1 for _, _, created in events if created)
                upd_count = sum(1 for _, _, created in events if not created)
                total_new += new_count
                total_updated += upd_count

                self.stdout.write(self.style.SUCCESS(
                    f'✅ {len(events)} events ({new_count} new, {upd_count} updated)'
                ))

                if dry_run:
                    for title, dt, _ in events[:5]:
                        self.stdout.write(f'     • {title[:60]} — {dt.strftime("%b %d %Y %I:%M%p")}')
                    if len(events) > 5:
                        self.stdout.write(f'     ... and {len(events) - 5} more')

                # Be polite to servers
                time.sleep(1)

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'❌ Error: {e}'))
                total_skipped += 1

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'Done! {total_new} new • {total_updated} updated • {total_skipped} venues skipped'
        ))

        if not dry_run and total_new > 0:
            self.stdout.write(
                f'\nEvents are now live on the map. '
                f'Run again anytime to pick up new listings.'
            )