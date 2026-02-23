from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.db.models import Q
from .models import User, UserInterest
from .serializers import (
    UserProfileSerializer, UserBasicSerializer, ProfileUpdateSerializer
)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login endpoint"""
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)

    if user:
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        })

    return Response({'error': 'Invalid credentials'}, status=400)


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
                'avatar': activity.user.first_name[0].upper() if activity.user.first_name else activity.user.username[
                    0].upper(),
                'profile_photo': request.build_absolute_uri(
                    activity.user.profile_photo.url) if activity.user.profile_photo else None
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_by_id(request, user_id):
    """Get basic user info by ID"""
    try:
        user = User.objects.get(id=user_id)
        serializer = UserBasicSerializer(user, context={'request': request})
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


# ADD THIS TO users/views.py

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_happening_soon(request):
    """Get upcoming events friends are attending with filters"""
    from connections.models import Connection
    from events.models import Event, EventInterest
    from django.utils import timezone
    from datetime import timedelta
    from django.db.models import Count, Q

    # Get query parameters
    timeframe = request.GET.get('timeframe', 'all')  # today, tomorrow, weekend, week, all
    category = request.GET.get('category', 'all')  # food, sports, nightlife, arts, music, social, all
    distance = request.GET.get('distance', 'all')  # 5, 10, 25, all (miles)

    # Get friends
    friend_connections = Connection.objects.filter(
        Q(user1=request.user, status='accepted') |
        Q(user2=request.user, status='accepted')
    ).select_related('user1', 'user2')

    friend_ids = []
    for conn in friend_connections:
        friend = conn.user2 if conn.user1 == request.user else conn.user1
        friend_ids.append(friend.id)

    if not friend_ids:
        return Response([])

    # Base query: upcoming events friends are interested in
    now = timezone.now()
    # Get events where friends are interested OR events created by friends
    events_query = Event.objects.filter(
        Q(interests__user_id__in=friend_ids) | Q(created_by_id__in=friend_ids),
        start_time__gte=now
    ).annotate(
        friend_count=Count('interests', filter=Q(interests__user_id__in=friend_ids))
    ).distinct()

    # Apply timeframe filter
    if timeframe == 'today':
        end_of_day = now.replace(hour=23, minute=59, second=59)
        events_query = events_query.filter(start_time__lte=end_of_day)
    elif timeframe == 'tomorrow':
        tomorrow_start = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0)
        tomorrow_end = tomorrow_start.replace(hour=23, minute=59, second=59)
        events_query = events_query.filter(start_time__gte=tomorrow_start, start_time__lte=tomorrow_end)
    elif timeframe == 'weekend':
        # Next Saturday and Sunday
        days_until_saturday = (5 - now.weekday()) % 7
        if days_until_saturday == 0 and now.hour > 12:  # If it's Saturday afternoon, include next weekend
            days_until_saturday = 7
        saturday = (now + timedelta(days=days_until_saturday)).replace(hour=0, minute=0, second=0)
        sunday_end = (saturday + timedelta(days=1)).replace(hour=23, minute=59, second=59)
        events_query = events_query.filter(start_time__gte=saturday, start_time__lte=sunday_end)
    elif timeframe == 'week':
        week_end = now + timedelta(days=7)
        events_query = events_query.filter(start_time__lte=week_end)

    # Apply category filter
    if category != 'all':
        events_query = events_query.filter(category=category)

    # Apply distance filter (if user has location)
    if distance != 'all' and request.user.city:
        # This would need geocoding - for now, skip distance filtering
        # In production, you'd calculate distance from user's lat/lng
        pass

    # Get events with friend info
    events = events_query.order_by('start_time')[:50]  # Limit to 50 events

    # Format response
    results = []
    for event in events:
        # Get friends going to this event
        interested_friends = EventInterest.objects.filter(
            event=event,
            user_id__in=friend_ids
        ).select_related('user')

        friends_going = []
        for interest in interested_friends[:5]:  # Show max 5 friends
            friend = interest.user
            friends_going.append({
                'id': friend.id,
                'username': friend.username,
                'first_name': friend.first_name,
                'last_name': friend.last_name,
                'profile_photo_url': request.build_absolute_uri(
                    friend.profile_photo.url) if friend.profile_photo else None
            })

        # Check if current user is already interested
        user_interested = EventInterest.objects.filter(event=event, user=request.user).exists()

        results.append({
            'id': event.id,
            'title': event.title,
            'category': event.category,
            'emoji': get_category_emoji(event.category),
            'venue_name': event.venue_name,
            'city': event.city,
            'latitude': event.latitude,
            'longitude': event.longitude,
            'start_time': event.start_time,
            'image': event.image.url if event.image else None,
            'friends_going': friends_going,
            'friend_count': len(interested_friends),
            'total_interested': event.interests.count(),
            'user_interested': user_interested,
            'created_by': event.created_by.id
        })

    return Response(results)


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