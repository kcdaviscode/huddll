from django.db import models
from django.conf import settings


class Connection(models.Model):
    """Friend connections between users who met at an event"""

    user1 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='connections_initiated')
    user2 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='connections_received')

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('blocked', 'Blocked'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    met_at_event = models.ForeignKey('events.Event', on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='connections_made')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user1', 'user2']

    def __str__(self):
        return f"{self.user1.username} <-> {self.user2.username} ({self.status})"

    def save(self, *args, **kwargs):
        """Ensure user1 < user2 to prevent duplicates"""
        if self.user1.id and self.user2.id and self.user1.id > self.user2.id:
            self.user1, self.user2 = self.user2, self.user1
        super().save(*args, **kwargs)

    @classmethod
    def are_connected(cls, user1, user2):
        """Check if two users are connected"""
        connection = cls.objects.filter(
            models.Q(user1=user1, user2=user2) | models.Q(user1=user2, user2=user1)
        ).first()
        return connection and connection.status == 'accepted'


class Message(models.Model):
    """Direct messages between connected users"""

    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField(max_length=2000)
    read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username} -> {self.recipient.username}: {self.content[:50]}"


class Conversation(models.Model):
    """Helper model to track conversations between two users"""

    user1 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conversations_as_user1')
    user2 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conversations_as_user2')
    last_message_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user1', 'user2']
        ordering = ['-last_message_at']

    def __str__(self):
        return f"Conversation: {self.user1.username} & {self.user2.username}"