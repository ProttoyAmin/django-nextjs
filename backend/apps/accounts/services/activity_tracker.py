"""
Activity Tracker Service
Handles user activity tracking with Redis
"""
import redis
import time
import logging
from django.conf import settings
from django.contrib.auth import get_user_model
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

User = get_user_model()
logger = logging.getLogger(__name__)

# Initialize Redis connection
redis_client = redis.Redis(
    host=settings.REDIS_HOST if hasattr(
        settings, 'REDIS_HOST') else '127.0.0.1',
    port=settings.REDIS_PORT if hasattr(settings, 'REDIS_PORT') else 6379,
    db=settings.REDIS_DB if hasattr(settings, 'REDIS_DB') else 0,
    decode_responses=True
)


def get_activity_key(user_id):
    """Generate Redis key for user activity"""
    return f"user_activity:{user_id}"


def get_connection_count_key(user_id):
    """Generate Redis key for connection count"""
    return f"user_connections:{user_id}"


async def update_user_activity(user_id):
    """
    Update user's last activity timestamp in Redis
    """
    try:
        key = get_activity_key(user_id)
        timestamp = int(time.time())
        redis_client.set(key, timestamp)
        # Set expiry to prevent stale data
        redis_client.expire(key, settings.ACTIVITY_TIMEOUT + 60)
        return True
    except Exception as e:
        logger.error(f"Error updating activity for user {user_id}: {str(e)}")
        return False


def get_last_activity(user_id):
    """
    Get user's last activity timestamp from Redis
    Returns timestamp or None if not found
    """
    try:
        key = get_activity_key(user_id)
        timestamp = redis_client.get(key)
        return int(timestamp) if timestamp else None
    except Exception as e:
        logger.error(f"Error getting activity for user {user_id}: {str(e)}")
        return None


def is_user_inactive(user_id):
    """
    Check if user has been inactive for longer than ACTIVITY_TIMEOUT
    """
    last_activity = get_last_activity(user_id)
    if last_activity is None:
        return True

    current_time = int(time.time())
    inactive_duration = current_time - last_activity
    return inactive_duration > settings.ACTIVITY_TIMEOUT


def mark_user_online(user_id, manual=False):
    """
    Mark user as online in the database and broadcast the change
    """
    try:
        user = User.objects.get(id=user_id)

        # If it's a manual update, we set the status and clear manual flag
        # (Online is always considered auto-resumable)
        if manual:
            user.status = 'online'
            user.is_status_manual = False
            user.save(update_fields=['status', 'is_status_manual'])
            broadcast_status_change(user_id, 'online')
            logger.info(f"User {user.username} manually set to online")
            return True

        # If it's an auto update (connect/activity)
        # We only turn online if they aren't manually set to something else (Away/DND)
        if user.is_status_manual:
            logger.info(
                f"User {user.username} is manually {user.status}, skipping auto-online")
            return False

        if user.status != 'online':
            user.status = 'online'
            user.save(update_fields=['status'])
            broadcast_status_change(user_id, 'online')
            logger.info(f"User {user.username} auto-marked as online")

        return True

    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return False
    except Exception as e:
        logger.error(f"Error marking user {user_id} as online: {str(e)}")
        return False


def mark_user_away(user_id, manual=False):
    """
    Mark user as away in the database and broadcast the change
    """
    try:
        user = User.objects.get(id=user_id)

        # If it's a manual update, set status and manual flag
        if manual:
            user.status = 'away'
            user.is_status_manual = True
            user.save(update_fields=['status', 'is_status_manual'])
            broadcast_status_change(user_id, 'away')
            logger.info(f"User {user.username} manually set to away")
            return True

        # If it's an auto update (disconnect/inactivity)
        # We only mark away if they were online or already auto-away
        # (If they were manual DND or manual Away, we don't change anything,
        # but calling this doesn't hurt)
        if user.status == 'online':
            user.status = 'away'
            # Auto-away stays non-manual
            user.is_status_manual = False
            user.save(update_fields=['status', 'is_status_manual'])
            broadcast_status_change(user_id, 'away')
            logger.info(f"User {user.username} auto-marked as away")

        return True

    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return False
    except Exception as e:
        logger.error(f"Error marking user {user_id} as away: {str(e)}")
        return False


def increment_connection(user_id):
    """
    Increment user's WebSocket connection count in Redis
    """
    try:
        key = get_connection_count_key(user_id)
        count = redis_client.incr(key)
        logger.info(f"User {user_id} connection count incremented to {count}")
        return count
    except Exception as e:
        logger.error(
            f"Error incrementing connections for user {user_id}: {str(e)}")
        return 0


def decrement_connection(user_id):
    """
    Decrement user's WebSocket connection count in Redis
    """
    try:
        key = get_connection_count_key(user_id)
        count = redis_client.decr(key)
        if count < 0:
            redis_client.set(key, 0)
            count = 0
        logger.info(f"User {user_id} connection count decremented to {count}")
        return count
    except Exception as e:
        logger.error(
            f"Error decrementing connections for user {user_id}: {str(e)}")
        return 0


def get_connection_count(user_id):
    """
    Get user's current connection count from Redis
    """
    try:
        key = get_connection_count_key(user_id)
        count = redis_client.get(key)
        return int(count) if count else 0
    except Exception as e:
        logger.error(
            f"Error getting connection count for user {user_id}: {str(e)}")
        return 0


def broadcast_status_change(user_id, new_status):
    """
    Broadcast status change to user's WebSocket channel and followers
    """
    try:
        user = User.objects.get(id=user_id)
        channel_layer = get_channel_layer()
        room_group_name = f'user_activity_{user_id}'

        # Send to user's own channel
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            {
                'type': 'status_update',
                'user_id': str(user_id),
                'status': new_status,
                'is_status_manual': user.is_status_manual,
            }
        )

        # TODO: Broadcast to followers/friends when those features are implemented
        # This would involve getting the user's followers and sending updates to their channels

        logger.info(
            f"Broadcasted status change for user {user_id} to {new_status}")
        return True

    except Exception as e:
        logger.error(f"Error broadcasting status change: {str(e)}")
        return False


def check_inactive_users():
    """
    Check all online users and mark inactive ones as away
    This function should be called periodically (e.g., every 1-2 minutes)
    """
    try:
        # Get all users with status='online'
        online_users = User.objects.filter(status='online')
        marked_away_count = 0

        for user in online_users:
            if is_user_inactive(str(user.id)):
                if mark_user_away(str(user.id)):
                    marked_away_count += 1

        logger.info(
            f"Checked {online_users.count()} online users, marked {marked_away_count} as away")
        return marked_away_count

    except Exception as e:
        logger.error(f"Error checking inactive users: {str(e)}")
        return 0
