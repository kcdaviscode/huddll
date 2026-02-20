from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from events.models import EventInterest
from chat.models import ChatMessage
from .models import Notification


@receiver(post_save, sender=EventInterest)
def create_rsvp_notification(sender, instance, created, **kwargs):
    """
    When someone RSVPs to an event, notify the event creator
    """
    if created:
        event = instance.event
        user = instance.user

        # Don't notify if the creator is RSVPing to their own event
        if event.created_by_id == user.id:
            return

        # Create notification for event creator
        Notification.objects.create(
            user_id=event.created_by_id,
            type='event_rsvp',
            event=event,
            from_user=user,
            message=f"{user.first_name} {user.last_name} is going to {event.title}"
        )


@receiver(post_delete, sender=EventInterest)
def create_unrsvp_notification(sender, instance, **kwargs):
    """
    When someone un-RSVPs from an event, notify the event creator
    """
    event = instance.event
    user = instance.user

    # Don't notify if the creator is un-RSVPing from their own event
    if event.created_by_id == user.id:
        return

    # Create notification for event creator
    Notification.objects.create(
        user_id=event.created_by_id,
        type='event_unrsvp',
        event=event,
        from_user=user,
        message=f"{user.first_name} {user.last_name} can't make it to {event.title}"
    )


@receiver(post_save, sender=ChatMessage)
def create_chat_notification(sender, instance, created, **kwargs):
    """
    When someone sends a chat message, notify all other attendees
    """
    if not created:
        return

    event = instance.event
    sender_user = instance.user

    # Get all users interested in this event (excluding the sender)
    interested_users = event.interests.exclude(user=sender_user).values_list('user_id', flat=True)

    # Create notification for each interested user
    notifications_to_create = []
    for user_id in interested_users:
        notifications_to_create.append(
            Notification(
                user_id=user_id,
                type='chat_message',
                event=event,
                from_user=sender_user,
                message=f"{sender_user.first_name}: {instance.message[:50]}{'...' if len(instance.message) > 50 else ''}"
            )
        )

    # Bulk create for efficiency
    if notifications_to_create:
        Notification.objects.bulk_create(notifications_to_create)