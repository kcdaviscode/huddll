from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from django.db.models import Count, Q
from django.utils import timezone
from users.models import User
from notifications.models import Notification
from connections.models import Connection
from .models import Event, EventInterest, CheckIn, EventChat, ExternalEvent
from .serializers import (
    EventListSerializer,
    EventDetailSerializer,
    CheckInSerializer,
    EventInterestSerializer
)


class EventViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Event CRUD operations
    """
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'list':
            return EventListSerializer
        return EventDetailSerializer

    def get_queryset(self):
        queryset = Event.objects.filter(status='published').annotate(
            attendee_count=Count('checkins', distinct=True),
            interested_count=Count('interests', distinct=True)
        )

        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)

        city = self.request.query_params.get('city', None)
        if city:
            queryset = queryset.filter(city__icontains=city)

        start_date = self.request.query_params.get('start_date', None)
        if start_date:
            queryset = queryset.filter(start_time__gte=start_date)

        end_date = self.request.query_params.get('end_date', None)
        if end_date:
            queryset = queryset.filter(start_time__lte=end_date)

        return queryset.order_by('start_time')

    def perform_create(self, serializer):
        event = serializer.save(created_by=self.request.user)
        # Automatically mark creator as interested
        EventInterest.objects.get_or_create(user=self.request.user, event=event)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def check_in(self, request, pk=None):
        event = self.get_object()

        if CheckIn.objects.filter(user=request.user, event=event).exists():
            return Response(
                {'error': 'You have already checked in to this event'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CheckInSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, event=event)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_interested(self, request, pk=None):
        event = self.get_object()

        interest, created = EventInterest.objects.get_or_create(
            user=request.user,
            event=event
        )

        if not created:
            return Response(
                {'message': 'Already marked as interested'},
                status=status.HTTP_200_OK
            )

        serializer = EventInterestSerializer(interest)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], permission_classes=[IsAuthenticated])
    def unmark_interested(self, request, pk=None):
        event = self.get_object()

        try:
            interest = EventInterest.objects.get(user=request.user, event=event)
            interest.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except EventInterest.DoesNotExist:
            return Response(
                {'error': 'Not marked as interested'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['delete'], permission_classes=[IsAuthenticated])
    def delete(self, request, pk=None):
        """Delete an event (only by creator)"""
        event = self.get_object()

        # Check if user is the creator
        if event.created_by != request.user:
            return Response(
                {'error': 'Only the event creator can delete this event'},
                status=status.HTTP_403_FORBIDDEN
            )

        event.delete()
        return Response({'message': 'Event deleted successfully'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def attendees(self, request, pk=None):
        event = self.get_object()
        checkins = CheckIn.objects.filter(event=event, verified=True).select_related('user')

        attendees = [{
            'id': checkin.user.id,
            'username': checkin.user.username,
            'checked_in_at': checkin.checked_in_at
        } for checkin in checkins]

        return Response(attendees)


# ============================================================================
# EXTERNAL EVENTS (Ticketmaster, Eventbrite)
# ============================================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def get_external_events(request):
    """
    Get all active external events (Ticketmaster, Eventbrite)
    """
    # Get only future events
    events = ExternalEvent.objects.filter(
        is_active=True,
        start_time__gte=timezone.now()
    ).order_by('start_time')

    # Optional filters
    category = request.GET.get('category')
    if category:
        events = events.filter(category=category)

    # Convert to dict
    events_data = [event.to_dict() for event in events]

    return Response({
        'count': len(events_data),
        'events': events_data
    })


# ============================================================================
# HUDDLL CREATION AROUND EXTERNAL EVENTS
# ============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_external_event_interested(request, event_id):
    """
    Mark user as interested in an external (Ticketmaster) event.
    This just tracks that the user is going - doesn't affect the event itself.

    Uses the Event model with type='external' (NOT ExternalEvent model)
    """
    try:
        # Look for event in Event table with type='external'
        event = Event.objects.get(id=event_id, type='external')
    except Event.DoesNotExist:
        return Response({'error': 'External event not found'}, status=status.HTTP_404_NOT_FOUND)

    # Create or get EventInterest
    interest, created = EventInterest.objects.get_or_create(
        user=request.user,
        event=event
    )

    if created:
        return Response({
            'message': 'Marked as interested',
            'is_interested': True
        }, status=status.HTTP_201_CREATED)
    else:
        return Response({
            'message': 'Already marked as interested',
            'is_interested': True
        }, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unmark_external_event_interested(request, event_id):
    """Remove user's interest in an external event"""
    try:
        event = Event.objects.get(id=event_id, type='external')
        EventInterest.objects.filter(user=request.user, event=event).delete()
        return Response({
            'message': 'Interest removed',
            'is_interested': False
        }, status=status.HTTP_200_OK)
    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_external_event_interest(request, event_id):
    """Check if user is interested in an external event"""
    try:
        event = Event.objects.get(id=event_id, type='external')
        is_interested = EventInterest.objects.filter(
            user=request.user,
            event=event
        ).exists()

        return Response({
            'is_interested': is_interested
        }, status=status.HTTP_200_OK)
    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_huddll(request):
    """
    Create a Huddll (private group event) tied to a public/external event.

    Request body:
    {
        "parent_event_id": 123,
        "title": "My Group at Concert",
        "invited_friends": [2, 3, 4]
    }
    """
    parent_event_id = request.data.get('parent_event_id')
    title = request.data.get('title')
    invited_friends = request.data.get('invited_friends', [])

    if not parent_event_id or not title:
        return Response({
            'error': 'parent_event_id and title are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        parent_event = Event.objects.get(id=parent_event_id)
    except Event.DoesNotExist:
        return Response({'error': 'Parent event not found'}, status=status.HTTP_404_NOT_FOUND)

    # Create the Huddll as a new event linked to the parent
    huddll = Event.objects.create(
        title=title,
        description=f"Private group for {parent_event.title}",
        venue_name=parent_event.venue_name,
        address=parent_event.address,
        latitude=parent_event.latitude,
        longitude=parent_event.longitude,
        city=parent_event.city,
        start_time=parent_event.start_time,
        end_time=parent_event.end_time,
        category=parent_event.category,
        subcategory=parent_event.subcategory if hasattr(parent_event, 'subcategory') else None,
        emoji=parent_event.emoji if parent_event.emoji else '🎉',
        created_by=request.user,
        type='huddll',  # Mark as Huddll type
        parent_event=parent_event,  # Link to parent
        status='published'
    )

    # Creator is automatically interested
    EventInterest.objects.create(user=request.user, event=huddll)

    # Invite selected friends
    invited_count = 0
    for friend_id in invited_friends:
        try:
            # Verify they're actually friends
            is_friend = Connection.objects.filter(
                Q(user1=request.user, user2_id=friend_id, status='accepted') |
                Q(user2=request.user, user1_id=friend_id, status='accepted')
            ).exists()

            if is_friend:
                # Create notification for invited friend
                Notification.objects.create(
                    user_id=friend_id,
                    message=f"{request.user.username} invited you to join their Huddll: {title}"
                )
                invited_count += 1
        except Exception as e:
            print(f"Error inviting friend {friend_id}: {e}")
            continue

    # Return the created Huddll
    return Response({
        'id': huddll.id,
        'title': huddll.title,
        'parent_event_id': parent_event.id,
        'parent_event_title': parent_event.title,
        'invited_count': invited_count,
        'message': 'Huddll created successfully!'
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_huddlls_for_event(request, event_id):
    """Get all Huddlls (private groups) for a given external event that the user is part of"""
    try:
        parent_event = Event.objects.get(id=event_id)

        # Find Huddlls the user is interested in that are linked to this parent event
        huddlls = Event.objects.filter(
            parent_event=parent_event,
            type='huddll',
            interests__user=request.user
        ).distinct()

        huddlls_data = []
        for huddll in huddlls:
            interested_users = EventInterest.objects.filter(event=huddll).select_related('user')
            huddlls_data.append({
                'id': huddll.id,
                'title': huddll.title,
                'created_by': huddll.created_by.id,
                'created_by_username': huddll.created_by.username,
                'interested_count': interested_users.count(),
                'interested_user_ids': [i.user.id for i in interested_users]
            })

        return Response(huddlls_data, status=status.HTTP_200_OK)
    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)