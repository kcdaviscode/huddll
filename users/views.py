from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from .models import User
from events.models import Event


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    try:
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        name = request.data.get('name', '')

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=400)

        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=400)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        user.first_name = name
        user.save()

        token, created = Token.objects.get_or_create(user=user)

        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'name': user.first_name
            }
        }, status=201)

    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(username=username, password=password)

        if user is None:
            return Response({'error': 'Invalid credentials'}, status=401)

        token, created = Token.objects.get_or_create(user=user)

        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'name': user.first_name
            }
        })

    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def create_event(request):
    try:
        # Get user from token manually
        from rest_framework.authtoken.models import Token
        from datetime import datetime, timedelta

        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Token '):
            token_key = auth_header.split(' ')[1]
            token = Token.objects.get(key=token_key)
            user = token.user
        else:
            return Response({'error': 'No authentication provided'}, status=401)

        data = request.data

        print("Received data:", data)  # Debug print
        print("User:", user)  # Debug print

        # Parse the datetime
        start_time = datetime.fromisoformat(data.get('time').replace('Z', '+00:00'))
        end_time = start_time + timedelta(hours=2)  # Default 2 hour duration

        event = Event.objects.create(
            title=data.get('title'),
            venue_name=data.get('venue'),  # Changed from 'venue'
            address=data.get('venue'),  # Using venue as address for now
            city='Baltimore',  # Default city
            category=data.get('category', 'social'),
            description=data.get('description', ''),
            latitude=data.get('lat'),
            longitude=data.get('lng'),
            start_time=start_time,  # Changed from 'event_time'
            end_time=end_time,  # Added end_time
            created_by=user,
            status='published'
        )

        # Get attendee count from CheckIns
        attendee_count = event.checkins.count() + 1  # +1 for creator

        return Response({
            'id': event.id,
            'title': event.title,
            'venue': event.venue_name,
            'category': event.category,
            'lat': float(event.latitude),
            'lng': float(event.longitude),
            'attendees': attendee_count,
            'time': event.start_time,
            'message': 'Event created successfully!'
        }, status=201)

    except Exception as e:
        print("Error creating event:", str(e))  # Debug print
        import traceback
        traceback.print_exc()  # Print full stack trace
        return Response({'error': str(e)}, status=400)