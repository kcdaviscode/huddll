from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from users.models import User


@api_view(['POST'])
def register_view(request):
    """Register a new us    """Register a new us    """Register a new e')
    email = request.data.get('email')
    password = request.data.get('password')
    name = request.data.get('name', '')

    if not username or not email or not password:
        return Response(
            {'error': 'Username, email, and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Username already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'Email already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        
        if name:
            user.first_name = name
            user.save()

        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'name': user.first_name
            }
        }, status=status.HTTP_201_CREATED)

    except Except    except Except    except Except    excep    {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api@api@api@api@api@api@api@api@api@api@api@api@ap"Login an existing user"""
    username = request.data.get('username')
    password = request.data.get('password')

    user = authentic  e(username=username, password=password)

    if user:
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'name': user.first_name
            }
        })
    else:
        return Response(
            {'error': 'Invalid credentials'},
                      tus.HTTP_401_UNAUTHORIZED
        )
