from rest_framework import serializers
from django.db.models import Q
from .models import User, Interest, UserInterest


class InterestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interest
        fields = ['id', 'name', 'category']


class UserProfileSerializer(serializers.ModelSerializer):
    """Full profile data for authenticated user viewing their own profile"""
    interests = serializers.SerializerMethodField()
    events_attended = serializers.SerializerMethodField()
    huddlls_hosted = serializers.SerializerMethodField()
    friends_count = serializers.SerializerMethodField()
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email',
            'bio', 'profile_photo_url', 'city', 'date_of_birth',
            'profile_privacy', 'show_future_events',
            'interests', 'events_attended', 'huddlls_hosted', 'friends_count',
            'created_at'
        ]
        read_only_fields = ['id', 'username', 'created_at']

    def get_interests(self, obj):
        user_interests = UserInterest.objects.filter(user=obj).select_related('interest')
        return [ui.interest.name for ui in user_interests]

    def get_events_attended(self, obj):
        from events.models import EventInterest
        return EventInterest.objects.filter(user=obj).count()

    def get_huddlls_hosted(self, obj):
        from events.models import Event
        return Event.objects.filter(created_by=obj).count()

    def get_friends_count(self, obj):
        from connections.models import Connection
        return Connection.objects.filter(
            Q(user1=obj, status='accepted') |
            Q(user2=obj, status='accepted')
        ).count()

    def get_profile_photo_url(self, obj):
        if obj.profile_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_photo.url)
        return None


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user info for friends list, activity feed, etc."""
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'profile_photo_url', 'city']

    def get_profile_photo_url(self, obj):
        if obj.profile_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_photo.url)
        return None


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """For updating profile information"""
    interests = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'bio', 'city',
            'date_of_birth', 'profile_privacy', 'show_future_events',
            'interests', 'profile_photo'
        ]

    def update(self, instance, validated_data):
        interests_data = validated_data.pop('interests', None)

        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update interests if provided
        if interests_data is not None:
            # Clear existing interests
            UserInterest.objects.filter(user=instance).delete()

            # Add new interests
            for interest_name in interests_data:
                interest, _ = Interest.objects.get_or_create(
                    name=interest_name,
                    defaults={'category': 'other'}
                )
                UserInterest.objects.create(user=instance, interest=interest)

        return instance