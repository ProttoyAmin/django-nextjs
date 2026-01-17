# apps/notifications/serializers.py
from rest_framework import serializers
from .models import Notification, NotificationActor, NotificationTarget, NotificationDelivery
from django.contrib.contenttypes.models import ContentType


class NotificationActorSerializer(serializers.ModelSerializer):
    """Serializer for notification actors (users who triggered the notification)"""
    actor_id = serializers.IntegerField(source='actor.id', read_only=True)
    username = serializers.CharField(source='actor.username', read_only=True)
    first_name = serializers.CharField(
        source='actor.first_name', read_only=True)
    last_name = serializers.CharField(source='actor.last_name', read_only=True)
    avatar = serializers.SerializerMethodField()
    user_url = serializers.SerializerMethodField()

    class Meta:
        model = NotificationActor
        fields = ['actor_id', 'username', 'first_name',
                  'last_name', 'avatar', 'user_url']

    def get_avatar(self, obj):
        """Get actor's avatar"""
        if obj.actor.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.actor.profile_picture.url)
        return obj.actor.avatar

    def get_user_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/v1/accounts/auth/{obj.actor.id}/')
        return None


class NotificationTargetSerializer(serializers.ModelSerializer):
    """Serializer for notification targets (the content the notification is about)"""
    target_type = serializers.SerializerMethodField()
    target_id = serializers.IntegerField(source='object_id', read_only=True)
    target_url = serializers.SerializerMethodField()
    target_preview = serializers.SerializerMethodField()

    class Meta:
        model = NotificationTarget
        fields = ['target_type', 'target_id', 'target_url', 'target_preview']

    def get_target_type(self, obj):
        """Get the type of target (post, comment, user, etc.)"""
        return obj.content_type.model

    def get_target_url(self, obj):
        """Build URL for the target based on its type"""
        request = self.context.get('request')
        if not request:
            return None

        model_name = obj.content_type.model
        if model_name == 'post':
            return request.build_absolute_uri(f'/api/v1/posts/{obj.object_id}/')
        elif model_name == 'comment':
            return request.build_absolute_uri(f'/api/v1/comments/{obj.object_id}/')
        elif model_name == 'user':
            return request.build_absolute_uri(f'/api/v1/accounts/auth/{obj.object_id}/')
        elif model_name == 'club':
            return request.build_absolute_uri(f'/api/v1/clubs/{obj.object_id}/')
        return None

    def get_target_preview(self, obj):
        """Get a preview of the target content"""
        try:
            target = obj.content_object
            if not target:
                return None

            model_name = obj.content_type.model
            if model_name == 'post':
                return {
                    'content': target.content[:100] if target.content else None,
                    'post_type': target.post_type if hasattr(target, 'post_type') else None,
                }
            elif model_name == 'comment':
                return {
                    'content': target.content[:100] if hasattr(target, 'content') else None,
                }
            elif model_name == 'user':
                return {
                    'username': target.username,
                    'first_name': target.first_name,
                    'last_name': target.last_name,
                }
            return None
        except Exception:
            return None


class NotificationDeliverySerializer(serializers.ModelSerializer):
    """Serializer for notification delivery tracking"""
    id = serializers.CharField(read_only=True)

    class Meta:
        model = NotificationDelivery
        fields = ['id', 'channel', 'status',
                  'sent_at', 'delivered_at', 'created_at']
        read_only_fields = ['id', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for notifications with actors and targets.
    Used for notification detail view.
    """
    id = serializers.CharField(read_only=True)
    actors = NotificationActorSerializer(many=True, read_only=True)
    targets = NotificationTargetSerializer(many=True, read_only=True)
    deliveries = NotificationDeliverySerializer(many=True, read_only=True)
    recipient_id = serializers.IntegerField(
        source='recipient.id', read_only=True)
    notification_url = serializers.SerializerMethodField()
    actor_count = serializers.SerializerMethodField()
    primary_actor = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'recipient_id', 'verb', 'description',
            'is_read', 'is_seen', 'created_at',
            'actors', 'actor_count', 'primary_actor',
            'targets', 'deliveries', 'notification_url'
        ]
        read_only_fields = ['id', 'recipient_id', 'created_at']

    def get_notification_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/v1/notifications/{obj.id}/')
        return None

    def get_actor_count(self, obj):
        """Get total number of actors for this notification"""
        return obj.actors.count()

    def get_primary_actor(self, obj):
        """Get the primary (most recent) actor"""
        actor = obj.actors.first()
        if actor:
            return NotificationActorSerializer(actor, context=self.context).data
        return None


class NotificationListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing notifications.
    Optimized for feed/list views with less detailed information.
    """
    id = serializers.CharField(read_only=True)
    primary_actor = serializers.SerializerMethodField()
    actor_count = serializers.SerializerMethodField()
    target_type = serializers.SerializerMethodField()
    target_id = serializers.SerializerMethodField()
    target_preview = serializers.SerializerMethodField()
    notification_url = serializers.SerializerMethodField()
    message = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'verb', 'description', 'is_read', 'is_seen',
            'primary_actor', 'actor_count',
            'target_type', 'target_id', 'target_preview',
            'notification_url', 'message', 'created_at'
        ]

    def get_primary_actor(self, obj):
        """Get the primary (most recent) actor"""
        actor = obj.actors.first()
        if actor:
            return {
                'id': actor.actor.id,
                'username': actor.actor.username,
                'first_name': actor.actor.first_name,
                'last_name': actor.actor.last_name,
                'avatar': self._get_avatar(actor.actor),
            }
        return None

    def _get_avatar(self, user):
        """Helper to get user avatar"""
        if user.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(user.profile_picture.url)
        return user.avatar

    def get_actor_count(self, obj):
        """Get total number of actors"""
        return obj.actors.count()

    def get_target_type(self, obj):
        """Get the type of the first target"""
        target = obj.targets.first()
        if target:
            return target.content_type.model
        return None

    def get_target_id(self, obj):
        """Get the ID of the first target"""
        target = obj.targets.first()
        if target:
            return target.object_id
        return None

    def get_target_preview(self, obj):
        """Get a preview of the first target"""
        target = obj.targets.first()
        if not target:
            return None

        try:
            content = target.content_object
            if not content:
                return None

            model_name = target.content_type.model
            if model_name == 'post':
                return content.content[:100] if content.content else None
            elif model_name == 'comment':
                return content.content[:100] if hasattr(content, 'content') else None
            return None
        except Exception:
            return None

    def get_notification_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/v1/notifications/{obj.id}/')
        return None

    def get_message(self, obj):
        """
        Generate a human-readable notification message.
        Examples:
        - "John liked your post"
        - "John and 3 others commented on your post"
        """
        actor_count = obj.actors.count()
        if actor_count == 0:
            return obj.description or "You have a new notification"

        first_actor = obj.actors.first()
        if not first_actor:
            return obj.description or "You have a new notification"

        actor_name = first_actor.actor.username
        verb_messages = {
            'post': 'created a new post',
            'like': 'liked your post',
            'comment': 'commented on your post',
            'follow_request': 'requested to follow you',
            'follow_accept': 'accepted your follow request',
            'mention': 'mentioned you',
            'share': 'shared your post',
            'reply': 'replied to your comment',
        }

        action = verb_messages.get(obj.verb, obj.verb)

        if actor_count == 1:
            return f"{actor_name} {action}"
        else:
            return f"{actor_name} and {actor_count - 1} others {action}"


class NotificationCountSerializer(serializers.Serializer):
    """Serializer for notification counts"""
    total = serializers.IntegerField()
    unread = serializers.IntegerField()
    unseen = serializers.IntegerField()
