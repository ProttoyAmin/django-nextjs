# apps/notifications/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json
from apps.connections.models import Follow
from apps.interactions.models import Like, Comment
from .models import Notification, NotificationActor, NotificationTarget, NotificationDelivery


@receiver(post_save, sender=Follow)
def create_follow_notification(sender, instance, created, **kwargs):
    """
    Create a notification when a follow relationship is created or updated.

    - If created with status 'pending': Create a 'follow_request' notification
    - If created with status 'accepted': Create a 'follow_accept' notification (direct follow)
    - If updated from 'pending' to 'accepted': Create a 'follow_accept' notification
    """
    if created:
        # New follow created
        if instance.status == 'pending':
            # Follow request sent to a private account
            _create_follow_request_notification(instance)
        elif instance.status == 'accepted':
            # Direct follow (public account) - notify the user being followed
            _create_new_follower_notification(instance)
    else:
        # Follow updated - check if status changed to accepted
        if instance.status == 'accepted':
            # Follow request was accepted - notify the requester
            _create_follow_accepted_notification(instance)


def _create_follow_request_notification(follow):
    """Create notification for a new follow request (pending status)"""
    # Notify the user being followed that they have a new follow request
    notification = Notification.objects.create(
        recipient=follow.following,
        verb='follow_request',
        description=f'{follow.follower.username} requested to follow you.'
    )

    # Add the follower as the actor
    NotificationActor.objects.create(
        notification=notification,
        actor=follow.follower
    )

    # Add the follow as the target
    NotificationTarget.objects.create(
        notification=notification,
        content_type=ContentType.objects.get_for_model(Follow),
        object_id=follow.id
    )

    # Create in-app delivery record
    NotificationDelivery.objects.create(
        notification=notification,
        channel='in_app',
        status='delivered'
    )

    # Send real-time notification via WebSocket
    _send_websocket_notification(notification, follow.following)

    return notification


def _create_new_follower_notification(follow):
    """Create notification when someone directly follows you (public account)"""
    # Notify the user being followed
    notification = Notification.objects.create(
        recipient=follow.following,
        verb='follow_accept',  # Using follow_accept as the verb for "started following"
        description=f'{follow.follower.username} started following you.'
    )

    # Add the follower as the actor
    NotificationActor.objects.create(
        notification=notification,
        actor=follow.follower
    )

    # Add the follow as the target
    NotificationTarget.objects.create(
        notification=notification,
        content_type=ContentType.objects.get_for_model(Follow),
        object_id=follow.id
    )

    # Create in-app delivery record
    NotificationDelivery.objects.create(
        notification=notification,
        channel='in_app',
        status='delivered'
    )

    # Send real-time notification via WebSocket
    _send_websocket_notification(notification, follow.following)

    return notification


def _create_follow_accepted_notification(follow):
    """Create notification when a follow request is accepted"""
    # Notify the original requester that their request was accepted
    notification = Notification.objects.create(
        recipient=follow.follower,
        verb='follow_accept',
        description=f'{follow.following.username} accepted your follow request.'
    )

    # Add the person who accepted as the actor
    NotificationActor.objects.create(
        notification=notification,
        actor=follow.following
    )

    # Add the follow as the target
    NotificationTarget.objects.create(
        notification=notification,
        content_type=ContentType.objects.get_for_model(Follow),
        object_id=follow.id
    )

    # Create in-app delivery record
    NotificationDelivery.objects.create(
        notification=notification,
        channel='in_app',
        status='delivered'
    )

    # Send real-time notification via WebSocket
    _send_websocket_notification(notification, follow.follower)

    return notification


def _send_websocket_notification(notification, target, recipient):
    """
    Send a real-time notification via WebSocket.
    This will push the notification to the user's notification channel.
    """
    try:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return

        # Get primary actor info
        primary_actor = notification.actors.first()
        actor_data = None
        target_data = None
        if primary_actor:
            actor_data = {
                'id': primary_actor.actor.id,
                'username': primary_actor.actor.username,
                'first_name': primary_actor.actor.first_name,
                'last_name': primary_actor.actor.last_name,
                'avatar': primary_actor.actor.avatar or None,
            }
            
        if target:
            target_data = {
                'id': target['id'],
            }

        # Prepare notification data
        notification_data = {
            'type': 'notification_message',
            'notification': {
                'id': str(notification.id),
                'verb': notification.verb,
                'description': notification.description,
                'is_read': notification.is_read,
                'is_seen': notification.is_seen,
                'primary_actor': actor_data,
                'actor_count': notification.actors.count(),
                'target': target_data,
                'created_at': notification.created_at.isoformat(),
            }
        }

        # Send to the recipient's personal notification channel
        async_to_sync(channel_layer.group_send)(
            f'notifications_{recipient.id}',
            notification_data
        )
    except Exception as e:
        # Log the error but don't fail the signal
        print(f"Failed to send WebSocket notification: {e}")


@receiver(post_save, sender=Like)
def create_like_notification(sender, instance, created, **kwargs):
    """
    Create a notification when a Like is created.
    Notify the owner of the post that someone liked their post.
    """
    if not created:
        return None

    liker = instance.user

    # Get the liked content using GenericForeignKey
    liked_content = instance.content_object
    
    if liked_content is None:
        return None

    # Check if the liked content is a Post (has an author attribute)
    if not hasattr(liked_content, 'author'):
        return None

    post_owner = liked_content.author
    target_object = instance.content_object.__dict__

    # Don't notify if user liked their own post
    if liker == post_owner:
        return None

    # Create notification
    notification = Notification.objects.create(
        recipient=post_owner,
        verb='like',
        description=f'{liker.username} liked your post.'
    )

    # Add the liker as the actor
    NotificationActor.objects.create(
        notification=notification,
        actor=liker
    )

    # Add the like as the target
    NotificationTarget.objects.create(
        notification=notification,
        content_type=ContentType.objects.get_for_model(Like),
        object_id=instance.id
    )

    # Create in-app delivery record
    NotificationDelivery.objects.create(
        notification=notification,
        channel='in_app',
        status='delivered'
    )

    # Send real-time notification via WebSocket
    _send_websocket_notification(notification, target_object, post_owner)

    return notification
