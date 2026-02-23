from rest_framework import serializers
from .models import Connection
from users.serializers import UserBasicSerializer


class FriendRequestSerializer(serializers.ModelSerializer):
    """Serializer for friend requests"""
    sender = UserBasicSerializer(source='user1', read_only=True)
    recipient = UserBasicSerializer(source='user2', read_only=True)

    class Meta:
        model = Connection
        fields = ['id', 'sender', 'recipient', 'status', 'created_at', 'met_at_event']
        read_only_fields = ['id', 'created_at', 'status']


class FriendRequestCreateSerializer(serializers.Serializer):
    """Create a friend request"""
    recipient_id = serializers.IntegerField()
    met_at_event_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_recipient_id(self, value):
        from users.models import User

        # Check if user exists
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("User does not exist")

        # Check if trying to friend yourself
        request = self.context.get('request')
        if request and request.user.id == value:
            raise serializers.ValidationError("Cannot send friend request to yourself")

        return value

    def validate(self, data):
        from django.db.models import Q

        request = self.context.get('request')
        recipient_id = data['recipient_id']

        # Check if connection already exists
        existing = Connection.objects.filter(
            Q(user1=request.user, user2_id=recipient_id) |
            Q(user1_id=recipient_id, user2=request.user)
        ).first()

        if existing:
            if existing.status == 'pending':
                raise serializers.ValidationError("Friend request already pending")
            elif existing.status == 'accepted':
                raise serializers.ValidationError("Already friends with this user")
            elif existing.status == 'blocked':
                raise serializers.ValidationError("Cannot send friend request")

        return data


class FriendRequestActionSerializer(serializers.Serializer):
    """Accept or decline a friend request"""
    action = serializers.ChoiceField(choices=['accept', 'decline', 'block'])