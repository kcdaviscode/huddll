from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('profile-stats/', views.profile_stats, name='profile-stats'),
    path('update-status/', views.update_status, name='update-status'),
]