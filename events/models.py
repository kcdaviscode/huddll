from django.db import models
from django.contrib.auth import get_user_model
from math import radians, sin, cos, sqrt, atan2

User = get_user_model()


class Event(models.Model):
    CATEGORY_CHOICES = [
        ('food', 'Food & Drink'),
        ('sports', 'Sports & Fitness'),
        ('nightlife', 'Nightlife'),
        ('arts', 'Arts & Culture'),
        ('music', 'Music'),
        ('social', 'Social'),
    ]

    SUBCATEGORY_CHOICES = [
        # Sports
        ('basketball', 'Basketball'),
        ('soccer', 'Soccer/Football'),
        ('golf', 'Golf'),
        ('tennis', 'Tennis/Racquet Sports'),
        ('running', 'Running/Jogging'),
        ('cycling', 'Cycling'),
        ('hiking', 'Hiking'),
        ('gym', 'Gym/Weightlifting'),
        ('yoga', 'Yoga/Pilates'),
        ('swimming', 'Swimming'),
        ('pickup_games', 'Pickup Games'),

        # Food & Drink
        ('coffee', 'Coffee'),
        ('brunch', 'Brunch'),
        ('dinner', 'Dinner'),
        ('happy_hour', 'Happy Hour'),
        ('food_tour', 'Food Tour'),
        ('cooking', 'Cooking Together'),

        # Nightlife
        ('bar_hopping', 'Bar Hopping'),
        ('club', 'Club/Dancing'),
        ('live_music', 'Live Music Venue'),
        ('karaoke', 'Karaoke'),
        ('trivia', 'Trivia Night'),

        # Arts
        ('museums', 'Museums'),
        ('gallery', 'Gallery Opening'),
        ('theater', 'Theater/Performance'),
        ('art_class', 'Art Class/Workshop'),
        ('photo_walk', 'Photography Walk'),

        # Music
        ('concert', 'Concert'),
        ('open_mic', 'Open Mic'),
        ('jam_session', 'Jam Session'),
        ('music_festival', 'Music Festival'),
        ('dj_night', 'DJ Night'),

        # Social
        ('game_night', 'Game Night'),
        ('book_club', 'Book Club'),
        ('study', 'Study Session'),
        ('coworking', 'Coworking'),
        ('networking', 'Networking'),
        ('hangout', 'Just Hangout'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    # Basic Info
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    subcategory = models.CharField(max_length=50, choices=SUBCATEGORY_CHOICES, blank=True, null=True)

    # Location
    venue_name = models.CharField(max_length=200)
    address = models.CharField(max_length=300)
    city = models.CharField(max_length=100)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)

    # Time
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    # Settings
    max_attendees = models.IntegerField(null=True, blank=True)
    min_attendees = models.IntegerField(null=True, blank=True, default=3)
    check_in_radius = models.IntegerField(default=100, help_text="Check-in radius in meters")

    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_events')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='published')
    image = models.ImageField(upload_to='event_images/', null=True, blank=True)

    class Meta:
        ordering = ['-start_time']

    def __str__(self):
        return f"{self.title} at {self.venue_name}"

    def attendee_count(self):
        """Returns the number of checked-in attendees plus the creator"""
        return self.checkins.filter(verified=True).count() + 1

    def interested_count(self):
        """Returns the number of users who marked interest"""
        return self.interests.count()

    def can_check_in(self, user_lat, user_lng):
        """
        Validates if a user can check in based on:
        1. Distance from venue
        2. Time window (event hasn't ended)
        """
        # Calculate distance using Haversine formula
        venue_lat = float(self.latitude)
        venue_lng = float(self.longitude)

        R = 6371000  # Earth's radius in meters

        lat1 = radians(venue_lat)
        lat2 = radians(user_lat)
        delta_lat = radians(user_lat - venue_lat)
        delta_lng = radians(user_lng - venue_lng)

        a = sin(delta_lat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(delta_lng / 2) ** 2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        distance = R * c

        # Check if within radius
        if distance > self.check_in_radius:
            return False, f"You must be within {self.check_in_radius}m of the venue to check in"

        # Check if event hasn't ended
        from django.utils import timezone
        if timezone.now() > self.end_time:
            return False, "This event has already ended"

        return True, "Check-in successful"


class EventInterest(models.Model):
    """Users can mark interest in events without checking in"""
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='interests')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interested_events')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['event', 'user']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} interested in {self.event.title}"


class CheckIn(models.Model):
    """Records when users check in at an event location"""
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='checkins')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='checkins')
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    checked_in_at = models.DateTimeField(auto_now_add=True)
    verified = models.BooleanField(default=True)

    class Meta:
        unique_together = ['event', 'user']
        ordering = ['-checked_in_at']

    def __str__(self):
        return f"{self.user.username} checked in to {self.event.title}"


class EventChat(models.Model):
    """Chat messages for an event"""
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_messages')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.user.username} in {self.event.title}: {self.message[:50]}"


# ============================================================================
# EXTERNAL EVENTS (Ticketmaster, Eventbrite)
# ============================================================================

class ExternalEvent(models.Model):
    """
    Events imported from external sources (Ticketmaster, Eventbrite)
    These seed the map with real events, users can create Huddlls around them
    """

    SOURCE_CHOICES = [
        ('ticketmaster', 'Ticketmaster'),
        ('eventbrite', 'Eventbrite'),
    ]

    # External identifiers
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    external_id = models.CharField(max_length=200, unique=True)  # Unique ID from source API

    # Event details
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=50)  # Map to our categories: food, sports, nightlife, etc.

    # Location
    venue_name = models.CharField(max_length=200)
    address = models.CharField(max_length=300, blank=True, null=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=50)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)

    # Timing
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(blank=True, null=True)

    # Media
    image_url = models.URLField(blank=True, null=True)

    # Links
    external_url = models.URLField()  # Link to Ticketmaster/Eventbrite page
    ticket_url = models.URLField(blank=True, null=True)  # Direct ticket purchase link

    # Metadata
    is_active = models.BooleanField(default=True)  # Hide events that have passed or been cancelled
    imported_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)

    # Stats (optional - for caching)
    view_count = models.IntegerField(default=0)
    huddll_count = models.IntegerField(default=0)  # How many Huddlls created around this event

    class Meta:
        ordering = ['start_time']
        indexes = [
            models.Index(fields=['source', 'external_id']),
            models.Index(fields=['start_time', 'is_active']),
            models.Index(fields=['latitude', 'longitude']),
        ]

    def __str__(self):
        return f"{self.title} ({self.source})"

    def to_dict(self):
        """Serialize for API response"""
        return {
            'id': self.id,
            'source': self.source,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'venue_name': self.venue_name,
            'address': self.address,
            'city': self.city,
            'latitude': float(self.latitude),
            'longitude': float(self.longitude),
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'image_url': self.image_url,
            'external_url': self.external_url,
            'ticket_url': self.ticket_url,
            'huddll_count': self.huddll_count,
            'type': 'external'  # Flag to distinguish from user-created events
        }


class HuddllForExternalEvent(models.Model):
    """
    When users create a Huddll around an external event, we link them
    This allows friend groups to plan attendance together
    """
    external_event = models.ForeignKey(ExternalEvent, on_delete=models.CASCADE, related_name='huddlls')
    huddll_event = models.OneToOneField(Event, on_delete=models.CASCADE)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    # Group settings
    is_private = models.BooleanField(default=False)  # Only visible to friends

    class Meta:
        unique_together = ['external_event', 'huddll_event']

    def __str__(self):
        return f"Huddll for {self.external_event.title}"