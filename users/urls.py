from django.urls import path
from . import views

urlpatterns = [
    # Profile endpoints
    path('profile/', views.get_profile, name='get_profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('friends/', views.get_friends, name='get_friends'),
    path('timeline/', views.get_timeline, name='get_timeline'),
    path('my-events/', views.get_my_events, name='get_my_events'),
]