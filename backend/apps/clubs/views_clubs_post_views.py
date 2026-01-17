from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions, response, status
from django.db.models import Count, Prefetch
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType
from apps.interactions.models import Like, Comment, Share


from . import models, permissions as club_permissions
from core import pagination
from apps.posts.serializers import PostSerializer
from apps.posts.models import Post


# # ==================== POST VIEWS ====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, club_permissions.IsClubMember])
def list_posts(request, pk):
    """
    List all posts in a club with interaction counts
    """
    club = get_object_or_404(models.Club, pk=pk)

    # Check if user is owner or member
    # if request.user != club.owner and not models.Membership.objects.filter(user=request.user, club=club).exists():
    #     return response.Response(
    #         {'detail': 'You must be a club member to view posts.'},
    #         status=status.HTTP_403_FORBIDDEN
    #     )
    if request.user != club.owner and not club.is_public and not models.Membership.objects.filter(user=request.user, club=club).exists():
        return response.Response(
            {'detail': 'This is a private club. Join to view posts'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Query Post model where club matches
    posts = Post.objects.filter(
        club=club, is_deleted=False).select_related('author', 'club')

    paginator = pagination.StandardResultsSetPagination()
    paginated_posts = paginator.paginate_queryset(posts, request)

    serializer = PostSerializer(
        paginated_posts,
        many=True,
        context={'request': request}
    )

    # Efficiently fetch and map author roles
    data = serializer.data
    author_ids = [post.author_id for post in paginated_posts]

    author_is_owner_map = {}
    for user_id in author_ids:
        if user_id == club.owner_id:
            author_is_owner_map[user_id] = True

    # Inject is_owner into response data
    for item in data:
        author_id = item.get('author_id')
        item['is_owner'] = author_is_owner_map.get(author_id, False)

    return paginator.get_paginated_response(data)


# @api_view(['POST'])
# @permission_classes([permissions.IsAuthenticated, club_permissions.IsClubMember])
# def create_post(request, pk):
#     """
#     Create a new post in a club
#     """
#     club = get_object_or_404(models.Club, pk=pk)

#     # Check if user is owner or member
#     if request.user != club.owner and not models.Membership.objects.filter(user=request.user, club=club).exists():
#         return response.Response(
#             {'detail': 'You must be a club member to create posts.'},
#             status=status.HTTP_403_FORBIDDEN
#         )

#     serializer = PostSerializer(
#         data=request.data, context={'request': request})

#     if serializer.is_valid():
#         serializer.save(author=request.user, club=club)
#         return response.Response(serializer.data, status=status.HTTP_201_CREATED)

#     return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# @api_view(['GET', 'PATCH', 'DELETE'])
# @permission_classes([permissions.IsAuthenticated, club_permissions.IsClubMember])
# def post_detail(request, pk, post_id):
#     """
#     Get, update, or delete a specific post
#     """
#     club = get_object_or_404(models.Club, pk=pk)
#     # Query the Post model, then get the club_post wrapper if needed
#     post = get_object_or_404(Post, pk=post_id, club=club, is_deleted=False)

#     if request.method == 'GET':
#         serializer = PostSerializer(
#             post, context={'request': request})
#         return response.Response(serializer.data)

#     is_author = post.author == request.user
#     # Check if user has permission to manage posts
#     membership = models.Membership.objects.filter(
#         user=request.user,
#         club=club
#     ).select_related('role').first()
#     is_mod = membership and membership.role and membership.role.has_permission(
#         'can_manage_posts')

#     if not (is_author or is_mod):
#         return response.Response(
#             {'detail': 'You do not have permission to modify this post.'},
#             status=status.HTTP_403_FORBIDDEN
#         )

#     if request.method == 'PATCH':
#         serializer = PostSerializer(
#             post,
#             data=request.data,
#             partial=True,
#             context={'request': request}
#         )
#         if serializer.is_valid():
#             serializer.save()
#             return response.Response(serializer.data)
#         return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     if request.method == 'DELETE':
#         post.soft_delete()
#         return response.Response(status=status.HTTP_204_NO_CONTENT)


# @api_view(['GET'])
# @permission_classes([permissions.IsAuthenticated, club_permissions.IsClubMember])
# def post_likes(request, pk, post_id):
#     """
#     Get all likes on a specific post (no query params needed!)
#     """
#     club = get_object_or_404(models.Club, pk=pk)
#     post = get_object_or_404(Post, pk=post_id, club=club, is_deleted=False)

#     # Get content type for this post
#     content_type = ContentType.objects.get_for_model(Post)

#     # Get all likes for this post
#     likes = Like.objects.filter(
#         content_type=content_type,
#         object_id=post.id
#     ).select_related('user')

#     # Simple response with user info
#     likes_data = [
#         {
#             'id': str(like.id),
#             'user_id': like.user.id,
#             'username': like.user.username,
#             'avatar': getattr(like.user, 'avatar', None),
#             'created_at': like.created_at
#         }
#         for like in likes
#     ]

#     return response.Response({
#         'post_id': str(post.id),
#         'post_title': post.title,
#         'like_count': likes.count(),
#         'likes': likes_data
#     })


# @api_view(['POST'])
# @permission_classes([permissions.IsAuthenticated, club_permissions.IsClubMember])
# def toggle_post_like(request, pk, post_id):
#     """
#     Like or unlike a post (toggle)
#     """
#     club = get_object_or_404(models.Club, pk=pk)
#     post = get_object_or_404(Post, pk=post_id, club=club, is_deleted=False)

#     if not models.Membership.objects.filter(user=request.user, club=club).exists():
#         return response.Response(
#             {'detail': 'You must be a club member to like posts.'},
#             status=status.HTTP_403_FORBIDDEN
#         )

#     content_type = ContentType.objects.get_for_model(Post)

#     like, created = Like.objects.get_or_create(
#         user=request.user,
#         content_type=content_type,
#         object_id=post.id
#     )

#     if not created:
#         like.delete()
#         like_count = Like.objects.filter(
#             content_type=content_type,
#             object_id=post.id
#         ).count()

#         return response.Response({
#             'detail': 'Post unliked.',
#             'is_liked': False,
#             'like_count': like_count
#         })

#     like_count = Like.objects.filter(
#         content_type=content_type,
#         object_id=post.id
#     ).count()

#     return response.Response({
#         'detail': 'Post liked.',
#         'is_liked': True,
#         'like_count': like_count
#     }, status=status.HTTP_201_CREATED)


# # ==================== POST COMMENTS (Simple endpoints) ====================

# @api_view(['GET'])
# @permission_classes([permissions.IsAuthenticated, club_permissions.IsClubMember])
# def post_comments(request, pk, post_id):
#     """
#     Get all comments on a specific post
#     """
#     club = get_object_or_404(models.Club, pk=pk)
#     post = get_object_or_404(Post, pk=post_id, club=club, is_deleted=False)

#     content_type = ContentType.objects.get_for_model(Post)

#     # Get only root comments (not replies)
#     comments = Comment.objects.filter(
#         content_type=content_type,
#         object_id=post.id,
#         parent=None
#     ).select_related('author').order_by('created_at')

#     paginator = pagination.StandardResultsSetPagination()
#     paginated_comments = paginator.paginate_queryset(comments, request)

#     # Enhanced comment data
#     comments_data = []
#     for comment in paginated_comments:
#         # if current user liked this comment
#         comment_content_type = ContentType.objects.get_for_model(Comment)
#         is_liked = Like.objects.filter(
#             user=request.user,
#             content_type=comment_content_type,
#             object_id=comment.id
#         ).exists()

#         like_count = Like.objects.filter(
#             content_type=comment_content_type,
#             object_id=comment.id
#         ).count()

#         comments_data.append({
#             'id': comment.id,
#             'author_id': comment.author.id,
#             'author_username': comment.author.username,
#             'author_avatar': getattr(comment.author, 'avatar', None),
#             'content': comment.content,
#             'is_edited': comment.is_edited,
#             'like_count': like_count,
#             'reply_count': comment.replies.count(),
#             'is_liked': is_liked,
#             'can_edit': comment.author == request.user,
#             'created_at': comment.created_at,
#             'updated_at': comment.updated_at
#         })

#     return paginator.get_paginated_response(comments_data)


# @api_view(['POST'])
# @permission_classes([permissions.IsAuthenticated, club_permissions.IsClubMember])
# def create_post_comment(request, pk, post_id):
#     """
#     Create a comment on a post
#     Body: { "content": "Great post!", "parent": null }
#     """
#     club = get_object_or_404(models.Club, pk=pk)
#     post = get_object_or_404(Post, pk=post_id, club=club, is_deleted=False)

#     if not models.Membership.objects.filter(user=request.user, club=club).exists():
#         return response.Response(
#             {'detail': 'You must be a club member to comment.'},
#             status=status.HTTP_403_FORBIDDEN
#         )

#     content = request.data.get('content')
#     parent_id = request.data.get('parent')

#     if not content:
#         return response.Response(
#             {'detail': 'Content is required.'},
#             status=status.HTTP_400_BAD_REQUEST
#         )

#     content_type = ContentType.objects.get_for_model(Post)
#     parent = None

#     if parent_id:
#         parent = get_object_or_404(Comment, pk=parent_id)

#         if parent.content_type != content_type or parent.object_id != post.id:
#             return response.Response(
#                 {'detail': 'Parent comment does not belong to this post.'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#     comment = Comment.objects.create(
#         author=request.user,
#         content=content,
#         content_type=content_type,
#         object_id=post.id,
#         parent=parent
#     )

#     return response.Response({
#         'id': comment.id,
#         'author_id': comment.author.id,
#         'author_username': comment.author.username,
#         'content': comment.content,
#         'parent': parent_id,
#         'created_at': comment.created_at
#     }, status=status.HTTP_201_CREATED)


# @api_view(['PATCH', 'DELETE'])
# @permission_classes([permissions.IsAuthenticated, club_permissions.IsClubMember])
# def manage_post_comment(request, pk, post_id, comment_id):
#     """
#     Update or delete a comment
#     """
#     club = get_object_or_404(models.Club, pk=pk)
#     post = get_object_or_404(Post, pk=post_id, club=club, is_deleted=False)
#     comment = get_object_or_404(Comment, pk=comment_id)

#     # Verify comment belongs to this post
#     content_type = ContentType.objects.get_for_model(Post)
#     if comment.content_type != content_type or comment.object_id != post.id:
#         return response.Response(
#             {'detail': 'Comment does not belong to this post.'},
#             status=status.HTTP_400_BAD_REQUEST
#         )

#     is_author = comment.author == request.user
#     # Check if user has permission to manage posts
#     membership = models.Membership.objects.filter(
#         user=request.user,
#         club=club
#     ).select_related('role').first()
#     is_mod = membership and membership.role and membership.role.has_permission(
#         'can_manage_posts')

#     if not (is_author or is_mod):
#         return response.Response(
#             {'detail': 'You do not have permission to modify this comment.'},
#             status=status.HTTP_403_FORBIDDEN
#         )

#     if request.method == 'PATCH':
#         if not is_author:
#             return response.Response(
#                 {'detail': 'Only the author can edit the comment.'},
#                 status=status.HTTP_403_FORBIDDEN
#             )

#         content = request.data.get('content')
#         if not content:
#             return response.Response(
#                 {'detail': 'content is required.'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         comment.content = content
#         comment.is_edited = True
#         comment.save()

#         return response.Response({
#             'id': comment.id,
#             'content': comment.content,
#             'is_edited': comment.is_edited,
#             'updated_at': comment.updated_at
#         })

#     if request.method == 'DELETE':
#         comment.delete()
#         return response.Response(status=status.HTTP_204_NO_CONTENT)


# @api_view(['POST'])
# @permission_classes([permissions.IsAuthenticated, club_permissions.IsClubMember])
# def toggle_comment_like(request, pk, post_id, comment_id):
#     """
#     Like or unlike a comment
#     """
#     club = get_object_or_404(models.Club, pk=pk)
#     post = get_object_or_404(Post, pk=post_id, club=club, is_deleted=False)
#     comment = get_object_or_404(Comment, pk=comment_id)

#     if not models.Membership.objects.filter(user=request.user, club=club).exists():
#         return response.Response(
#             {'detail': 'You must be a club member to like comments.'},
#             status=status.HTTP_403_FORBIDDEN
#         )

#     comment_content_type = ContentType.objects.get_for_model(Comment)

#     # Toggle like
#     like, created = Like.objects.get_or_create(
#         user=request.user,
#         content_type=comment_content_type,
#         object_id=comment.id
#     )

#     if not created:
#         like.delete()
#         like_count = Like.objects.filter(
#             content_type=comment_content_type,
#             object_id=comment.id
#         ).count()

#         return response.Response({
#             'detail': 'Comment unliked.',
#             'is_liked': False,
#             'like_count': like_count
#         })

#     like_count = Like.objects.filter(
#         content_type=comment_content_type,
#         object_id=comment.id
#     ).count()

#     return response.Response({
#         'detail': 'Comment liked.',
#         'is_liked': True,
#         'like_count': like_count
#     }, status=status.HTTP_201_CREATED)


# @api_view(['GET'])
# @permission_classes([permissions.IsAuthenticated, club_permissions.IsClubMember])
# def post_shares(request, pk, post_id):
#     """
#     Get all shares of a specific post
#     """
#     club = get_object_or_404(models.Club, pk=pk)
#     post = get_object_or_404(Post, pk=post_id, club=club, is_deleted=False)

#     content_type = ContentType.objects.get_for_model(Post)

#     shares = Share.objects.filter(
#         content_type=content_type,
#         object_id=post.id
#     ).select_related('user')

#     shares_data = [
#         {
#             'id': str(share.id),
#             'user_id': share.user.id,
#             'username': share.user.username,
#             'message': share.message,
#             'created_at': share.created_at
#         }
#         for share in shares
#     ]

#     return response.Response({
#         'post_id': str(post.id),
#         'share_count': shares.count(),
#         'shares': shares_data
#     })


# @api_view(['POST'])
# @permission_classes([permissions.IsAuthenticated, club_permissions.IsClubMember])
# def toggle_post_share(request, pk, post_id):
#     """
#     Share or unshare a post
#     Body: { "message": "Check this out!" }  // optional
#     """
#     club = get_object_or_404(models.Club, pk=pk)
#     post = get_object_or_404(Post, pk=post_id, club=club, is_deleted=False)

#     if not models.Membership.objects.filter(user=request.user, club=club).exists():
#         return response.Response(
#             {'detail': 'You must be a club member to share posts.'},
#             status=status.HTTP_403_FORBIDDEN
#         )

#     content_type = ContentType.objects.get_for_model(Post)
#     message = request.data.get('message', '')

#     # Check if already shared
#     existing_share = Share.objects.filter(
#         user=request.user,
#         content_type=content_type,
#         object_id=post.id
#     ).first()

#     if existing_share:
#         # Unshare
#         existing_share.delete()
#         share_count = Share.objects.filter(
#             content_type=content_type,
#             object_id=post.id
#         ).count()

#         return response.Response({
#             'detail': 'Post unshared.',
#             'is_shared': False,
#             'share_count': share_count
#         })

#     # Create share
#     share = Share.objects.create(
#         user=request.user,
#         content_type=content_type,
#         object_id=post.id,
#         message=message
#     )

#     share_count = Share.objects.filter(
#         content_type=content_type,
#         object_id=post.id
#     ).count()

#     return response.Response({
#         'detail': 'Post shared.',
#         'is_shared': True,
#         'share_count': share_count
#     }, status=status.HTTP_201_CREATED)
