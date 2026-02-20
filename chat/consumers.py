import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from events.models import Event, EventInterest
from .models import ChatMessage

User = get_user_model()


class EventChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for event chat rooms.
    Only allows RSVP'd users to connect and send messages.
    """

    async def connect(self):
        """Handle WebSocket connection"""
        self.event_id = self.scope['url_route']['kwargs']['event_id']
        self.room_group_name = f'event_chat_{self.event_id}'
        self.user = self.scope['user']

        # Check if user is authenticated
        if not self.user.is_authenticated:
            await self.close()
            return

        # Check if user has RSVP'd to this event
        has_rsvp = await self.check_user_rsvp()
        if not has_rsvp:
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Send chat history to the newly connected user
        await self.send_chat_history()

        # Notify others that user joined
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_join',
                'user': {
                    'id': self.user.id,
                    'username': self.user.username,
                    'first_name': self.user.first_name,
                }
            }
        )

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        # Notify others that user left
        if hasattr(self, 'user') and self.user.is_authenticated:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_leave',
                    'user': {
                        'id': self.user.id,
                        'username': self.user.username,
                        'first_name': self.user.first_name,
                    }
                }
            )

    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'chat_message')

            if message_type == 'chat_message':
                message_text = data.get('message', '').strip()

                if not message_text:
                    return

                # Save message to database
                message = await self.save_message(message_text)

                # Broadcast to room group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message
                    }
                )

            elif message_type == 'typing':
                # Broadcast typing indicator (don't save to DB)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'user_typing',
                        'user': {
                            'id': self.user.id,
                            'username': self.user.username,
                            'first_name': self.user.first_name,
                        }
                    }
                )

        except json.JSONDecodeError:
            pass

    # Handlers for different message types
    async def chat_message(self, event):
        """Send chat message to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message']
        }))

    async def user_join(self, event):
        """Send user join notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'user_join',
            'user': event['user']
        }))

    async def user_leave(self, event):
        """Send user leave notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'user_leave',
            'user': event['user']
        }))

    async def user_typing(self, event):
        """Send typing indicator to WebSocket"""
        # Don't send typing indicator back to the user who's typing
        if event['user']['id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'user_typing',
                'user': event['user']
            }))

    # Database operations
    @database_sync_to_async
    def check_user_rsvp(self):
        """Check if user has RSVP'd to the event"""
        try:
            event = Event.objects.get(id=self.event_id)
            return EventInterest.objects.filter(
                event=event,
                user=self.user
            ).exists()
        except Event.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, message_text):
        """Save message to database and return serialized version"""
        event = Event.objects.get(id=self.event_id)
        message = ChatMessage.objects.create(
            event=event,
            user=self.user,
            message=message_text
        )
        return message.to_dict()

    @database_sync_to_async
    def get_chat_history(self):
        """Retrieve last 50 messages for this event"""
        messages = ChatMessage.objects.filter(
            event_id=self.event_id
        ).select_related('user').order_by('-created_at')[:50]

        # Reverse to get chronological order
        return [msg.to_dict() for msg in reversed(messages)]

    async def send_chat_history(self):
        """Send chat history to newly connected user"""
        messages = await self.get_chat_history()
        await self.send(text_data=json.dumps({
            'type': 'chat_history',
            'messages': messages
        }))