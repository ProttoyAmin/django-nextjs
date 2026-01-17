# apps/posts/views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
import os
from apps.interactions.serializers import CommentSerializer

# Create your views here.
from . import models, serializers
from apps.interactions.models import Like, Comment, Share
from apps.posts.serializers import PostSerializer, PostListSerializer
from core.pagination import StandardResultsSetPagination


@api_view(['GET'])
@permission_classes([IsAuthenticated, ])
def list_posts(request):
    """
    List all public posts (feed)
    Query params:
    - post_type: TEXT|IMAGE|VIDEO
    - author: user_id
    - search: search in content
    """

    # Show all posts (user, clubs) [ add this flag to get the club posts as well --- club__isnull=True
    posts = models.Post.objects.filter(is_deleted=False, is_public=True).select_related(
        'author').prefetch_related('media_files')

    post_type = request.query_params.get('post_type')
    if post_type in ['TEXT', 'IMAGE', 'VIDEO']:
        posts = posts.filter(post_type=post_type)

    search = request.query_params.get('search')
    if search:
        posts = posts.filter(content__icontains=search)

    paginator = StandardResultsSetPagination()
    paginated_posts = paginator.paginate_queryset(posts, request)

    serializer = PostSerializer(
        paginated_posts,
        many=True,
        context={'request': request}
    )

    return paginator.get_paginated_response(serializer.data)


# @api_view(['GET'])
# @permission_classes([IsAuthenticated, ])
# def list_club_posts(request):
#     """
#     List all public club posts
#     Query params:
#     - post_type: TEXT|IMAGE|VIDEO
#     - author: user_id
#     - search: search in content
#     """
#     posts = models.Post.objects.filter(is_deleted=False, is_public=True, club__isnull=True).select_related(
#         'author').prefetch_related('media_files')
#     post_type = request.query_params.get('post_type')
#     if post_type in ['TEXT', 'IMAGE', 'VIDEO']:
#         posts = posts.filter(post_type=post_type)

#     search = request.query_params.get('search')
#     if search:
#         posts = posts.filter(content__icontains=search)

#     paginator = StandardResultsSetPagination()
#     paginated_posts = paginator.paginate_queryset(posts, request)

#     serializer = PostSerializer(
#         paginated_posts,
#         many=True,
#         context={'request': request}
#     )

#     return paginator.get_paginated_response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_post(request):
    """
    Create a new text post
    Body: {
        "content": "Post content",
        "is_public": true,
        "original_post": null  // for reposts
    }
    """
    data = request.data.copy()
    data['post_type'] = 'TEXT'

    serializer = serializers.PostCreateUpdateSerializer(data=data)

    if serializer.is_valid():
        club_id = request.data.get('club_id')
        post = serializer.save(author=request.user, club_id=club_id)

        response_serializer = serializers.PostSerializer(
            post, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def create_post_with_media(request):
    """
    Create a post with media file (image or video)
    Body: {
        "post_type": "IMAGE|VIDEO",
        "content": "Post content",
        "image_file": file,  // for IMAGE type (file upload)
        "video_file": file,  // for VIDEO type (file upload)
        "is_public": true,
        "original_post": null  // for reposts
    }
    """
    serializer = serializers.PostCreateUpdateSerializer(data=request.data)

    if serializer.is_valid():
        club_id = request.data.get('club_id')
        post = serializer.save(author=request.user, club_id=club_id)

        response_serializer = serializers.PostSerializer(
            post, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def post_detail(request, post_id):
    """Get, update, or delete a post"""
    post = get_object_or_404(models.Post.objects.select_related(
        'author').prefetch_related('media_files'), pk=post_id, is_deleted=False)

    # Check privacy for GET
    if request.method == 'GET':
        if not post.is_public and post.author != request.user:
            return Response(
                {'detail': 'This post is private.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = serializers.PostSerializer(
            post, context={'request': request})
        return Response(serializer.data)

    # Only author can modify
    if post.author != request.user:
        return Response(
            {'detail': 'You do not have permission to modify this post.'},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.method == 'PATCH':
        serializer = serializers.PostCreateUpdateSerializer(
            post,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()

            response_serializer = serializers.PostSerializer(
                post, context={'request': request})
            return Response(response_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        post.soft_delete()
        return Response(
            {'detail': 'Post deleted successfully.'},
            status=status.HTTP_200_OK
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, ])
def repost(request, post_id):
    """
    Create a repost (share with optional message as new post)
    Body: { "content": "Adding my thoughts..." }  // optional
    """

    original_post = get_object_or_404(
        models.Post, pk=post_id, is_deleted=False)

    existing_repost = models.Post.objects.filter(
        author=request.user,
        original_post=original_post,
        is_deleted=False
    ).first()

    if existing_repost:
        return Response(
            {'detail': 'You have already reposted this.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    content = request.data.get('content', '')
    repost = models.Post.objects.create(
        author=request.user,
        post_type=original_post.post_type,
        content=content,
        original_post=original_post,
        is_public=True
    )

    serializer = serializers.PostSerializer(
        repost, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def post_likes(request, post_id):
    """Get all likes on a post"""
    post = get_object_or_404(models.Post, pk=post_id, is_deleted=False)

    content_type = ContentType.objects.get_for_model(models.Post)
    likes = Like.objects.filter(
        content_type=content_type,
        object_id=post.id
    ).select_related('user')

    likes_data = [
        {
            'id': str(like.id),
            'user_id': like.user.id,
            'username': like.user.username,
            'avatar': like.user.avatar,
            'created_at': like.created_at
        }
        for like in likes
    ]

    return Response({
        'post_id': str(post.id),
        'like_count': likes.count(),
        'likes': likes_data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_post_like(request, post_id):
    """Like or unlike a post (toggle)"""
    post = get_object_or_404(models.Post, pk=post_id, is_deleted=False)

    content_type = ContentType.objects.get_for_model(models.Post)

    like, created = Like.objects.get_or_create(
        user=request.user,
        content_type=content_type,
        object_id=post.id
    )

    if not created:
        like.delete()
        like_count = Like.objects.filter(
            content_type=content_type,
            object_id=post.id
        ).count()

        return Response({
            'detail': 'Post unliked.',
            'is_liked': False,
            'like_count': like_count
        })

    like_count = Like.objects.filter(
        content_type=content_type,
        object_id=post.id
    ).count()

    return Response({
        'detail': 'Post liked.',
        'is_liked': True,
        'like_count': like_count
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def post_comments(request, post_id):
    """Get all comments on a post"""
    post = get_object_or_404(models.Post, pk=post_id, is_deleted=False)

    content_type = ContentType.objects.get_for_model(models.Post)

    comments = Comment.objects.filter(
        content_type=content_type,
        object_id=post.id
    ).select_related('author').order_by('created_at')

    paginator = StandardResultsSetPagination()
    paginated_comments = paginator.paginate_queryset(comments, request)

    comments_data = []

    for comment in paginated_comments:
        comment_content_type = ContentType.objects.get_for_model(Comment)
        is_liked = False
        if request.user.is_authenticated:
            is_liked = Like.objects.filter(
                user=request.user,
                content_type=comment_content_type,
                object_id=comment.id
            ).exists()

        like_count = Like.objects.filter(
            content_type=comment_content_type,
            object_id=comment.id
        ).count()

        comments_data.append({
            'id': str(comment.id),
            'author_id': comment.author.id,
            'author_username': comment.author.username,
            'author_avatar': request.build_absolute_uri(comment.author.profile_picture.url),
            'content': comment.content,
            'is_edited': comment.is_edited,
            'like_count': like_count,
            'reply_count': comment.replies.count(),
            'is_liked': is_liked,
            'parent': str(comment.parent_id),
            'can_edit': request.user.is_authenticated and comment.author == request.user,
            'created_at': comment.created_at,
            'updated_at': comment.updated_at
        })

    return paginator.get_paginated_response(comments_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_post_comment(request, post_id):
    """
    Create a comment on a post
    Body: { "content": "Great post!", "parent": null }
    """
    post = get_object_or_404(models.Post, pk=post_id, is_deleted=False)

    content = request.data.get('content')
    parent_id = request.data.get('parent')

    if not content:
        return Response(
            {'detail': 'content is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    content_type = ContentType.objects.get_for_model(models.Post)

    # Verify parent if provided
    parent = None
    if parent_id:
        parent = get_object_or_404(Comment, pk=parent_id)
        # Ensure parent is on the same post
        if parent.content_type != content_type or parent.object_id != post.id:
            return Response(
                {'detail': 'Parent comment does not belong to this post.'},
                status=status.HTTP_400_BAD_REQUEST
            )

    # Create comment
    comment = Comment.objects.create(
        author=request.user,
        content_type=content_type,
        object_id=post.id,
        content=content,
        parent=parent
    )

    return Response({
        'id': str(comment.id),
        'author_id': comment.author.id,
        'author_username': comment.author.username,
        'content': comment.content,
        'parent': str(parent_id),
        'created_at': comment.created_at
    }, status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_post_comment(request, post_id, comment_id):
    """Update or delete a comment"""
    post = get_object_or_404(models.Post, pk=post_id, is_deleted=False)
    comment = get_object_or_404(Comment, pk=comment_id)

    # Verify comment belongs to this post
    content_type = ContentType.objects.get_for_model(models.Post)
    if comment.content_type != content_type or comment.object_id != post.id:
        return Response(
            {'detail': 'Comment does not belong to this post.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if comment.author != request.user:
        return Response(
            {'detail': 'You do not have permission to modify this comment.'},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.method == 'PATCH':
        content = request.data.get('content')
        if not content:
            return Response(
                {'detail': 'content is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        comment.content = content
        comment.is_edited = True
        comment.save()

        return Response({
            'id': comment.id,
            'content': comment.content,
            'is_edited': comment.is_edited,
            'updated_at': comment.updated_at
        })

    if request.method == 'DELETE':
        comment.delete()
        return Response(
            {'detail': 'Comment deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_comment_like(request, post_id, comment_id):
    """Like or unlike a comment"""
    post = get_object_or_404(models.Post, pk=post_id, is_deleted=False)
    comment = get_object_or_404(Comment, pk=comment_id)

    comment_content_type = ContentType.objects.get_for_model(Comment)

    like, created = Like.objects.get_or_create(
        user=request.user,
        content_type=comment_content_type,
        object_id=comment.id
    )

    if not created:
        like.delete()
        like_count = Like.objects.filter(
            content_type=comment_content_type,
            object_id=comment.id
        ).count()

        return Response({
            'detail': 'Comment unliked.',
            'is_liked': False,
            'like_count': like_count
        })

    like_count = Like.objects.filter(
        content_type=comment_content_type,
        object_id=comment.id
    ).count()

    return Response({
        'detail': 'Comment liked.',
        'is_liked': True,
        'like_count': like_count
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_comment_replies(request, post_id, comment_id):
    """Get all replies to a specific comment"""
    post = get_object_or_404(models.Post, pk=post_id, is_deleted=False)
    parent_comment = get_object_or_404(Comment, pk=comment_id)

    replies = Comment.objects.filter(parent=parent_comment).select_related(
        'author').order_by('created_at')

    paginator = StandardResultsSetPagination()
    paginated_replies = paginator.paginate_queryset(replies, request)

    # Enhanced reply data
    replies_data = []
    for reply in paginated_replies:
        print("reply", reply)
        comment_content_type = ContentType.objects.get_for_model(Comment)
        is_liked = False
        if request.user.is_authenticated:
            is_liked = Like.objects.filter(
                user=request.user,
                content_type=comment_content_type,
                object_id=reply.id
            ).exists()

        like_count = Like.objects.filter(
            content_type=comment_content_type,
            object_id=reply.id
        ).count()

        replies_data.append({
            'id': str(reply.id),
            'author_id': reply.author.id,
            'author_username': reply.author.username,
            'author_avatar': reply.author.avatar,
            'profile_picture_url': request.build_absolute_uri(reply.author.profile_picture.url),
            'content': reply.content,
            'is_edited': reply.is_edited,
            'like_count': like_count,
            'is_liked': is_liked,
            'parent': str(reply.parent_id),
            'can_edit': request.user.is_authenticated and reply.author == request.user,
            'created_at': reply.created_at,
            'updated_at': reply.updated_at
        })

    return paginator.get_paginated_response(replies_data)


@api_view(['GET'])
@permission_classes([AllowAny])
def post_shares(request, post_id):
    """Get all shares of a post"""
    post = get_object_or_404(models.Post, pk=post_id, is_deleted=False)

    content_type = ContentType.objects.get_for_model(models.Post)
    shares = Share.objects.filter(
        content_type=content_type,
        object_id=post.id
    ).select_related('user')

    shares_data = [
        {
            'id': str(share.id),
            'user_id': share.user.id,
            'username': share.user.username,
            'avatar': share.user.avatar,
            'message': share.message,
            'created_at': share.created_at
        }
        for share in shares
    ]

    return Response({
        'post_id': str(post.id),
        'share_count': shares.count(),
        'shares': shares_data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_post_share(request, post_id):
    """
    Share or unshare a post
    Body: { "message": "Check this out!" }  // optional
    """
    post = get_object_or_404(models.Post, pk=post_id, is_deleted=False)

    content_type = ContentType.objects.get_for_model(models.Post)
    message = request.data.get('message', '')

    # Check if already shared
    existing_share = Share.objects.filter(
        user=request.user,
        content_type=content_type,
        object_id=post.id
    ).first()

    if existing_share:
        # Unshare
        existing_share.delete()
        share_count = Share.objects.filter(
            content_type=content_type,
            object_id=post.id
        ).count()

        return Response({
            'detail': 'Post unshared.',
            'is_shared': False,
            'share_count': share_count
        })

    # Create share
    share = Share.objects.create(
        user=request.user,
        content_type=content_type,
        object_id=post.id,
        message=message
    )

    share_count = Share.objects.filter(
        content_type=content_type,
        object_id=post.id
    ).count()

    return Response({
        'detail': 'Post shared.',
        'is_shared': True,
        'share_count': share_count
    }, status=status.HTTP_201_CREATED)


# ==================== FEED VIEW ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_feed(request):
    """
    Get personalized feed for the current user

    Feed includes:
    1. Posts from users the current user follows (with accepted status)
    2. Public posts from public profiles (users with is_private=False)
    3. Excludes posts from blocked users (in both directions)

    Privacy rules:
    - From followed users: Show all their public posts
    - From public profiles: Only show public posts (is_public=True)
    - Never show posts from blocked users
    """
    from apps.connections.models import Follow, Block
    from django.db.models import Q

    current_user = request.user

    # Get users that current user is following (accepted follows only)
    following_users = Follow.objects.filter(
        follower=current_user,
        status='accepted'
    ).values_list('following_id', flat=True)

    # Get blocked users (both directions)
    blocked_by_me = Block.objects.filter(
        blocker=current_user
    ).values_list('blocked_id', flat=True)

    blocked_me = Block.objects.filter(
        blocked=current_user
    ).values_list('blocker_id', flat=True)

    # Combine all blocked users
    blocked_users = set(list(blocked_by_me) + list(blocked_me))

    # Build the query
    # Q1: Posts from users I follow (their public posts)
    # Q2: Posts from public profiles (is_private=False) that are public posts
    # Only show regular user posts (not club posts)
    posts = models.Post.objects.filter(
        Q(
            # Posts from users I follow
            author_id__in=following_users,
            is_public=True
        ) | Q(
            # Posts from public profiles (not private accounts)
            author__is_private=False,
            is_public=True
        ),
        is_deleted=False,
        club__isnull=True  # Exclude club posts from user feed
    ).exclude(
        # Exclude posts from blocked users
        author_id__in=blocked_users
    ).exclude(
        # Exclude my own posts (optional - remove this line if you want to see your own posts)
        author=current_user
    ).select_related('author').prefetch_related('media_files').order_by('-created_at').distinct()

    # Optional filters
    post_type = request.query_params.get('post_type')
    if post_type in ['TEXT', 'IMAGE', 'VIDEO', 'MIXED']:
        posts = posts.filter(post_type=post_type)

    search = request.query_params.get('search')
    if search:
        posts = posts.filter(content__icontains=search)

    paginator = StandardResultsSetPagination()
    paginated_posts = paginator.paginate_queryset(posts, request)

    serializer = serializers.PostSerializer(
        paginated_posts,
        many=True,
        context={'request': request}
    )

    return paginator.get_paginated_response(serializer.data)


# ==================== TRENDING/POPULAR POSTS ====================

@api_view(['GET'])
@permission_classes([AllowAny])
def trending_posts(request):
    """
    Get trending posts (posts with most likes/comments in last 24 hours)
    """
    from django.utils import timezone
    from datetime import timedelta

    # Get posts from last 24 hours (regular user posts only, not club posts)
    time_threshold = timezone.now() - timedelta(hours=24)

    posts = models.Post.objects.filter(
        is_deleted=False,
        is_public=True,
        club__isnull=True,  # Exclude club posts from trending
        created_at__gte=time_threshold
    ).select_related('author').prefetch_related('media_files')

    # Sort by engagement (you can customize this logic)
    # For now, we'll just show recent posts
    # In production, calculate engagement score based on likes, comments, shares
    posts = posts.order_by('-created_at')[:50]

    serializer = serializers.PostListSerializer(
        posts,
        many=True,
        context={'request': request}
    )

    return Response({
        'trending_posts': serializer.data,
        'time_range': '24 hours'
    })


# ==================== FILE UPLOAD VIEWS ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_post_media(request):
    """
    Upload media file (image/video) and return the file path
    Usage:
    - For images: POST /api/v1/posts/upload-media/?type=image
    - For videos: POST /api/v1/posts/upload-media/?type=video
    """
    file_type = request.GET.get('type', 'image').lower()

    if file_type not in ['image', 'video']:
        return Response(
            {'detail': 'Type must be "image" or "video"'},
            status=status.HTTP_400_BAD_REQUEST
        )

    uploaded_file = request.FILES.get('file')
    if not uploaded_file:
        return Response(
            {'detail': 'No file provided'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validate file type based on extension
    file_extension = os.path.splitext(uploaded_file.name)[1].lower()

    if file_type == 'image':
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
        if file_extension not in allowed_extensions:
            return Response(
                {'detail': f'Invalid image file. Allowed extensions: {", ".join(allowed_extensions)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    elif file_type == 'video':
        allowed_extensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm']
        if file_extension not in allowed_extensions:
            return Response(
                {'detail': f'Invalid video file. Allowed extensions: {", ".join(allowed_extensions)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    # Check file size (50MB limit)
    max_size = 50 * 1024 * 1024
    if uploaded_file.size > max_size:
        return Response(
            {'detail': f'File size exceeds {max_size / (1024*1024)}MB'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create a temporary post to get an ID for the file path
    temp_post = models.Post.objects.create(
        author=request.user,
        post_type='IMAGE' if file_type == 'image' else 'VIDEO',
        content='',  # Empty content for temp post
        is_public=False  # Make it private initially
    )

    # Set the file based on type
    if file_type == 'image':
        temp_post.image_file = uploaded_file
    else:
        temp_post.video_file = uploaded_file

    temp_post.save()

    # Return the file path and post ID for future use
    file_url = temp_post.image_file.url if file_type == 'image' else temp_post.video_file.url

    return Response({
        'file_url': file_url,
        'file_name': uploaded_file.name,
        'file_size': uploaded_file.size,
        'file_type': file_type,
        'post_id': temp_post.id,
        'message': 'File uploaded successfully'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def create_mixed_media_post(request):
    """
    Create a post with multiple mixed media files (images and/or videos)
    Body (FormData):
        "content": "Post content",
        "is_public": true,
        "media_files": [file1, file2, file3, ...]  // multiple files
    """
    from .models import PostMedia

    content = request.data.get('content', '')
    club_id = request.data.get('club_id', None)
    is_public = request.data.get('is_public', 'true').lower() == 'true'
    media_files = request.FILES.getlist('media_files')  # Get multiple files

    if not media_files or len(media_files) == 0:
        return Response(
            {'detail': 'At least one media file is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Determine post type based on media files
    has_images = any(f.content_type.startswith('image/') for f in media_files)
    has_videos = any(f.content_type.startswith('video/') for f in media_files)

    if has_images and has_videos:
        post_type = 'MIXED'
    elif has_images:
        post_type = 'IMAGE'
    elif has_videos:
        post_type = 'VIDEO'
    else:
        return Response(
            {'detail': 'Invalid media files. Only images and videos are supported.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create the main post
    post = models.Post.objects.create(
        author=request.user,
        post_type=post_type,
        content=content,
        club_id=club_id,
        is_public=is_public
    )

    # Create PostMedia entries for each file
    for index, media_file in enumerate(media_files):
        # Determine media type
        if media_file.content_type.startswith('image/'):
            media_type = 'IMAGE'
            PostMedia.objects.create(
                post=post,
                media_type=media_type,
                image_file=media_file,
                order=index
            )
        elif media_file.content_type.startswith('video/'):
            media_type = 'VIDEO'
            PostMedia.objects.create(
                post=post,
                media_type=media_type,
                video_file=media_file,
                order=index
            )

    # Return the created post with media files
    response_serializer = serializers.PostSerializer(
        post, context={'request': request})
    return Response(response_serializer.data, status=status.HTTP_201_CREATED)
