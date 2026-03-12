from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from django.db.models import Count, Q, Prefetch
from djoser.views import UserViewSet
from rest_framework import status, viewsets, permissions
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.authentication import JWTStatelessUserAuthentication
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import generics, mixins
from django.conf import settings
from . import serializers, models
from core.pagination import PageNumberPagination
from apps.posts.serializers import PostSerializer, PostListSerializer
from apps.clubs.models import Membership, Club, Role
from apps.connections.models import Follow
from apps.posts.models import Post
import logging

logger = logging.getLogger(__name__)

# Create your views here.


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated,]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            request.user.last_active = timezone.now()
            request.user.save(update_fields=['last_active'])
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_205_RESET_CONTENT)
        except KeyError:
            return Response({"detail": "Refresh token required."}, status=status.HTTP_400_BAD_REQUEST)
        except TokenError:
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)


class RegisterView(generics.CreateAPIView):
    permission_classes = (permissions.AllowAny, )
    serializer_class = serializers.RegisterSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = serializers.CustomTokenObtainPairSerializer

class ValidateTypeView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = serializers.UserTypeAssignmentSerializer

    def get(self, request):
        serializer = self.get_serializer()
        return Response(serializer.data)

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        validated_data = serializer.validated_data
        
        user.institute = validated_data['institute']
        user.type = validated_data['user_type']
        user.professional_email = validated_data['professional_email']
        user.save()
        
        return Response({
            "message": "Type and institute assigned successfully.",
            "user_type": user.type,
            "institute": user.institute.name,
            "data" : serializer.data
        }, status=status.HTTP_200_OK)


class CompleteUserInfoView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = serializers.UserSerializer
    queryset = models.User.objects.all()
    lookup_field = 'id'
    lookup_url_kwarg = 'user_id'


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_profile_picture(request):
    """
    Upload a new profile picture for the authenticated user
    """
    user = request.user
    profile_picture = request.FILES.get('profile_picture')

    if not profile_picture:
        return Response({
            'message': 'No image file provided'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Validate file type
    allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    file_extension = profile_picture.name.lower().split('.')[-1]

    if f'.{file_extension}' not in allowed_extensions:
        return Response({
            'message': f'Invalid file type. Allowed extensions: {", ".join(allowed_extensions)}'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Validate file size (5MB max)
    max_size = 5 * 1024 * 1024
    if profile_picture.size > max_size:
        return Response({
            'message': 'File size too large. Maximum size is 5MB'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Delete old profile picture if exists
    if user.profile_picture:
        user.profile_picture.delete(save=False)

    # Set new profile picture
    user.profile_picture = profile_picture
    user.save(update_fields=['profile_picture'])

    return Response({
        'message': 'Profile picture updated successfully',
        'profile_picture_url': user.profile_picture.url if user.profile_picture else None
    }, status=status.HTTP_200_OK)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_current_user(request):
    """Get current authenticated user's profile"""
    serializer = serializers.UserProfileSerializer(
        request.user, context={'request': request})
    return Response(serializer.data)


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_profile(request):
    """Get or update current user's profile"""
    if request.method == 'GET':
        serializer = serializers.UserProfileSerializer(
            request.user, context={'request': request})
        return Response(serializer.data)

    if request.method == 'PATCH':
        serializer = serializers.UserProfileSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def clear_profile_picture(request):
    """
    Clear the authenticated user's profile picture
    """
    user = request.user
    if user.profile_picture:
        user.profile_picture.delete(save=False)  # Delete the file from storage
        user.profile_picture = None
        # Only save the profile_picture field
        user.save(update_fields=['profile_picture'])
        return Response({
            'message': 'Profile picture cleared successfully'
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'message': 'No profile picture to clear'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def manage_email_preference(request):
    """
    Get or update user's email preference for notifications
    """
    user = request.user

    if request.method == 'GET':
        return Response({
            'preferred_email': user.preferred_email,
            'email': user.email,
            'professional_email': user.professional_email,
            'current_notification_email': user.get_notification_email()
        }, status=status.HTTP_200_OK)

    if request.method == 'PATCH':
        preferred_email = request.data.get('preferred_email')

        if not preferred_email:
            return Response({
                'message': 'preferred_email field is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if preferred_email not in ['email', 'professional_email']:
            return Response({
                'message': 'preferred_email must be either "email" or "professional_email"'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate that the chosen email exists
        if preferred_email == 'professional_email' and not user.professional_email:
            return Response({
                'message': 'You do not have an educational email set'
            }, status=status.HTTP_400_BAD_REQUEST)

        user.preferred_email = preferred_email
        user.save(update_fields=['preferred_email'])

        return Response({
            'message': 'Email preference updated successfully',
            'preferred_email': user.preferred_email,
            'current_notification_email': user.get_notification_email()
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_users(request):
    """Get any user's public profile"""
    users = models.User.objects.all()

    if not users:
        return Response(
            {'detail': 'No users right now in your database.'},
            status=status.HTTP_204_NO_CONTENT
        )

    visible_fields = ['id', 'username', 'email', 'professional_email', 'url', 'password']

    serializer = serializers.UserProfileSerializer(
        users,
        many=True,
        context={'request': request},
        fields=visible_fields
    )
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_user_byUsername(request, username):
    """Get user profile by username"""
    user = get_object_or_404(models.User, username=username)

    # Check if viewer can access this profile
    can_view = user.can_view_profile(
        request.user if request.user.is_authenticated else None)

    if not can_view:
        # response_data = {
        #     'detail': 'This profile is private.' if request.user.is_authenticated else 'This profile is private. Please log in.',
        #     'user_id': user.id,
        #     'username': user.username,
        #     'avatar': user.avatar,
        #     'profile_picture_url': user.profile_picture.url if user.profile_picture else None,
        #     'is_private': True
        # }

        # fields = ['id', "username", 'first_name', 'last_name', 'profile_picture_url', 'follow_status',
        #           'follower_count', 'following_count', 'user_post_count', 'is_private', 'is_following']

        # if request.user.is_authenticated:
        #     from apps.connections.models import Follow
        #     response_data.update({
        #         'is_following': user.is_followed_by(request.user) if hasattr(user, 'is_followed_by') else False,
        #         'follow_status': Follow.get_follow_status(request.user, user) if hasattr(Follow, 'get_follow_status') else None
        #     })

        # serializer = serializers.UserProfileSerializer(
        #     user, fields=fields, context={'request': request})
        # return Response(serializer.data, status=status.HTTP_403_FORBIDDEN)
        return Response(
            {
                'detail': 'This profile is private.',
                'id': str(user.id),
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'avatar' : request.build_absolute_uri(user.profile_picture.url if user.profile_picture else None),
                'following_count' : user.following_count,
                'follower_count' : user.follower_count,
                'user_post_count' : user.user_post_count,
                'is_private': True,
                'is_following': user.is_followed_by(request.user) if hasattr(user, 'is_followed_by') else False,
                'follow_status': Follow.get_follow_status(request.user, user) if hasattr(Follow, 'get_follow_status') else None
            },
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = serializers.UserProfileSerializer(
        user, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_user_profile(request, user_id):
    """Get any user's public profile"""
    user = get_object_or_404(models.User, pk=user_id)
    # params = list(request.query_params.keys())
    params = request.query_params.get('fields').split(',') if request.query_params.get('fields') else None
    
    if not user.can_view_profile(request.user):
        return Response(
            {
                'detail': 'This profile is private.',
                'id': str(user.id),
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'avatar' : request.build_absolute_uri(user.profile_picture.url if user.profile_picture else None),
                'following_count' : user.following_count,
                'follower_count' : user.follower_count,
                'user_post_count' : user.user_post_count,
                'is_private': user.is_private,
                'is_following': user.is_followed_by(request.user) if hasattr(user, 'is_followed_by') else False,
                'follow_status': Follow.get_follow_status(request.user, user) if hasattr(Follow, 'get_follow_status') else None
            },
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = serializers.UserProfileSerializer(
        user,
        context={'request': request, 'fields': params if params else None}
    )
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_clubs(request, user_id):
    """Get all clubs a user has joined"""
    from apps.clubs.serializers import ClubListSerializer
    
    user = get_object_or_404(models.User, pk=user_id)
    print("user", user)

    if user.is_private and request.user != user:
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'This profile is private.'},
                status=status.HTTP_403_FORBIDDEN
            )

        is_following = Follow.objects.filter(
            follower=request.user,
            following=user,
            status='accepted'
        ).exists()

        if not is_following:
            return Response(
                {'detail': 'This profile is private. You must follow this user to view their clubs.'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        return Response(
            {'detail': 'This profile is private.',
             'username': user.username,
             'avatar' : request.build_absolute_uri(user.profile_picture.url) if user.profile_picture else None,
             'is_private': user.is_private
             },
            status=status.HTTP_403_FORBIDDEN
        )
        
    clubs = user.owned_clubs.all()
    

    memberships = Membership.objects.filter(
        user=user
    ).select_related('club').prefetch_related('roles')

    role_name = request.query_params.get('role')
    if role_name:
        memberships = memberships.filter(role__name__iexact=role_name)
    serializer = serializers.UserClubMembershipSerializer(
        memberships,
        many=True,
        context={'request': request}
    )
    
    # serializer = ClubListSerializer(
    #     clubs,
    #     many=True,
    #     context={'request': request}
    # )

    return Response({
        'user_id': user.id,
        'username': user.username,
        'club_count': memberships.count(),
        'clubs': serializer.data
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_user_posts(request, user_id):
    """
    Get all posts created by a user (both user posts and club posts)
    Query params:
    - source: all|user|club (default: all)
    - post_type: TEXT|IMAGE|VIDEO (default: all)
    """
    user = get_object_or_404(models.User, pk=user_id)

    if request.user.is_authenticated:
        if not user.can_view_posts(request.user):
            return Response(
                {'detail': 'You do not have permission to view this user\'s posts.'},
                status=status.HTTP_403_FORBIDDEN
            )

    # Get query parameters
    post_type = request.query_params.get('post_type')
    post_source = request.query_params.get('source', 'all')

    # Validate post_type if provided
    valid_post_types = ['TEXT', 'IMAGE', 'VIDEO', "MIXED"]
    if post_type and post_type not in valid_post_types:
        return Response(
            {'detail': f'post_type must be one of: {", ".join(valid_post_types)}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Base query
    posts = Post.objects.filter(
        author=user,
        original_post__isnull=True,
        is_deleted=False
    ).select_related('author')

    # Filter by source
    if post_source == 'user':
        posts = posts.filter(club__isnull=True)
    elif post_source == 'club':
        posts = posts.filter(club__isnull=False)

    # Filter by post type
    if post_type:
        posts = posts.filter(post_type=post_type)

    # Order by creation date descending
    posts = posts.order_by('-created_at')

    paginator = StandardResultsSetPagination()
    paginated_posts = paginator.paginate_queryset(posts, request)

    serializer = PostSerializer(
        paginated_posts,
        many=True,
        context={'request': request}
    )

    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_activity(request, user_id):
    """Get user's recent activity (likes, comments, shares)"""
    user = get_object_or_404(models.User, pk=user_id)

    # Only user themselves can see their full activity
    if request.user != user:
        return Response(
            {'detail': 'You can only view your own activity.'},
            status=status.HTTP_403_FORBIDDEN
        )

    limit = int(request.query_params.get('limit', 10))
    activity = user.get_recent_activity(limit=limit)

    from apps.interactions.serializers import LikeSerializer, CommentSerializer, ShareSerializer

    return Response({
        'user_id': user.id,
        'username': user.username,
        'recent_likes': LikeSerializer(activity['likes'], many=True, context={'request': request}).data,
        'recent_comments': CommentSerializer(activity['comments'], many=True, context={'request': request}).data,
        'recent_shares': ShareSerializer(activity['shares'], many=True, context={'request': request}).data,
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_users(request):
    """Search users by username or email"""
    query = request.query_params.get('q', '')

    if not query:
        return Response(
            {'detail': 'Query parameter "q" is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    users = models.User.objects.filter(
        Q(username__icontains=query) | Q(email__icontains=query)
    ).annotate(
        club_count=Count('clubs')
    )

    paginator = StandardResultsSetPagination()
    paginated_users = paginator.paginate_queryset(users, request)

    serializer = serializers.UserListSerializer(
        paginated_users,
        many=True,
        context={'request': request}
    )

    return paginator.get_paginated_response(serializer.data)


# ============= NEW VIEWS =============

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_roles_in_club(request, user_id, club_id):
    """Get user's roles in a specific club"""
    user = get_object_or_404(models.User, pk=user_id)
    club = get_object_or_404(Club, pk=club_id)

    # Check permissions
    if request.user != user and not request.user.has_club_permission(club, 'can_manage_members'):
        return Response(
            {'detail': 'You do not have permission to view this user\'s roles.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Get user's roles in the club
    role_names = user.get_club_role_names(club)
    permissions = {}

    # Get permissions from roles
    for role in user.get_club_roles(club):
        permissions.update({
            'can_manage_members': role.can_manage_members,
            'can_manage_posts': role.can_manage_posts,
            'can_manage_events': role.can_manage_events,
            'can_manage_settings': role.can_manage_settings,
        })

    return Response({
        'user_id': user.id,
        'username': user.username,
        'club_id': club.id,
        'club_name': club.name,
        'role_names': role_names,
        'permissions': permissions,
        'is_member': Membership.objects.filter(user=user, club=club).exists()
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_all_user_roles(request, user_id):
    """Get all roles for a user across all clubs"""
    user = get_object_or_404(models.User, pk=user_id)

    # Only user themselves or admins can see all roles
    if request.user != user and not request.user.is_staff:
        return Response(
            {'detail': 'You do not have permission to view this user\'s roles.'},
            status=status.HTTP_403_FORBIDDEN
        )

    all_roles = user.get_all_club_roles()

    response_data = []
    for role_info in all_roles:
        club = role_info['club']
        role = role_info['role']

        response_data.append({
            'club_id': club.id,
            'club_name': club.name,
            'club_slug': club.slug,
            'role_id': role.id,
            'role_name': role.name,
            'role_color': role.color,
            'permissions': {
                'can_manage_members': role.can_manage_members,
                'can_manage_posts': role.can_manage_posts,
                'can_manage_events': role.can_manage_events,
                'can_manage_settings': role.can_manage_settings,
            }
        })

    return Response({
        'user_id': user.id,
        'username': user.username,
        'total_clubs': len(response_data),
        'roles': response_data
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def assign_role_to_user(request, club_id, user_id):
    """Assign a role to a user in a club"""
    club = get_object_or_404(Club, pk=club_id)
    user = get_object_or_404(models.User, pk=user_id)
    role_name = request.data.get('role_name')

    # Check if requester has permission to manage members
    if not request.user.has_club_permission(club, 'can_manage_members'):
        return Response(
            {'detail': 'You do not have permission to assign roles in this club.'},
            status=status.HTTP_403_FORBIDDEN
        )

    if not role_name:
        return Response(
            {'detail': 'role_name is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        role = Role.objects.get(club=club, name__iexact=role_name)
    except Role.DoesNotExist:
        return Response(
            {'detail': f'Role "{role_name}" does not exist in this club.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Get or create membership
    membership, created = Membership.objects.get_or_create(
        user=user,
        club=club
    )

    # Add the role to membership
    membership.add_role(role, set_as_primary=not created)

    return Response({
        'message': f'Role "{role_name}" assigned to user {user.username} in club {club.name}',
        'membership_id': membership.id,
        'role_name': role.name,
        'assigned_at': membership.joined_at
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def remove_role_from_user(request, club_id, user_id):
    """Remove a role from a user in a club (set to default or None)"""
    club = get_object_or_404(Club, pk=club_id)
    user = get_object_or_404(models.User, pk=user_id)

    # Check if requester has permission to manage members
    if not request.user.has_club_permission(club, 'can_manage_members'):
        return Response(
            {'detail': 'You do not have permission to remove roles in this club.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        membership = Membership.objects.get(user=user, club=club)

        # Get role_id or role_name from request if specified
        role_id = request.data.get('role_id')
        role_name = request.data.get('role_name')

        if role_id or role_name:
            # Remove specific role
            try:
                if role_id:
                    role = Role.objects.get(id=role_id, club=club)
                else:
                    role = Role.objects.get(club=club, name__iexact=role_name)

                membership.remove_role(role)
                return Response({
                    'message': f'Role "{role.name}" removed from user {user.username} in club {club.name}.',
                    'remaining_roles': [r.name for r in membership.roles.all()]
                }, status=status.HTTP_200_OK)
            except Role.DoesNotExist:
                return Response(
                    {'detail': 'Role not found in this club.'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Clear all roles and set default
            default_role = club.roles.filter(is_default=True).first()
            membership.roles.clear()
            if default_role:
                membership.add_role(default_role, set_as_primary=True)

            return Response({
                'message': f'All roles removed from user {user.username} in club {club.name}. Set to default role.' if default_role
                else f'All roles removed from user {user.username} in club {club.name}.',
                'current_roles': [default_role.name] if default_role else []
            }, status=status.HTTP_200_OK)

    except Membership.DoesNotExist:
        return Response(
            {'detail': 'User is not a member of this club.'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_users_with_role(request, club_id, role_name):
    """Get all users with a specific role in a club"""
    club = get_object_or_404(Club, pk=club_id)

    # Check if requester has permission to view members
    if not request.user.has_club_permission(club, 'can_manage_members'):
        # Allow if user is member of the club
        if not Membership.objects.filter(user=request.user, club=club).exists():
            return Response(
                {'detail': 'You do not have permission to view members of this club.'},
                status=status.HTTP_403_FORBIDDEN
            )

    try:
        role = Role.objects.get(club=club, name__iexact=role_name)
    except Role.DoesNotExist:
        return Response(
            {'detail': f'Role "{role_name}" does not exist in this club.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Get users with this role
    users = role.users.all()

    paginator = StandardResultsSetPagination()
    paginated_users = paginator.paginate_queryset(users, request)

    serializer = serializers.UserBasicSerializer(
        paginated_users,
        many=True,
        context={'request': request}
    )

    return paginator.get_paginated_response({
        'club_id': club.id,
        'club_name': club.name,
        'role_name': role.name,
        'role_id': role.id,
        'total_users': users.count(),
        'users': serializer.data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_user_permission(request, club_id, user_id, permission):
    """Check if a user has a specific permission in a club"""
    club = get_object_or_404(Club, pk=club_id)
    user = get_object_or_404(models.User, pk=user_id)

    # Check if requester has permission
    if request.user != user and not request.user.has_club_permission(club, 'can_manage_members'):
        return Response(
            {'detail': 'You do not have permission to check user permissions.'},
            status=status.HTTP_403_FORBIDDEN
        )

    has_permission = user.has_club_permission(club, permission)

    return Response({
        'user_id': user.id,
        'username': user.username,
        'club_id': club.id,
        'club_name': club.name,
        'permission': permission,
        'has_permission': has_permission,
        'roles': user.get_club_role_names(club)
    })


class UserViewSet(viewsets.GenericViewSet,
                  mixins.RetrieveModelMixin,
                  mixins.UpdateModelMixin,
                  mixins.ListModelMixin):
    """User ViewSet with extended functionality"""
    queryset = models.User.objects.all()
    serializer_class = serializers.UserProfileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['GET'], permission_classes=[permissions.IsAuthenticated])
    def clubs(self, request, pk=None):
        """Get user's clubs"""
        user = self.get_object()
        return get_user_clubs(request, user.id)

    @action(detail=True, methods=['GET'], permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def posts(self, request, pk=None):
        """Get user's posts"""
        user = self.get_object()
        return get_user_posts(request, user.id)

    @action(detail=True, methods=['GET'], permission_classes=[permissions.IsAuthenticated])
    def roles(self, request, pk=None):
        """Get all roles for user across clubs"""
        user = self.get_object()
        return get_all_user_roles(request, user.id)

    @action(detail=True, methods=['GET'], url_path=r'roles/(?P<club_id>\d+)')
    def club_roles(self, request, pk=None, club_id=None):
        """Get user's roles in a specific club"""
        user = self.get_object()
        return get_user_roles_in_club(request, user.id, club_id)
