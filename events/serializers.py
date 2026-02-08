from rest_framework import serializers
from .models import Event, EventInterest, CheckIn, EventChat
from users.models import User


class EventListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for event list/map view"""
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    attendee_count = serializers.IntegerField(read_only=True)
    interested_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'category', 'subcategory', 'venue_name', 'city',
            'latitude', 'longitude', 'start_time', 'end_time',
            'image', 'created_by', 'created_by_name', 'attendee_count', 'interested_count'
        ]


class EventDetailSerializer(serializers.ModelSerializer):
    """Full serializer with all event details"""
    created_by = serializers.StringRelatedField()
    attendee_count = serializers.IntegerField(read_only=True)
    interested_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class CheckInSerializer(serializers.ModelSerializer):
    """Serializer for event check-ins"""

    class Meta:
        model = CheckIn
        fields = ['id', 'event', 'latitude', 'longitude', 'checked_in_at', 'verified']
        read_only_fields = ['user', 'checked_in_at', 'verified']

    def validate(self, data):
        """Validate check-in location and time"""
        event = data['event']
        user_lat = data['latitude']
        user_lng = data['longitude']

        can_check_in, message = event.can_check_in(user_lat, user_lng)

        if not can_check_in:
            raise serializers.ValidationError(message)

        return data


class EventInterestSerializer(serializers.ModelSerializer):
    """Serializer for marking interest in an event"""

    class Meta:
        model = EventInterest
        fields = ['id', 'event', 'created_at']
        read_only_fields = ['user', 'created_at']