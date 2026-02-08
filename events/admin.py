from django.contrib import admin
from .models import Event, EventInterest, CheckIn, EventChat


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'city', 'start_time', 'status', 'created_by']
    list_filter = ['category', 'status', 'city', 'start_time']
    search_fields = ['title', 'description', 'venue_name', 'city']
    date_hierarchy = 'start_time'

    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'category', 'image', 'created_by')
        }),
        ('Location', {
            'fields': ('venue_name', 'address', 'city', 'latitude', 'longitude')
        }),
        ('Timing', {
            'fields': ('start_time', 'end_time')
        }),
        ('Settings', {
            'fields': ('is_public', 'max_attendees', 'status')
        }),
    )


@admin.register(EventInterest)
class EventInterestAdmin(admin.ModelAdmin):
    list_display = ['user', 'event', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'event__title']


@admin.register(CheckIn)
class CheckInAdmin(admin.ModelAdmin):
    list_display = ['user', 'event', 'checked_in_at', 'verified']
    list_filter = ['verified', 'checked_in_at']
    search_fields = ['user__username', 'event__title']
    readonly_fields = ['checked_in_at']


@admin.register(EventChat)
class EventChatAdmin(admin.ModelAdmin):
    list_display = ['event', 'user', 'message_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'event__title', 'message']

    def message_preview(self, obj):
        return obj.message[:50] + '...' if len(obj.message) > 50 else obj.message

    message_preview.short_description = 'Message'