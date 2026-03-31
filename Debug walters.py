"""
Quick debug script — run from your huddll directory with venv active:
python debug_walters.py
"""
import re
import sys

sys.path.insert(0, '.')

import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'huddll.settings')
django.setup()

import requests
from bs4 import BeautifulSoup
from dateutil import parser as dateparser

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
}

for page in range(1, 4):
    url = 'https://thewalters.org/events/' if page == 1 else f'https://thewalters.org/events?page={page}&'
    print(f"\n=== PAGE {page}: {url} ===")
    resp = requests.get(url, headers=HEADERS, timeout=15)
    soup = BeautifulSoup(resp.text, 'lxml')

    h3_tags = soup.find_all('h3')
    print(f"Found {len(h3_tags)} h3 tags")

    for h3 in h3_tags:
        link = h3.find('a', href=re.compile(r'/event/'))
        if not link:
            continue
        title = link.get_text(strip=True)

        # Date from next sibling
        date_text = ''
        for sibling in h3.next_siblings:
            if not hasattr(sibling, 'get_text'):
                continue
            text = sibling.get_text(strip=True)
            if re.search(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Mon|Tue|Wed|Thu|Fri|Sat|Sun)', text, re.I):
                date_text = text
                break

        # Try to parse
        parsed = None
        try:
            parsed = dateparser.parse(date_text, fuzzy=True)
        except:
            pass

        print(f"  TITLE: {title[:50]}")
        print(f"  DATE TEXT: '{date_text}'")
        print(f"  PARSED: {parsed}")
        print()