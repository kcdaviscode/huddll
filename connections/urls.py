from django.urls import path
from . import views

urlpatterns = [
    # Send friend request
    path('friend-request/send/', views.send_friend_request, name='send_friend_request'),

    # Get pending friend requests
    path('friend-requests/', views.get_friend_requests, name='get_friend_requests'),

    # Respond to friend request (accept/decline/block)
    path('friend-request/<int:request_id>/respond/', views.respond_to_friend_request, name='respond_to_friend_request'),

    # Cancel a friend request you sent
    path('friend-request/<int:request_id>/cancel/', views.cancel_friend_request, name='cancel_friend_request'),

    # Remove a friend
    path('friend/<int:friend_id>/remove/', views.remove_friend, name='remove_friend'),

    # Check connection status with a user
    path('connection-status/<int:user_id>/', views.get_connection_status, name='get_connection_status'),
]