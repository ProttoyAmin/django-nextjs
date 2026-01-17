"""
Minimal WebSocket Consumer (Auth + Connection only)
"""
import json
import logging

from channels.generic import websocket
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from apps.accounts.services.activity_tracker import (
    increment_connection,
    decrement_connection,
    update_user_activity,
    mark_user_online,
    mark_user_away,
)


User = get_user_model()
logger = logging.getLogger(__name__)


class UserActivityConsumer(websocket.AsyncWebsocketConsumer):
    async def connect(self):
        """
        Authenticate user and accept WebSocket
        """
        try:
            token = self.get_token_from_scope()

            if not token:
                logger.warning("No token provided")
                await self.close()
                return

            user = await self.get_user_from_token(token)

            if not user:
                logger.warning("Invalid token")
                await self.close()
                return

            self.user = user
            self.group_name = f"user_activity_{user.id}"

            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            await self.accept()
            await database_sync_to_async(increment_connection)(user.id)
            await database_sync_to_async(mark_user_online)(user.id, False)
            await update_user_activity(user.id)

            message = {
                "type": "status_update",
                "user_id": str(user.id),
                "status": user.status,
                "is_status_manual": user.is_status_manual,
            }

            # Send confirmation to frontend
            await self.send(json.dumps(message))

            logger.info(f"WebSocket connected: {user.username}")

        except Exception as e:
            logger.error(f"WebSocket connect error: {e}")
            await self.close()

    async def disconnect(self, close_code):
        """
        Handle disconnect
        """
        if not hasattr(self, "user"):
            return

        try:
            connections = await database_sync_to_async(
                decrement_connection
            )(self.user.id)

            # Only mark away if all tabs closed
            if connections == 0:
                await database_sync_to_async(
                    mark_user_away
                )(self.user.id, False)

            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

            logger.info(f"WS disconnected: {self.user.username}")

        except Exception as e:
            logger.error(f"WS disconnect error: {e}")

    async def receive(self, text_data):
        """
        Echo messages back (for testing)
        """
        try:
            data = json.loads(text_data)

            if data.get("type") == "heartbeat":
                await update_user_activity(self.user.id)
                return

        except json.JSONDecodeError:
            pass

    def get_token_from_scope(self):
        """
        Extract JWT token from query string or cookies
        """
        from urllib.parse import parse_qs

        # Query string
        query_string = self.scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token_list = params.get("token")

        if token_list:
            return token_list[0]

        # Cookies
        headers = dict(self.scope.get("headers", []))
        cookie_header = headers.get(b"cookie", b"").decode()

        if cookie_header:
            from django.http import parse_cookie
            cookies = parse_cookie(cookie_header)
            return cookies.get("access")

        return None

    @database_sync_to_async
    def get_user_from_token(self, token):
        """
        Validate JWT and return user
        """
        from rest_framework_simplejwt.tokens import AccessToken
        from rest_framework_simplejwt.exceptions import TokenError
        try:
            access_token = AccessToken(token)
            user_id = access_token["user_id"]
            return User.objects.get(id=user_id)
        except (TokenError, User.DoesNotExist):
            return None
