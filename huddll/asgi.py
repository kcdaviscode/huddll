import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'huddll.settings')
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from chat.middleware import TokenAuthMiddleware  # Changed
from chat import routing

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': TokenAuthMiddleware(  # Changed from AuthMiddlewareStack
        URLRouter(
            routing.websocket_urlpatterns
        )
    ),
})