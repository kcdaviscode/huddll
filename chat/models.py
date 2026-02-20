from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ChatMessage(models.Model):
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.user.username} in {self.event.title}: {self.message[:50]}"

    # ADD THIS METHOD:
    def to_dict(self):
        return {
            'id': self.id,
            'message': self.message,
            'created_at': self.created_at.isoformat(),
            'user': {
                'id': self.user.id,
                'username': self.user.username,
                'first_name': self.user.first_name,
                'last_name': self.user.last_name,
            }
        }

class ChatReadStatus(models.Model):
    """Track when a user last read chat for an event"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE)
    last_read_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'event']
        indexes = [
            models.Index(fields=['user', 'event']),
        ]

    def __str__(self):
        return f"{self.user.username} last read {self.event.title} at {self.last_read_at}"