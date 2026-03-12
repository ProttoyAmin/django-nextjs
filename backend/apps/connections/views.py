# apps/followers/views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import Follow, Block, FollowRequest
from . import serializers
from apps.accounts.models import User


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# ==================== FOLLOW/UNFOLLOW ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_follow(request, user_id):
    """
    Follow or unfollow a user (toggle)
    - If target user is private: creates pending request
    - If target user is public: creates accepted follow
    - If already following: unfollows
    """
    target_user = get_object_or_404(User, pk=user_id)
    
    if request.user == target_user:
        return Response(
            {'detail': 'You cannot follow yourself.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if Block.has_blocked_each_other(request.user, target_user):
        return Response(
            {'detail': 'Unable to follow this user.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Check if already following
    existing_follow = Follow.objects.filter(
        follower=request.user,
        following=target_user
    ).first()

    if existing_follow:
        # Unfollow
        existing_follow.delete()
        return Response({
            'detail': f'Unfollowed {target_user.username}.',
            'is_following': False,
            'status': None
        })

    # Create new follow
    # Notifications are created automatically via signals in apps.notifications.signals
    follow_status = 'pending' if target_user.is_private else 'accepted'
    follow = Follow.objects.create(
        follower=request.user,
        following=target_user,
        status=follow_status
    )

    # Create follow request if pending
    if follow_status == 'pending':
        FollowRequest.objects.create(follow=follow)

    return Response({
        'detail': f'Follow request sent to {target_user.username}.' if follow_status == 'pending' else f'Now following {target_user.username}.',
        'is_following': True,
        'status': follow_status
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def follow_status(request, user_id):
    """
    Get follow status between current user and target user
    """
    target_user = get_object_or_404(User, pk=user_id)

    # Check outgoing follow (you -> them)
    sent_follow = Follow.objects.filter(follower=request.user, following=target_user).first()
    
    # Check incoming follow (them -> you)
    received_follow = Follow.objects.filter(follower=target_user, following=request.user).first()

    is_following = sent_follow.status == 'accepted' if sent_follow else False
    is_followed_by = received_follow.status == 'accepted' if received_follow else False
    is_mutual = is_following and is_followed_by
    
    # follow_status_value represents YOUR follow status toward THEM
    follow_status_value = sent_follow.status if sent_follow else None
    
    # Determine the verb based on pending requests
    verb = None
    if sent_follow and sent_follow.status == 'pending':
        verb = 'sent'
    elif received_follow and received_follow.status == 'pending':
        verb = 'received'

    serializer = serializers.FollowStatusSerializer({
        'is_following': is_following,
        'is_followed_by': is_followed_by,
        'is_mutual': is_mutual,
        'follow_status': follow_status_value,
        'verb': verb
    })

    return Response(serializer.data)


# ==================== FOLLOWERS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_followers(request, user_id):
    """
    Get list of users following this user
    """
    target_user = get_object_or_404(User, pk=user_id)

    # Check if viewer can see followers
    if not target_user.can_view_profile(request.user):
        return Response(
            {'detail': 'You do not have permission to view this user\'s followers.'},
            status=status.HTTP_403_FORBIDDEN
        )

    followers = Follow.objects.filter(
        following=target_user,
        status='accepted'
    ).select_related('follower').order_by('-created_at')

    # Optional: search in followers
    search = request.query_params.get('search')
    if search:
        followers = followers.filter(follower__username__icontains=search)

    paginator = StandardResultsSetPagination()
    paginated_followers = paginator.paginate_queryset(followers, request)

    serializer = serializers.FollowerSerializer(
        paginated_followers,
        many=True,
        context={'request': request}
    )

    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_following(request, user_id):
    """
    Get list of users this user is following
    """
    target_user = get_object_or_404(User, pk=user_id)

    # Check if viewer can see following list
    if not target_user.can_view_profile(request.user):
        return Response(
            {'detail': 'You do not have permission to view this user\'s following list.'},
            status=status.HTTP_403_FORBIDDEN
        )

    following = Follow.objects.filter(
        follower=target_user,
        status='accepted'
    ).select_related('following').order_by('-created_at')

    # Optional: search in following
    search = request.query_params.get('search')
    if search:
        following = following.filter(following__username__icontains=search)

    paginator = StandardResultsSetPagination()
    paginated_following = paginator.paginate_queryset(following, request)

    serializer = serializers.FollowingSerializer(
        paginated_following,
        many=True,
        context={'request': request}
    )

    return paginator.get_paginated_response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_follower(request, user_id):
    """
    Remove a follower (they were following you, you remove them)
    """
    follower_user = get_object_or_404(User, pk=user_id)

    follow = Follow.objects.filter(
        follower=follower_user,
        following=request.user
    ).first()

    if not follow:
        return Response(
            {'detail': 'This user is not following you.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    follow.delete()

    return Response({
        'detail': f'Removed {follower_user.username} from your followers.'
    })


# ==================== FOLLOW REQUESTS (FOR PRIVATE ACCOUNTS) ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_follow_requests(request):
    """
    Get all pending follow requests for current user
    """
    pending_follows = Follow.objects.filter(
        following=request.user,
        status='pending'
    ).select_related('follower').order_by('-created_at')

    paginator = StandardResultsSetPagination()
    paginated_requests = paginator.paginate_queryset(pending_follows, request)

    # serializer = serializers.FollowerSerializer(
    #     paginated_requests,
    #     many=True,
    #     context={'request': request}
    # )

    requests_data = [
        {
            'request_id': str(pending.id),
            'user': {
                'user_id': pending.follower.id,
                'username': pending.follower.username,
                'first_name': pending.follower.first_name,
                'last_name': pending.follower.last_name,
                'profile_picture': request.build_absolute_uri(pending.follower.profile_picture.url) if pending.follower.profile_picture else None,
                'bio': pending.follower.bio,
                'you_follow_them': Follow.is_following(request.user, pending.follower),
                'your_follow_status': Follow.get_follow_status(request.user, pending.follower),
                'is_private': pending.follower.is_private,
                'status': pending.status
            },
            'requested_at': pending.created_at,
            'actions': {
                'accept_url': request.build_absolute_uri(f'/api/v1/connections/requests/{pending.follower.id}/accept/'),
                'reject_url': request.build_absolute_uri(f'/api/v1/connections/requests/{pending.follower.id}/reject/'),
            }
        }
        for pending in paginated_requests
    ]

    return paginator.get_paginated_response({
        'total_pending': pending_follows.count(),
        'requests': requests_data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_follow_request(request, user_id):
    """
    Accept a pending follow request
    """
    requester = get_object_or_404(User, pk=user_id)

    follow = Follow.objects.filter(
        follower=requester,
        following=request.user,
        status='pending'
    ).first()

    if not follow:
        return Response(
            {'detail': 'No pending follow request from this user.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    follow.status = 'accepted'
    follow.save()

    return Response({
        'detail': f'Accepted follow request from {requester.username}.'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_follow_request(request, user_id):
    """
    Reject/delete a pending follow request
    """
    requester = get_object_or_404(User, pk=user_id)

    follow = Follow.objects.filter(
        follower=requester,
        following=request.user,
        status='pending'
    ).first()

    if not follow:
        return Response(
            {'detail': 'No pending follow request from this user.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    follow.delete()

    return Response({
        'detail': f'Rejected follow request from {requester.username}.'
    })


# ==================== BLOCKING ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def block_user(request, user_id):
    """
    Block a user
    - Removes any existing follow relationships
    - Prevents future follows
    """
    target_user = get_object_or_404(User, pk=user_id)

    if request.user == target_user:
        return Response(
            {'detail': 'You cannot block yourself.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if already blocked
    if Block.objects.filter(blocker=request.user, blocked=target_user).exists():
        return Response(
            {'detail': 'User is already blocked.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create block (this will auto-remove follows in the model's save method)
    Block.objects.create(blocker=request.user, blocked=target_user)

    return Response({
        'detail': f'Blocked {target_user.username}.'
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unblock_user(request, user_id):
    """
    Unblock a user
    """
    target_user = get_object_or_404(User, pk=user_id)

    block = Block.objects.filter(
        blocker=request.user, blocked=target_user).first()

    if not block:
        return Response(
            {'detail': 'User is not blocked.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    block.delete()

    return Response({
        'detail': f'Unblocked {target_user.username}.'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_blocked_users(request):
    """
    Get list of users current user has blocked
    """
    blocked = Block.objects.filter(
        blocker=request.user).select_related('blocked')

    paginator = StandardResultsSetPagination()
    paginated_blocked = paginator.paginate_queryset(blocked, request)

    serializer = serializers.BlockedUserSerializer(
        paginated_blocked,
        many=True,
        context={'request': request}
    )

    return paginator.get_paginated_response(serializer.data)


# ==================== SUGGESTIONS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def suggested_users(request):
    """
    Get suggested users to follow
    Based on:
    - Users with mutual followers
    - Users in same clubs
    - Popular users
    """
    # Get users current user is already following
    following_ids = Follow.objects.filter(
        follower=request.user,
        status='accepted'
    ).values_list('following_id', flat=True)

    # Get users current user has blocked or is blocked by
    blocked_ids = list(Block.objects.filter(
        Q(blocker=request.user) | Q(blocked=request.user)
    ).values_list('blocked_id', flat=True)) + list(Block.objects.filter(
        Q(blocker=request.user) | Q(blocked=request.user)
    ).values_list('blocker_id', flat=True))

    # Get suggestions (users not already following and not blocked)
    from django.db.models import Count
    suggestions = User.objects.exclude(
        id__in=list(following_ids) + [request.user.id] + blocked_ids
    ).annotate(
        total_followers=Count('follower_set', filter=Q(
            follower_set__status='accepted'))
    ).order_by('-total_followers')[:20]

    # Serialize
    suggestions_data = []
    for user in suggestions:
        suggestions_data.append({
            'user_id': user.id,
            'username': user.username,
            'avatar': user.avatar,
            'profile_picture_url': request.build_absolute_uri(user.profile_picture.url if user.profile_picture else None),
            'bio': user.bio,
            'total_followers': user.total_followers,
            'is_private': user.is_private,
            'user_url': request.build_absolute_uri(f'/api/v1/accounts/auth/{user.id}/')
        })

    return Response({
        'suggestions': suggestions_data
    })


# ==================== MUTUAL FOLLOWERS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mutual_followers(request, user_id):
    """
    Get mutual followers between current user and target user
    """
    target_user = get_object_or_404(User, pk=user_id)

    # Get current user's followers
    current_user_followers = set(Follow.objects.filter(
        following=request.user,
        status='accepted'
    ).values_list('follower_id', flat=True))

    # Get target user's followers
    target_user_followers = set(Follow.objects.filter(
        following=target_user,
        status='accepted'
    ).values_list('follower_id', flat=True))

    # Find mutual
    mutual_ids = current_user_followers.intersection(target_user_followers)

    mutual_users = User.objects.filter(id__in=mutual_ids)

    mutual_data = [
        {
            'user_id': user.id,
            'username': user.username,
            'avatar': request.build_absolute_uri(user.profile_picture.url if user.profile_picture else None),
            'user_url': request.build_absolute_uri(f'/api/v1/accounts/auth/{user.id}/')
        }
        for user in mutual_users
    ]

    return Response({
        'mutual_count': len(mutual_data),
        'mutual_followers': mutual_data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def relationship_view(request, user_id):
    """
    Get comprehensive relationship information between current user and target user
    Returns:
    - Follow status (is_following, is_followed_by, is_mutual, follow_status)
    - Block status (is_blocked, is_blocking)
    - Mutual followers count
    - Privacy status
    """
    target_user = get_object_or_404(User, pk=user_id)

    # If viewing own profile
    if request.user == target_user:
        return Response({
            'is_self': True,
            'user_id': target_user.id,
            'username': target_user.username,
            'is_private': target_user.is_private,
            'followers_count': Follow.objects.filter(following=target_user, status='accepted').count(),
            'following_count': Follow.objects.filter(follower=target_user, status='accepted').count(),
        })

    # Check block status
    is_blocked_by_target = Block.objects.filter(
        blocker=target_user, blocked=request.user).exists()
    is_blocking_target = Block.objects.filter(
        blocker=request.user, blocked=target_user).exists()

    # If blocked, return limited info
    if is_blocked_by_target or is_blocking_target:
        return Response({
            'is_self': False,
            'user_id': target_user.id,
            'username': target_user.username,
            'is_blocked': is_blocked_by_target,
            'is_blocking': is_blocking_target,
            'can_view_profile': False,
            'detail': 'Unable to view relationship with this user.'
        })

    # Get follow relationships
    is_following = Follow.is_following(request.user, target_user)
    is_followed_by = Follow.is_following(target_user, request.user)
    is_mutual = Follow.are_mutual_followers(request.user, target_user)
    follow_status_value = Follow.get_follow_status(request.user, target_user)

    # Get mutual followers count
    current_user_followers = set(Follow.objects.filter(
        following=request.user,
        status='accepted'
    ).values_list('follower_id', flat=True))

    target_user_followers = set(Follow.objects.filter(
        following=target_user,
        status='accepted'
    ).values_list('follower_id', flat=True))

    mutual_followers_count = len(
        current_user_followers.intersection(target_user_followers))

    # Check if can view profile (assuming you have this method on User model)
    # If not, replace with: can_view_profile = not target_user.is_private or is_following
    can_view_profile = target_user.can_view_profile(request.user)

    # Get follower/following counts
    followers_count = Follow.objects.filter(
        following=target_user, status='accepted').count()
    following_count = Follow.objects.filter(
        follower=target_user, status='accepted').count()

    return Response({
        'is_self': False,
        'user_id': target_user.id,
        'username': target_user.username,
        'is_private': target_user.is_private,

        # Follow status
        'is_following': is_following,
        'is_followed_by': is_followed_by,
        'is_mutual': is_mutual,
        'follow_status': follow_status_value,  # 'pending', 'accepted', or None

        # Block status
        'is_blocked': is_blocked_by_target,
        'is_blocking': is_blocking_target,

        # Counts
        'followers_count': followers_count,
        'following_count': following_count,
        'mutual_followers_count': mutual_followers_count,

        # Permissions
        'can_view_profile': can_view_profile,
        'can_send_message': is_mutual,  # Example: only mutual followers can message
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_relationships(request):
    """
    Get comprehensive overview of current user's relationships
    Categories:
    - mutual: Users who follow each other
    - followers_only: Users who follow you but you don't follow back
    - following_only: Users you follow but don't follow you back
    - pending_received: Follow requests you received (pending)
    - pending_sent: Follow requests you sent (pending)
    """
    user = request.user

    # Get all accepted follows where user is following someone
    user_following = Follow.objects.filter(
        follower=user,
        status='accepted'
    ).select_related('following')

    # Get all accepted follows where user is being followed
    user_followers = Follow.objects.filter(
        following=user,
        status='accepted'
    ).select_related('follower')

    # Get pending requests received (others want to follow you)
    pending_received = Follow.objects.filter(
        following=user,
        status='pending'
    ).select_related('follower').order_by('-created_at')

    # Get pending requests sent (you want to follow others)
    pending_sent = Follow.objects.filter(
        follower=user,
        status='pending'
    ).select_related('following').order_by('-created_at')

    # Create sets for efficient lookup
    following_ids = set(user_following.values_list('following_id', flat=True))
    follower_ids = set(user_followers.values_list('follower_id', flat=True))

    # Find mutual followers
    mutual_ids = following_ids.intersection(follower_ids)

    # Find followers only (they follow you, you don't follow back)
    followers_only_ids = follower_ids - following_ids

    # Find following only (you follow them, they don't follow back)
    following_only_ids = following_ids - follower_ids

    # Serialize mutual followers
    mutual_users = User.objects.filter(id__in=mutual_ids)
    mutual_data = [
        {
            'user_id': u.id,
            'username': u.username,
            'profile_picture': request.build_absolute_uri(u.profile_picture.url) if u.profile_picture else None,
            'bio': u.bio,
            'is_private': u.is_private,
        }
        for u in mutual_users
    ]

    # Serialize followers only
    followers_only_users = User.objects.filter(id__in=followers_only_ids)
    followers_only_data = [
        {
            'user_id': u.id,
            'username': u.username,
            'profile_picture': request.build_absolute_uri(u.profile_picture.url) if u.profile_picture else None,
            'bio': u.bio,
            'is_private': u.is_private,
        }
        for u in followers_only_users
    ]

    # Serialize following only
    following_only_users = User.objects.filter(id__in=following_only_ids)
    following_only_data = [
        {
            'user_id': u.id,
            'username': u.username,
            'profile_picture': request.build_absolute_uri(u.profile_picture.url) if u.profile_picture else None,
            'bio': u.bio,
            'is_private': u.is_private,
        }
        for u in following_only_users
    ]

    # Serialize pending received
    pending_received_data = [
        {
            'user_id': follow.follower.id,
            'username': follow.follower.username,
            'profile_picture': request.build_absolute_uri(follow.follower.profile_picture.url) if follow.follower.profile_picture else None,
            'bio': follow.follower.bio,
            'requested_at': follow.created_at,
        }
        for follow in pending_received
    ]

    # Serialize pending sent
    pending_sent_data = [
        {
            'user_id': follow.following.id,
            'username': follow.following.username,
            'profile_picture': request.build_absolute_uri(follow.following.profile_picture.url) if follow.following.profile_picture else None,
            'bio': follow.following.bio,
            'is_private': follow.following.is_private,
            'requested_at': follow.created_at,
        }
        for follow in pending_sent
    ]

    return Response({
        'summary': {
            'total_followers': len(follower_ids),
            'total_following': len(following_ids),
            'total_mutual': len(mutual_ids),
            'pending_requests_received': pending_received.count(),
            'pending_requests_sent': pending_sent.count(),
        },
        'mutual': {
            'count': len(mutual_data),
            'users': mutual_data
        },
        'followers_only': {
            'count': len(followers_only_data),
            'users': followers_only_data
        },
        'following_only': {
            'count': len(following_only_data),
            'users': following_only_data
        },
        'pending_received': {
            'count': len(pending_received_data),
            'requests': pending_received_data
        },
        'pending_sent': {
            'count': len(pending_sent_data),
            'requests': pending_sent_data
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_request_view(request):
    """
    Get only pending follow requests received by current user
    (Others want to follow you, waiting for your approval)
    """

    user = request.user

    pending_requests = Follow.objects.filter(
        follower=user,
        status='pending',
    ).select_related('following').order_by('created_at')

    paginator = StandardResultsSetPagination()
    paginated_requests = paginator.paginate_queryset(pending_requests, request)

    requests_data = [
        {
            'request_id': pending.id,
            'user': {
                'user_id': pending.follower.id,
                'username': pending.follower.username,
                'profile_picture': request.build_absolute_uri(pending.follower.profile_picture.url) if pending.follower.profile_picture else None,
                'bio': pending.follower.bio,
                'first_name': pending.follower.first_name,
                'last_name': pending.follower.last_name,
            },
            'requested_at': pending.created_at,
            'actions': {
                'accept_url': request.build_absolute_uri(f'/api/v1/followers/accept/{pending.follower.id}/'),
                'reject_url': request.build_absolute_uri(f'/api/v1/followers/reject/{pending.follower.id}/'),
            }
        }
        for pending in paginated_requests
    ]

    return paginator.get_paginated_response({
        'total_pending': pending_requests.count(),
        'requests': requests_data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sent_requests_view(request):
    """
    Get only pending follow requests sent by current user
    (You want to follow others, waiting for their approval)
    """
    user = request.user

    sent_requests = Follow.objects.filter(
        follower=user,
        status='pending'
    ).select_related('following').order_by('-created_at')

    # Apply pagination
    paginator = StandardResultsSetPagination()
    paginated_requests = paginator.paginate_queryset(sent_requests, request)

    # Serialize
    requests_data = [
        {
            'request_id': follow.id,
            'user': {
                'user_id': follow.following.id,
                'username': follow.following.username,
                'profile_picture': request.build_absolute_uri(follow.following.profile_picture.url) if follow.following.profile_picture else None,
                'bio': follow.following.bio,
                'is_private': follow.following.is_private,
                'first_name': follow.following.first_name,
                'last_name': follow.following.last_name,
            },
            'requested_at': follow.created_at,
            'actions': {
                'cancel_url': request.build_absolute_uri(f'/api/v1/followers/toggle/{follow.following.id}/'),
            }
        }
        for follow in paginated_requests
    ]

    return paginator.get_paginated_response({
        'total_sent': sent_requests.count(),
        'requests': requests_data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def connected_followers_view(request):
    """
    Get only mutual followers (users who follow each other with current user)
    """
    user = request.user

    # Get users current user is following (accepted)
    following_ids = set(Follow.objects.filter(
        follower=user,
        status='accepted'
    ).values_list('following_id', flat=True))

    # Get users following current user (accepted)
    follower_ids = set(Follow.objects.filter(
        following=user,
        status='accepted'
    ).values_list('follower_id', flat=True))

    # Find mutual
    mutual_ids = following_ids.intersection(follower_ids)

    # Get User objects
    mutual_users = User.objects.filter(id__in=mutual_ids)

    # Optional: search in mutual followers
    search = request.query_params.get('search')
    if search:
        mutual_users = mutual_users.filter(username__icontains=search)

    # Apply pagination
    paginator = StandardResultsSetPagination()
    paginated_users = paginator.paginate_queryset(mutual_users, request)

    # Serialize
    mutual_data = [
        {
            'user_id': u.id,
            'username': u.username,
            'profile_picture': request.build_absolute_uri(u.profile_picture.url) if u.profile_picture else None,
            'bio': u.bio,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'is_private': u.is_private,
            'profile_url': request.build_absolute_uri(f'/api/v1/accounts/auth/{u.id}/'),
        }
        for u in paginated_users
    ]

    return paginator.get_paginated_response({
        'total_mutual': len(mutual_ids),
        'mutual_followers': mutual_data
    })
