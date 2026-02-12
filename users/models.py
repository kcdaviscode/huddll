from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model with profile fields"""

    bio = models.TextField(max_length=500, blank=True)
    profile_photo = models.ImageField(upload_to='profile_photos/', blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    city = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)  # NEW FIELD
    status_message = models.CharField(max_length=200, default="Open to suggestions", blank=True)
    status_updated_at = models.DateTimeField(auto_now=True)

    PRIVACY_CHOICES = [
        ('public', 'Public'),
        ('events', 'Event Attendees'),
        ('connections', 'Connections Only'),
    ]
    profile_privacy = models.CharField(max_length=20, choices=PRIVACY_CHOICES, default='events')
    show_future_events = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username

    @property
    def age(self):
        if self.date_of_birth:
            from datetime import date
            today = date.today()
            return today.year - self.date_of_birth.year - (
                    (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
            )
        return None

    @property
    def events_attended(self):
        from events.models import CheckIn
        return CheckIn.objects.filter(user=self, verified=True).count()

    @property
    def events_hosted(self):
        from events.models import Event
        return Event.objects.filter(created_by=self).count()


class Interest(models.Model):
    """Interest tags for user profiles"""

    name = models.CharField(max_length=50, unique=True)
    CATEGORY_CHOICES = [
        ('sports', 'Sports & Fitness'),
        ('arts', 'Arts & Culture'),
        ('food', 'Food & Drink'),
        ('outdoors', 'Outdoors & Adventure'),
        ('music', 'Music'),
        ('games', 'Games & Gaming'),
        ('social', 'Social'),
        ('learning', 'Learning & Education'),
        ('other', 'Other'),
    ]
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)

    def __str__(self):
        return self.name


class UserInterest(models.Model):
    """Link users to their interests"""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interests')
    interest = models.ForeignKey(Interest, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'interest']

    def __str__(self):
        return f"{self.user.username} - {self.interest.name}"