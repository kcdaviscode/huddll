from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Interest, UserInterest


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for custom User model"""

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile', {
            'fields': ('bio', 'profile_photo', 'date_of_birth', 'city')
        }),
        ('Privacy', {
            'fields': ('profile_privacy', 'show_future_events')
        }),
    )

    list_display = ['username', 'email', 'first_name', 'last_name', 'city', 'is_staff']
    list_filter = ['is_staff', 'is_superuser', 'profile_privacy', 'city']
    search_fields = ['username', 'email', 'first_name', 'last_name']


@admin.register(Interest)
class InterestAdmin(admin.ModelAdmin):
    list_display = ['name', 'category']
    list_filter = ['category']
    search_fields = ['name']


@admin.register(UserInterest)
class UserInterestAdmin(admin.ModelAdmin):
    list_display = ['user', 'interest', 'added_at']
    list_filter = ['interest__category', 'added_at']
    search_fields = ['user__username', 'interest__name']