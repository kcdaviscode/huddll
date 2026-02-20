from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q, Max
from .models import ChatMessage, ChatReadStatus
from events.models import Event


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_counts(request):
    """
    Get unread message counts for all events the user is involved in
    Returns dict of event_id: unread_count
    """
    user = request.user

    # Get all events where user is creator or interested
    user_events = Event.objects.filter(
        Q(created_by=user) | Q(eventinterest__user=user)
    ).distinct()

    unread_counts = {}

    for event in user_events:
        # Get user's last read timestamp for this event
        read_status = ChatReadStatus.objects.filter(user=user, event=event).first()

        if read_status:
            # Count messages after last read time
            unread = ChatMessage.objects.filter(
                event=event,
                created_at__gt=read_status.last_read_at
            ).exclude(user=user).count()  # Don't count own messages
        else:
            # Never read - count all messages except own
            unread = ChatMessage.objects.filter(event=event).exclude(user=user).count()

        if unread > 0:
            unread_counts[event.id] = unread

    return Response({'unread_counts': unread_counts})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_chat_read(request, event_id):
    """
    Mark chat as read for a specific event
    Updates the last_read_at timestamp
    """
    user = request.user

    try:
        event = Event.objects.get(id=event_id)
    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=404)

    # Create or update read status
    ChatReadStatus.objects.update_or_create(
        user=user,
        event=event,
        defaults={'last_read_at': None}  # auto_now will set current time
    )

    return Response({'success': True})