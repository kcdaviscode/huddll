from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('event_rsvp', 'Event RSVP'),
        ('event_unrsvp', 'Event Un-RSVP'),
        ('chat_message', 'Chat Message'),
        ('friend_request', 'Friend Request'),
        ('friend_accept', 'Friend Accept'),
        ('event_update', 'Event Update'),
    ]

    # Who receives this notification
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')

    # Type of notification
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)

    # Related objects (optional)
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, null=True, blank=True)
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True,
                                  related_name='sent_notifications')

    # Notification content
    message = models.TextField()

    # Status
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'read', '-created_at']),
        ]

    def __str__(self):
        return f"{self.type} for {self.user.username} - {'Read' if self.read else 'Unread'}"

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'message': self.message,
            'read': self.read,
            'created_at': self.created_at.isoformat(),
            'event': {
                'id': self.event.id,
                'title': self.event.title,
                'emoji': self.get_category_emoji(self.event.category)
            } if self.event else None,
            'from_user': {
                'id': self.from_user.id,
                'first_name': self.from_user.first_name,
                'last_name': self.from_user.last_name,
            } if self.from_user else None
        }

    @staticmethod
    def get_category_emoji(category):
        emoji_map = {
            'food': '🍔',
            'sports': '⚽',
            'nightlife': '🎉',
            'arts': '🎨',
            'music': '🎵',
            'social': '👥'
        }
        return emoji_map.get(category, '📍')