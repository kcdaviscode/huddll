from django.urls import path
from . import views

urlpatterns = [
    path('unread-counts/', views.get_unread_counts, name='chat_unread_counts'),
    path('<int:event_id>/mark-read/', views.mark_chat_read, name='mark_chat_read'),
]