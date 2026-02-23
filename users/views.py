from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import User, UserInterest
from .serializers import (
    UserProfileSerializer, UserBasicSerializer, ProfileUpdateSerializer
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    """Get authenticated user's full profile data"""
    serializer = UserProfileSerializer(request.user, context={'request': request})
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update authenticated user's profile"""
    serializer = ProfileUpdateSerializer(
        request.user,
        data=request.data,
        partial=request.method == 'PATCH',
        context={'request': request}
    )

    if serializer.is_valid():
        serializer.save()
        # Return full profile data after update
        profile_serializer = UserProfileSerializer(request.user, context={'request': request})
        return Response(profile_serializer.data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friends(request):
    """Get user's friends list"""
    from connections.models import Connection

    # Get accepted connections
    connections = Connection.objects.filter(
        Q(user1=request.user, status='accepted') |
        Q(user2=request.user, status='accepted')
    ).select_related('user1', 'user2')

    # Extract friend users
    friends = []
    for conn in connections:
        friend = conn.user2 if conn.user1 == request.user else conn.user1
        friends.append(friend)

    serializer = UserBasicSerializer(friends, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_timeline(request):
    """Get activity feed of friends' events"""
    from connections.models import Connection
    from events.models import Event, EventInterest
    from django.utils import timezone
    from datetime import timedelta

    # Get friends
    friend_connections = Connection.objects.filter(
        Q(user1=request.user, status='accepted') |
        Q(user2=request.user, status='accepted')
    ).select_related('user1', 'user2')

    friend_ids = []
    for conn in friend_connections:
        friend = conn.user2 if conn.user1 == request.user else conn.user1
        friend_ids.append(friend.id)

    # Get recent activity (last 7 days)
    recent_date = timezone.now() - timedelta(days=7)

    # Get events friends have joined recently
    friend_activities = EventInterest.objects.filter(
        user_id__in=friend_ids,
        created_at__gte=recent_date
    ).select_related('user', 'event').order_by('-created_at')[:20]

    # Format activity feed
    timeline = []
    for activity in friend_activities:
        timeline.append({
            'id': activity.id,
            'user': {
                'id': activity.user.id,
                'name': f"{activity.user.first_name} {activity.user.last_name}" if activity.user.first_name else activity.user.username,
                'avatar': activity.user.first_name[0].upper() if activity.user.first_name else activity.user.username[0].upper(),
                'profile_photo': request.build_absolute_uri(activity.user.profile_photo.url) if activity.user.profile_photo else None
            },
            'event': {
                'id': activity.event.id,
                'emoji': get_category_emoji(activity.event.category),
                'name': activity.event.title,
                'venue': activity.event.venue_name,
                'start_time': activity.event.start_time,
                'image_url': activity.event.image.url if activity.event.image else None
            },
            'action': 'interested in',
            'time': format_time_ago(activity.created_at),
            'created_at': activity.created_at,
            'likes': 0,  # Placeholder for future likes feature
            'comments': 0  # Placeholder for future comments feature
        })

    return Response(timeline)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_events(request):
    """Get user's events (created + attending)"""
    from events.models import Event, EventInterest

    # Events user created
    created_events = Event.objects.filter(created_by=request.user)

    # Events user is interested in
    interested_event_ids = EventInterest.objects.filter(
        user=request.user
    ).values_list('event_id', flat=True)

    interested_events = Event.objects.filter(id__in=interested_event_ids)

    # Combine and deduplicate
    all_events = (created_events | interested_events).distinct().order_by('start_time')

    # Serialize events
    events_data = []
    for event in all_events:
        events_data.append({
            'id': event.id,
            'title': event.title,
            'emoji': get_category_emoji(event.category),
            'start_time': event.start_time,
            'venue_name': event.venue_name,
            'interested_count': EventInterest.objects.filter(event=event).count(),
            'is_creator': event.created_by == request.user
        })

    return Response(events_data)


def get_category_emoji(category):
    """Map category to emoji"""
    emoji_map = {
        'food': '🍔',
        'sports': '⚽',
        'nightlife': '🎉',
        'arts': '🎨',
        'music': '🎵',
        'social': '👥'
    }
    return emoji_map.get(category, '📍')


def format_time_ago(dt):
    """Format datetime as 'X hours ago', 'X days ago', etc."""
    from django.utils import timezone
    from datetime import timedelta

    now = timezone.now()
    diff = now - dt

    if diff < timedelta(minutes=1):
        return 'just now'
    elif diff < timedelta(hours=1):
        minutes = int(diff.total_seconds() / 60)
        return f'{minutes} minute{"s" if minutes > 1 else ""} ago'
    elif diff < timedelta(days=1):
        hours = int(diff.total_seconds() / 3600)
        return f'{hours} hour{"s" if hours > 1 else ""} ago'
    elif diff < timedelta(days=7):
        days = diff.days
        return f'{days} day{"s" if days > 1 else ""} ago'
    else:
        return dt.strftime('%b %d')