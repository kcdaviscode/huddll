from django.contrib import admin
from .models import Connection, Message, Conversation


@admin.register(Connection)
class ConnectionAdmin(admin.ModelAdmin):
    list_display = ['user1', 'user2', 'status', 'met_at_event', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user1__username', 'user2__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'recipient', 'message_preview', 'read', 'created_at']
    list_filter = ['read', 'created_at']
    search_fields = ['sender__username', 'recipient__username', 'content']
    readonly_fields = ['created_at']

    def message_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content

    message_preview.short_description = 'Message'


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['user1', 'user2', 'last_message_at']
    search_fields = ['user1__username', 'user2__username']
    readonly_fields = ['last_message_at']