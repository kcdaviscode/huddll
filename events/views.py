from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from django.db.models import Count
from django.utils import timezone
from users.models import User
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