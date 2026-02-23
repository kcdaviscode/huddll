from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import Connection
from .serializers import (
    FriendRequestSerializer, FriendRequestCreateSerializer, FriendRequestActionSerializer
)
from users.models import User


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_friend_request(request):
    """Send a friend request to another user"""
    serializer = FriendRequestCreateSerializer(data=request.data, context={'request': request})

    if serializer.is_valid():
        recipient = User.objects.get(id=serializer.validated_data['recipient_id'])
        met_at_event_id = serializer.validated_data.get('met_at_event_id')

        # Create connection - sender is always user1, recipient is always user2
        connection = Connection.objects.create(
            user1=request.user,
            user2=recipient,
            status='pending',
            met_at_event_id=met_at_event_id,
            initiated_by=request.user  # ← THIS LINE
        )

        # Create notification for recipient
        from notifications.models import Notification
        Notification.objects.create(
            user=recipient,
            message=f"{request.user.first_name or request.user.username} sent you a friend request"
        )

        return Response(
            FriendRequestSerializer(connection).data,
            status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friend_requests(request):
    """Get pending friend requests (received and sent)"""

    # Requests where current user is the recipient (initiated_by is someone else)
    requests_received = Connection.objects.filter(
        status='pending'
    ).filter(
        Q(user1=request.user) | Q(user2=request.user)
    ).exclude(
        initiated_by=request.user
    ).select_related('user1', 'user2', 'initiated_by').order_by('-created_at')

    # Requests where current user is the sender (initiated_by is current user)
    requests_sent = Connection.objects.filter(
        initiated_by=request.user,
        status='pending'
    ).select_related('user1', 'user2').order_by('-created_at')

    # Format received requests
    received_data = []
    for conn in requests_received:
        sender = conn.initiated_by
        received_data.append({
            'id': conn.id,
            'sender': {
                'id': sender.id,
                'username': sender.username,
                'first_name': sender.first_name,
                'last_name': sender.last_name,
                'profile_photo_url': request.build_absolute_uri(
                    sender.profile_photo.url) if sender.profile_photo else None
            },
            'created_at': conn.created_at,
            'type': 'received'
        })

    # Format sent requests
    sent_data = []
    for conn in requests_sent:
        # Figure out who the recipient is (the one who isn't current user)
        recipient = conn.user2 if conn.user1 == request.user else conn.user1
        sent_data.append({
            'id': conn.id,
            'recipient': {
                'id': recipient.id,
                'username': recipient.username,
                'first_name': recipient.first_name,
                'last_name': recipient.last_name,
                'profile_photo_url': request.build_absolute_uri(
                    recipient.profile_photo.url) if recipient.profile_photo else None
            },
            'created_at': conn.created_at,
            'type': 'sent'
        })

    return Response({
        'received': received_data,
        'sent': sent_data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_friend_request(request, request_id):
    """Accept, decline, or block a friend request"""
    try:
        connection = Connection.objects.get(id=request_id)
    except Connection.DoesNotExist:
        return Response(
            {'error': 'Friend request not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Verify user is the recipient (not the one who initiated)
    if connection.initiated_by == request.user:
        return Response(
            {'error': 'You cannot respond to your own friend request'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Verify status is pending
    if connection.status != 'pending':
        return Response(
            {'error': 'This friend request has already been responded to'},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = FriendRequestActionSerializer(data=request.data)

    if serializer.is_valid():
        action = serializer.validated_data['action']

        if action == 'accept':
            connection.status = 'accepted'
            connection.save()

            # Create notification for sender
            from notifications.models import Notification
            Notification.objects.create(
                user=connection.initiated_by,
                message=f"{request.user.first_name or request.user.username} accepted your friend request"
            )

            return Response({
                'message': 'Friend request accepted',
                'connection': FriendRequestSerializer(connection).data
            })

        elif action == 'decline':
            connection.status = 'declined'
            connection.save()
            return Response({'message': 'Friend request declined'})

        elif action == 'block':
            connection.status = 'blocked'
            connection.save()
            return Response({'message': 'User blocked'})

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def cancel_friend_request(request, request_id):
    """Cancel a friend request you sent"""
    try:
        connection = Connection.objects.get(id=request_id)
    except Connection.DoesNotExist:
        return Response(
            {'error': 'Friend request not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Verify user is the sender (initiated the request)
    if connection.initiated_by != request.user:
        return Response(
            {'error': 'You cannot cancel this friend request'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Verify status is pending
    if connection.status != 'pending':
        return Response(
            {'error': 'Can only cancel pending requests'},
            status=status.HTTP_400_BAD_REQUEST
        )

    connection.delete()
    return Response({'message': 'Friend request cancelled'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_friend(request, friend_id):
    """Remove a friend (unfriend)"""
    connection = Connection.objects.filter(
        Q(user1=request.user, user2_id=friend_id) |
        Q(user1_id=friend_id, user2=request.user),
        status='accepted'
    ).first()

    if not connection:
        return Response(
            {'error': 'Friend connection not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    connection.delete()
    return Response({'message': 'Friend removed'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_connection_status(request, user_id):
    """Check connection status with another user"""
    connection = Connection.objects.filter(
        Q(user1=request.user, user2_id=user_id) |
        Q(user1_id=user_id, user2=request.user)
    ).first()

    if not connection:
        return Response({'status': 'none'})

    # Determine relationship perspective
    if connection.status == 'pending':
        if connection.initiated_by == request.user:
            return Response({'status': 'pending_sent', 'request_id': connection.id})
        else:
            return Response({'status': 'pending_received', 'request_id': connection.id})

    return Response({'status': connection.status, 'connection_id': connection.id})