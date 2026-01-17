# apps/notifications/consumers.py
"""
WebSocket Consumer for real-time notifications
"""
import json
import logging

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for handling real-time notifications.
    Users connect to receive notifications in real-time.
    """

    async def connect(self):
        """
        Authenticate user and subscribe to their notification channel
        """
        try:
            token = self.get_token_from_scope()

            if not token:
                logger.warning("Notification WS: No token provided")
                await self.close()
                return

            user = await self.get_user_from_token(token)

            if not user:
                logger.warning("Notification WS: Invalid token")
                await self.close()
                return

            self.user = user
            # Each user has their own notification channel group
            self.group_name = f"notifications_{user.id}"

            # Join the user's notification group
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )

            await self.accept()

            # Send initial connection confirmation with unread count
            unread_count = await self.get_unread_count()
            await self.send(json.dumps({
                "type": "connection_established",
                "user_id": str(user.id),
                "unread_count": unread_count,
            }))

            logger.info(f"Notification WS connected: {user.username}")

        except Exception as e:
            logger.error(f"Notification WS connect error: {e}")
            await self.close()

    async def disconnect(self, close_code):
        """
        Handle WebSocket disconnect
        """
        if not hasattr(self, "user"):
            return

        try:
            # Leave the notification group
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
            logger.info(f"Notification WS disconnected: {self.user.username}")

        except Exception as e:
            logger.error(f"Notification WS disconnect error: {e}")

    async def receive(self, text_data):
        """
        Handle incoming messages from the client
        """
        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            if message_type == "mark_read":
                # Mark a notification as read
                notification_id = data.get("notification_id")
                if notification_id:
                    await self.mark_notification_read(notification_id)
                    await self.send(json.dumps({
                        "type": "notification_marked_read",
                        "notification_id": notification_id,
                    }))

            elif message_type == "mark_all_read":
                # Mark all notifications as read
                count = await self.mark_all_notifications_read()
                await self.send(json.dumps({
                    "type": "all_notifications_marked_read",
                    "count": count,
                }))

            elif message_type == "get_unread_count":
                # Get the current unread count
                count = await self.get_unread_count()
                await self.send(json.dumps({
                    "type": "unread_count",
                    "count": count,
                }))

        except json.JSONDecodeError:
            logger.error("Notification WS: Invalid JSON received")

    async def notification_message(self, event):
        """
        Handler for notification messages sent from signals.
        This method is called when a notification is sent to this consumer's group.
        """
        # Forward the notification to the WebSocket client
        await self.send(json.dumps({
            "type": "new_notification",
            "notification": event.get("notification", {}),
        }))

    def get_token_from_scope(self):
        """
        Extract JWT token from query string or cookies
        """
        from urllib.parse import parse_qs

        # Try query string first
        query_string = self.scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token_list = params.get("token")

        if token_list:
            return token_list[0]

        # Try cookies
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

    @database_sync_to_async
    def get_unread_count(self):
        """
        Get the count of unread notifications for the user
        """
        from .models import Notification
        return Notification.objects.filter(
            recipient=self.user,
            is_read=False
        ).count()

    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """
        Mark a specific notification as read
        """
        from .models import Notification
        try:
            notification = Notification.objects.get(
                id=notification_id,
                recipient=self.user
            )
            notification.mark_as_read()
            return True
        except Notification.DoesNotExist:
            return False

    @database_sync_to_async
    def mark_all_notifications_read(self):
        """
        Mark all notifications as read for the user
        """
        from .models import Notification
        return Notification.mark_all_as_read(self.user)
