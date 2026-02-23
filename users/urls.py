from django.urls import path
from . import views

urlpatterns = [
    # Profile endpoints
    path('profile/', views.get_profile, name='get_profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('friends/', views.get_friends, name='get_friends'),
    path('timeline/', views.get_timeline, name='get_timeline'),
    path('my-events/', views.get_my_events, name='get_my_events'),
    path('login/', views.login, name='login'),
    path('<int:user_id>/', views.get_user_by_id, name='get_user_by_id'),
    path('happening-soon/', views.get_happening_soon, name='get_happening_soon'),
]