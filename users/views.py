import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from users.models import User

logger = logging.getLogger(__name__)


@api_view(['POST'])
def register(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    name = request.data.get('name', '')
    phone_number = request.data.get('phone_number', '')  # NEW

    if not username or not email or not password:
        return Response({'error': 'Username, email, and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.create_user(username=username, email=email, password=password)
        if name:
            user.first_name = name
        if phone_number:  # NEW
            user.phone_number = phone_number
        user.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key,
                         'user': {'id': user.id, 'username': user.username, 'email': user.email, 'name': user.first_name, 'phone_number': user.phone_number}},
                        status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def login(request):
    logger.error(f"Login attempt with data: {request.data}")
    username = request.data.get('username')
    password = request.data.get('password')
    logger.error(f"Username: {username}, Password: {password}")

    try:
        user = authenticate(username=username, password=password)
        logger.error(f"Authenticated user: {user}")
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        logger.error(f"Exception type: {type(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise

    if user:
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key,
                         'user': {'id': user.id, 'username': user.username, 'email': user.email, 'name': user.first_name, 'phone_number': user.phone_number}})
    else:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_stats(request):
    """Get user's profile statistics"""
    user = request.user
    return Response({
        'username': user.username,
        'name': user.first_name or user.username,
        'email': user.email,
        'status_message': user.status_message,
        'events_attended': user.events_attended,
        'events_hosted': user.events_hosted,
        'connections': 0,
        'profile_photo': user.profile_photo.url if user.profile_photo else None,
        'city': user.city or 'Not set',
        'created_at': user.created_at.strftime('%B %Y'),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_status(request):
    """Update user's status message"""
    status_message = request.data.get('status_message', '')
    request.user.status_message = status_message
    request.user.save()
    return Response({'status_message': request.user.status_message})