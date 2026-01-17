# apps/notifications/views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Notification, NotificationDelivery
from .serializers import (
    NotificationSerializer,
    NotificationListSerializer,
    NotificationCountSerializer,
    NotificationDeliverySerializer,
)
from core.pagination import StandardResultsSetPagination


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_notifications(request):
    """
    Get all notifications for the current user.

    Query params:
    - type: Filter by notification type (post, like, comment, follow_request, follow_accept)
    - is_read: Filter by read status (true/false)
    - is_seen: Filter by seen status (true/false)
    - page: Page number for pagination
    """
    user = request.user
    notifications = Notification.objects.filter(recipient=user).prefetch_related(
        'actors__actor',
        'targets__content_type',
    )

    # Filter by notification type
    notification_type = request.query_params.get('type', None)
    if notification_type:
        # Support comma-separated types for multiple filtering
        types = [t.strip() for t in notification_type.split(',')]
        notifications = notifications.filter(verb__in=types)

    # Filter by read status
    is_read = request.query_params.get('is_read', None)
    if is_read is not None:
        notifications = notifications.filter(is_read=is_read.lower() == 'true')

    # Filter by seen status
    is_seen = request.query_params.get('is_seen', None)
    if is_seen is not None:
        notifications = notifications.filter(is_seen=is_seen.lower() == 'true')

    # Paginate
    paginator = StandardResultsSetPagination()
    paginated_notifications = paginator.paginate_queryset(
        notifications, request)

    serializer = NotificationListSerializer(
        paginated_notifications,
        many=True,
        context={'request': request}
    )

    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_detail(request, notification_id):
    """
    Get detailed information about a specific notification.
    Automatically marks the notification as seen.
    """
    notification = get_object_or_404(
        Notification.objects.prefetch_related(
            'actors__actor',
            'targets__content_type',
            'deliveries',
        ),
        id=notification_id,
        recipient=request.user
    )

    # Mark as seen when viewed
    notification.mark_as_seen()

    serializer = NotificationSerializer(
        notification, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_as_read(request, notification_id):
    """
    Mark a specific notification as read.
    """
    notification = get_object_or_404(
        Notification,
        id=notification_id,
        recipient=request.user
    )

    notification.mark_as_read()

    return Response({
        'message': 'Notification marked as read',
        'notification_id': str(notification.id),
        'is_read': True
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_as_seen(request, notification_id):
    """
    Mark a specific notification as seen.
    """
    notification = get_object_or_404(
        Notification,
        id=notification_id,
        recipient=request.user
    )

    notification.mark_as_seen()

    return Response({
        'message': 'Notification marked as seen',
        'notification_id': str(notification.id),
        'is_seen': True
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_as_read(request):
    """
    Mark all notifications as read for the current user.
    """
    count = Notification.mark_all_as_read(request.user)

    return Response({
        'message': 'All notifications marked as read',
        'count': count
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_as_seen(request):
    """
    Mark all notifications as seen for the current user.
    """
    count = Notification.mark_all_as_seen(request.user)

    return Response({
        'message': 'All notifications marked as seen',
        'count': count
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_counts(request):
    """
    Get notification counts for the current user.
    Returns total, unread, and unseen counts.
    """
    user = request.user
    total = Notification.objects.filter(recipient=user).count()
    unread = Notification.get_unread_count(user)
    unseen = Notification.get_unseen_count(user)

    data = {
        'total': total,
        'unread': unread,
        'unseen': unseen
    }

    serializer = NotificationCountSerializer(data)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, notification_id):
    """
    Delete a specific notification.
    """
    notification = get_object_or_404(
        Notification,
        id=notification_id,
        recipient=request.user
    )

    notification.delete()

    return Response({
        'message': 'Notification deleted successfully'
    }, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_all_notifications(request):
    """
    Delete all notifications for the current user.
    """
    count, _ = Notification.objects.filter(recipient=request.user).delete()

    return Response({
        'message': 'All notifications cleared',
        'count': count
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_deliveries(request, notification_id):
    """
    Get delivery status for a specific notification.
    """
    notification = get_object_or_404(
        Notification,
        id=notification_id,
        recipient=request.user
    )

    deliveries = NotificationDelivery.objects.filter(notification=notification)
    serializer = NotificationDeliverySerializer(deliveries, many=True)

    return Response(serializer.data)


# ==================== FILTER SHORTCUTS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def post_notifications(request):
    """
    Get all post-related notifications (new posts from followed users/clubs).
    """
    notifications = Notification.objects.filter(
        recipient=request.user,
        verb='post'
    ).prefetch_related('actors__actor', 'targets__content_type')

    paginator = StandardResultsSetPagination()
    paginated_notifications = paginator.paginate_queryset(
        notifications, request)

    serializer = NotificationListSerializer(
        paginated_notifications,
        many=True,
        context={'request': request}
    )

    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def like_notifications(request):
    """
    Get all like notifications.
    """
    notifications = Notification.objects.filter(
        recipient=request.user,
        verb='like'
    ).prefetch_related('actors__actor', 'targets__content_type')

    paginator = StandardResultsSetPagination()
    paginated_notifications = paginator.paginate_queryset(
        notifications, request)

    serializer = NotificationListSerializer(
        paginated_notifications,
        many=True,
        context={'request': request}
    )

    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def comment_notifications(request):
    """
    Get all comment notifications.
    """
    notifications = Notification.objects.filter(
        recipient=request.user,
        verb='comment'
    ).prefetch_related('actors__actor', 'targets__content_type')

    paginator = StandardResultsSetPagination()
    paginated_notifications = paginator.paginate_queryset(
        notifications, request)

    serializer = NotificationListSerializer(
        paginated_notifications,
        many=True,
        context={'request': request}
    )

    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def follow_request_notifications(request):
    """
    Get all follow request notifications.
    """
    notifications = Notification.objects.filter(
        recipient=request.user,
        verb='follow_request'
    ).prefetch_related('actors__actor', 'targets__content_type')

    paginator = StandardResultsSetPagination()
    paginated_notifications = paginator.paginate_queryset(
        notifications, request)

    serializer = NotificationListSerializer(
        paginated_notifications,
        many=True,
        context={'request': request}
    )

    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def follow_accept_notifications(request):
    """
    Get all follow accept notifications.
    """
    notifications = Notification.objects.filter(
        recipient=request.user,
        verb='follow_accept'
    ).prefetch_related('actors__actor', 'targets__content_type')

    paginator = StandardResultsSetPagination()
    paginated_notifications = paginator.paginate_queryset(
        notifications, request)

    serializer = NotificationListSerializer(
        paginated_notifications,
        many=True,
        context={'request': request}
    )

    return paginator.get_paginated_response(serializer.data)
