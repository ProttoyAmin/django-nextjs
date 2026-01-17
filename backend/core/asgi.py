from apps.notifications.routing import websocket_urlpatterns as notifications_ws
from apps.accounts.routing import websocket_urlpatterns as accounts_ws
import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Initialize Django ASGI application early to ensure AppRegistry is populated
django_asgi_app = get_asgi_application()

# Import routing AFTER get_asgi_application() to ensure all models are loaded

# Combine all WebSocket URL patterns
all_websocket_urlpatterns = accounts_ws + notifications_ws

print("ASGI application initialized with WebSocket routing")

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(all_websocket_urlpatterns)
        )
    ),
})
