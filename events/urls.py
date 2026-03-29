from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'events', views.EventViewSet, basename='event')

urlpatterns = [
    # External events endpoint
    path('external/', views.get_external_events, name='external_events'),

    # External event interest tracking
    path('external/<int:event_id>/mark-interested/', views.mark_external_event_interested,
         name='mark_external_event_interested'),
    path('external/<int:event_id>/unmark-interested/', views.unmark_external_event_interested,
         name='unmark_external_event_interested'),
    path('external/<int:event_id>/check-interest/', views.check_external_event_interest,
         name='check_external_event_interest'),

    # Huddll creation
    path('create-huddll/', views.create_huddll, name='create_huddll'),
    path('events/<int:event_id>/huddlls/', views.get_huddlls_for_event, name='get_huddlls_for_event'),

    # Include router URLs
    path('', include(router.urls)),
]