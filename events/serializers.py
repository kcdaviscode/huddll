from rest_framework import serializers
from .models import Event, EventInterest, CheckIn, EventChat
from users.models import User


class EventListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for event list/map view"""
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    attendee_count = serializers.IntegerField(read_only=True)
    interested_count = serializers.IntegerField(read_only=True)
    interested_user_ids = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'category', 'subcategory', 'venue_name', 'city',
            'latitude', 'longitude', 'start_time', 'end_time',
            'image', 'created_by', 'created_by_name', 'attendee_count', 'interested_count', 'interested_user_ids'
        ]

    def get_interested_user_ids(self, obj):
        return list(obj.interests.values_list('user_id', flat=True))


class EventDetailSerializer(serializers.ModelSerializer):
    """Full serializer with all event details"""
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    created_by_id = serializers.IntegerField(source='created_by.id', read_only=True)
    attendee_count = serializers.IntegerField(read_only=True)
    interested_count = serializers.IntegerField(read_only=True)
    user_status = serializers.SerializerMethodField()
    interested_user_ids = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def get_user_status(self, obj):
        """Get current user's relationship to this event"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None

        # Check if user is creator
        if obj.created_by == request.user:
            return 'creator'

        # Check if user has marked interest
        if EventInterest.objects.filter(event=obj, user=request.user).exists():
            return 'interested'

        # Check if user has checked in
        if CheckIn.objects.filter(event=obj, user=request.user).exists():
            return 'checked_in'

        return None

    def get_interested_user_ids(self, obj):
        return list(obj.interests.values_list('user_id', flat=True))


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