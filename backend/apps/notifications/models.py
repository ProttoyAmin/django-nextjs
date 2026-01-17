# apps/notifications/models.py
from django.db import models
from django.conf import settings
from core.generate import generate_snowflake_id
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class Notification(models.Model):
    """
    Core notification model for tracking user notifications.
    Supports multiple notification types with polymorphic targets.
    """
    VERB_CHOICES = [
        ('post', 'New Post'),
        ('like', 'Liked'),
        ('comment', 'Commented'),
        ('follow_request', 'Follow Request'),
        ('follow_accept', 'Follow Accepted'),
        ('mention', 'Mentioned'),
        ('share', 'Shared'),
        ('reply', 'Replied'),
    ]

    id = models.BigIntegerField(
        primary_key=True, default=generate_snowflake_id, editable=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    verb = models.CharField(max_length=50, choices=VERB_CHOICES)
    description = models.TextField(blank=True, null=True)
    is_read = models.BooleanField(default=False)
    is_seen = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['recipient', 'is_seen']),
            models.Index(fields=['recipient', 'verb']),
            models.Index(fields=['created_at']),
        ]
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'

    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.verb}"

    def mark_as_read(self):
        """Mark this notification as read"""
        if not self.is_read:
            self.is_read = True
            self.save(update_fields=['is_read'])
        return self

    def mark_as_seen(self):
        """Mark this notification as seen"""
        if not self.is_seen:
            self.is_seen = True
            self.save(update_fields=['is_seen'])
        return self

    @classmethod
    def get_unread_count(cls, user):
        """Get count of unread notifications for a user"""
        return cls.objects.filter(recipient=user, is_read=False).count()

    @classmethod
    def get_unseen_count(cls, user):
        """Get count of unseen notifications for a user"""
        return cls.objects.filter(recipient=user, is_seen=False).count()

    @classmethod
    def mark_all_as_read(cls, user):
        """Mark all notifications as read for a user"""
        return cls.objects.filter(recipient=user, is_read=False).update(is_read=True)

    @classmethod
    def mark_all_as_seen(cls, user):
        """Mark all notifications as seen for a user"""
        return cls.objects.filter(recipient=user, is_seen=False).update(is_seen=True)


class NotificationActor(models.Model):
    """
    Tracks the actors (users who triggered the notification).
    A notification can have multiple actors (e.g., "John and 5 others liked your post")
    """
    id = models.BigIntegerField(
        primary_key=True, default=generate_snowflake_id, editable=False)
    notification = models.ForeignKey(
        Notification,
        on_delete=models.CASCADE,
        related_name='actors'
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_actions'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('notification', 'actor')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['notification', 'actor']),
        ]

    def __str__(self):
        return f"{self.actor.username} in notification {self.notification.id}"


class NotificationTarget(models.Model):
    """
    Links notifications to their target content (posts, comments, etc.)
    Uses GenericForeignKey for polymorphic relationships.
    """
    id = models.BigIntegerField(
        primary_key=True, default=generate_snowflake_id, editable=False)
    notification = models.ForeignKey(
        Notification,
        on_delete=models.CASCADE,
        related_name='targets'
    )
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.BigIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        indexes = [
            models.Index(fields=['notification']),
            models.Index(fields=['content_type', 'object_id']),
        ]

    def __str__(self):
        return f"Target for notification {self.notification.id}: {self.content_type}"


class NotificationDelivery(models.Model):
    """
    Tracks delivery status for different notification channels.
    Allows tracking of push notifications, email, SMS, etc.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
    ]

    CHANNEL_CHOICES = [
        ('push', 'Push Notification'),
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('in_app', 'In-App'),
        ('websocket', 'WebSocket'),
    ]

    id = models.BigIntegerField(
        primary_key=True, default=generate_snowflake_id, editable=False)
    notification = models.ForeignKey(
        Notification,
        on_delete=models.CASCADE,
        related_name='deliveries'
    )
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='pending')
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('notification', 'channel')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['notification', 'channel']),
            models.Index(fields=['status']),
            models.Index(fields=['channel', 'status']),
        ]
        verbose_name = 'Notification Delivery'
        verbose_name_plural = 'Notification Deliveries'

    def __str__(self):
        return f"Delivery {self.notification.id} via {self.channel}: {self.status}"

    def mark_as_sent(self):
        """Mark this delivery as sent"""
        from django.utils import timezone
        self.status = 'sent'
        self.sent_at = timezone.now()
        self.save(update_fields=['status', 'sent_at', 'updated_at'])
        return self

    def mark_as_delivered(self):
        """Mark this delivery as delivered"""
        from django.utils import timezone
        self.status = 'delivered'
        self.delivered_at = timezone.now()
        self.save(update_fields=['status', 'delivered_at', 'updated_at'])
        return self

    def mark_as_failed(self, error_message=None):
        """Mark this delivery as failed"""
        self.status = 'failed'
        if error_message:
            self.error_message = error_message
        self.save(update_fields=['status', 'error_message', 'updated_at'])
        return self
