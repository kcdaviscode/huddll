from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, get_external_events

router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')

urlpatterns = [
    path('', include(router.urls)),
    path('external/', get_external_events, name='external_events'),
]