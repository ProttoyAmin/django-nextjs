# views.py
from rest_framework import permissions, response, status, generics
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework import parsers
from rest_framework.views import APIView
from django.db.models import Count, Q, Prefetch, Exists, OuterRef
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.conf import settings

from core import pagination
from . import models, serializers, permissions as club_permissions
from apps.accounts.models import User

# helper decorator 👈👈
# def require_permission(permission_name):
#     def decorator(func):
#         def wrapper(request, *args, **kwargs):
#             club = get_object_or_404(models.Club, pk=kwargs.get('pk'))
#             perm = club_permissions.HasRolePermission()
#             perm.permission_name = permission_name
#             if not perm.has_object_permission(request, None, club):
#                 return response.Response(
#                     {'detail': f'You do not have {permission_name} permission.'},
#                     status=status.HTTP_403_FORBIDDEN
#                 )
#             return func(request, *args, **kwargs)
#         return wrapper
#     return decorator


DEFAULT_ROLE = 'Owner'
DEFAULT_COLOR = "#8F2811"


class SuperuserOnlyStrictTestView(APIView):
    permission_classes = [permissions.IsAuthenticated,
                          club_permissions.IsSuperUserOnly]

    def get(self, request):
        return response.Response({
            "status": "Success",
            "message": f"Welcome, **STRICT SUPERUSER** {request.user.username}! Staff users are denied."
        })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_clubs(request):
    """
    List clubs visible to the authenticated user:
    - All public clubs
    - Closed/Secret clubs only if user is a member

    Query params:
    - search: Filter by name or origin
    - privacy: Filter by privacy type (public/closed/secret)
    - origin: Filter by specific origin
    - my_clubs: Set to 'true' to only show clubs user is member of
    """
    user = request.user

    clubs = models.Club.objects.filter(is_active=True)

    my_clubs_only = request.query_params.get('my_clubs', '').lower() == 'true'
    if my_clubs_only:
        clubs = clubs.filter(members=user)
    else:
        clubs = clubs.filter(
            Q(privacy='public') | Q(members=user)
        )

    search = request.query_params.get('search')
    if search:
        clubs = clubs.filter(
            Q(name__icontains=search) | Q(origin__icontains=search)
        )

    privacy_filter = request.query_params.get('privacy')
    if privacy_filter in ['public', 'closed', 'secret']:
        clubs = clubs.filter(privacy=privacy_filter)

    origin_filter = request.query_params.get('origin')
    if origin_filter:
        clubs = clubs.filter(origin__iexact=origin_filter)

    clubs = clubs.distinct().annotate(
        member_count=Count('members', distinct=True),
        post_count=Count('club_posts', distinct=True),
        event_count=Count('events', distinct=True),
    ).prefetch_related(
        Prefetch(
            'memberships',
            queryset=models.Membership.objects.filter(
                user=user).prefetch_related('roles'),
            to_attr='user_memberships'
        )
    ).select_related('owner').order_by('-created_at')

    paginator = pagination.StandardResultsSetPagination()
    paginated_clubs = paginator.paginate_queryset(clubs, request)

    serializer = serializers.ClubListSerializer(
        paginated_clubs, many=True, context={'request': request}
    )
    return paginator.get_paginated_response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_club(request):
    from apps.institutes.models import Institute
    """
    Create a new club (any authenticated user can create)
    Required fields: name, origin
    Optional fields: about, avatar, banner, privacy
    """
    serializer = serializers.ClubSerializer(data=request.data)
    if not serializer.is_valid():
        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    print("Creating club with data:", serializer.validated_data)

    # Use transaction to ensure atomicity
    with transaction.atomic():
        club = serializer.save(owner=request.user)

        # Create default roles using the model's method
        # default_role = models.Role.get_default_ownder_role(club)
        # print("Default admin role for new club:", default_role)

        # Get the admin role to assign to creator
        admin_role = club.roles.filter(name="Owner").first()
        if not admin_role:
            # Fallback if admin role doesn't exist - create owner role with all permissions
            admin_role = models.Role.objects.create(
                club=club,
                name=DEFAULT_ROLE,
                permissions={
                    'can_manage_members': True,
                    'can_manage_posts': True,
                    'can_manage_events': True,
                    'can_manage_settings': True
                },
                is_default=False,
                color=DEFAULT_COLOR
            )

        # Add creator as admin member
        membership = models.Membership.objects.create(
            user=request.user,
            club=club
        )
        membership.add_role(admin_role, set_as_primary=True)
        
    # Fetch with annotations for response
    club = models.Club.objects.annotate(
        member_count=Count('members', distinct=True),
        post_count=Count('club_posts', distinct=True),
        event_count=Count('events', distinct=True),
    ).prefetch_related(
        Prefetch(
            'memberships',
            queryset=models.Membership.objects.filter(
                user=request.user).prefetch_related('roles'),
            to_attr='user_memberships'
        )
    ).get(pk=club.pk)

    detail_serializer = serializers.ClubDetailSerializer(
        club, context={'request': request}
    )
    return response.Response(detail_serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def club_info(request, pk):
    """
    Retrieve, update, or delete a club.
    - GET: Public clubs visible to all; private clubs only to members
    - PATCH: Only club owner or admins with can_manage_settings
    - DELETE: Only club owner
    """
    # Base queryset
    base_qs = models.Club.objects.filter(is_active=True)

    if request.method == 'GET':
        club_qs = base_qs.filter(
            Q(privacy='public') | Q(members=request.user)
        )
    else:
        club_qs = base_qs.filter(members=request.user)

    club = get_object_or_404(
        club_qs.annotate(
            member_count=Count('members', distinct=True),
            post_count=Count('club_posts', distinct=True),
            event_count=Count('events', distinct=True),
        ).prefetch_related(
            Prefetch(
                'memberships',
                queryset=models.Membership.objects.filter(
                    user=request.user).prefetch_related('roles'),
                to_attr='user_memberships'
            )
        ).select_related('owner'),
        pk=pk
    )

    if request.method == 'GET':
        serializer = serializers.ClubDetailSerializer(
            club, context={'request': request})
        return response.Response(serializer.data)

    is_owner = (request.user == club.owner)
    has_admin_perm = False

    if not is_owner:
        memberships = getattr(club, 'user_memberships', [])
        if memberships:
            has_admin_perm = memberships[0].has_permission(
                'can_manage_settings')

    if request.method == 'PATCH':
        if not (is_owner or has_admin_perm):
            return response.Response(
                {'detail': 'Only club owners or admins can edit club settings.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = serializers.ClubSerializer(
            club, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            club = models.Club.objects.annotate(
                member_count=Count('members', distinct=True),
                post_count=Count('club_posts', distinct=True),
                event_count=Count('events', distinct=True),
            ).prefetch_related(
                Prefetch(
                    'memberships',
                    queryset=models.Membership.objects.filter(
                        user=request.user).prefetch_related('roles'),
                    to_attr='user_memberships'
                )
            ).get(pk=club.pk)

            detail_serializer = serializers.ClubDetailSerializer(
                club, context={'request': request})
            return response.Response(detail_serializer.data)
        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        if not is_owner:
            return response.Response({'detail': 'Only the club owner can delete the club.'},
                                     status=status.HTTP_403_FORBIDDEN
                                     )

        club.is_active = False
        club.save()
        return response.Response(
            {'detail': f'{club.name} has been deleted.'},
            status=status.HTTP_200_OK
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def join_club(request, pk):
    """
    Join a public or closed club.
    Secret clubs cannot be joined via this endpoint (must be invited).
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)

    # Prevent joining secret clubs
    if club.privacy == 'secret':
        return response.Response(
            {'detail': 'Cannot join secret clubs directly. You must be invited.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Check if already member
    if models.Membership.objects.filter(user=request.user, club=club).exists():
        return response.Response(
            {'detail': f'You are already a member of {club.name}.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get default role
    default_role = club.roles.filter(is_default=True).first()

    if not default_role:
        # Get Member role if exists
        default_role = club.roles.filter(name__iexact='Member').first()

        if not default_role:
            # Create default member role
            default_role = models.Role.objects.create(
                club=club,
                name='Member',
                is_default=True,
                color='#95A5A6'
            )

    # Create membership
    membership = models.Membership.objects.create(
        user=request.user,
        club=club
    )
    if default_role:
        membership.add_role(default_role, set_as_primary=True)

    return response.Response(
        {
            'detail': f'Successfully joined {club.name}.',
            'club': {
                'id': str(club.id),
                'name': club.name,
                'origin': club.origin,
                'slug': club.slug
            },
            'role': default_role.name if default_role else None
        },
        status=status.HTTP_201_CREATED
    )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def leave_club(request, pk):
    """
    Leave a club. Last admin cannot leave.
    """
    try:
        membership = models.Membership.objects.select_related('club').prefetch_related('roles').get(
            user=request.user, club_id=pk
        )
    except models.Membership.DoesNotExist:
        return response.Response(
            {'detail': 'You are not a member of this club.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    club = membership.club

    # Check if user is owner
    if club.owner == request.user:
        return response.Response(
            {'detail': 'Club owners cannot leave their own clubs. Transfer ownership or delete the club instead.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if last admin (and not owner)
    if membership.has_permission('can_manage_settings'):
        # Count how many members have can_manage_settings permission
        admin_count = sum(
            1 for m in models.Membership.objects.filter(club=club).prefetch_related('roles')
            if m.has_permission('can_manage_settings') and m.user != club.owner
        )

        if admin_count == 1:
            return response.Response(
                {'detail': 'You cannot leave as you are the last admin. Assign another admin first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

    membership.delete()
    return response.Response(
        {'detail': f'Successfully left {club.name}.'},
        status=status.HTTP_200_OK
    )


# ============= NEW VIEWS =============

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_members(request, pk):
    """List all members of a club"""
    club = get_object_or_404(models.Club, pk=pk, is_active=True)

    # Check if user can view members
    if not (club.privacy == 'public' or club.members.filter(id=request.user.id).exists()):
        return response.Response(
            {'detail': 'You do not have permission to view members of this club.'},
            status=status.HTTP_403_FORBIDDEN
        )

    memberships = models.Membership.objects.filter(
        club=club
    ).select_related('user').prefetch_related('roles').order_by('-joined_at')

    # Filter by role if provided
    role_name = request.query_params.get('role')
    if role_name:
        memberships = memberships.filter(roles__name__iexact=role_name)

    paginator = pagination.StandardResultsSetPagination()
    paginated_memberships = paginator.paginate_queryset(memberships, request)

    serializer = serializers.MembershipSerializer(
        paginated_memberships, many=True, context={'request': request}
    )

    return paginator.get_paginated_response({
        'club_id': club.id,
        'club_name': club.name,
        'total_members': memberships.count(),
        'members': serializer.data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_club_roles(request, pk):
    """List all roles in a club"""
    club = get_object_or_404(models.Club, pk=pk, is_active=True)

    # Check if user is member
    if not club.members.filter(id=request.user.id).exists():
        return response.Response(
            {'detail': 'You must be a member to view club roles.'},
            status=status.HTTP_403_FORBIDDEN
        )

    roles = club.roles.all().order_by('name')

    serializer = serializers.RoleSerializer(
        roles, many=True, context={'request': request}
    )

    return response.Response({
        'club_id': club.id,
        'club_name': club.name,
        'roles': serializer.data
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_club_role(request, pk):
    """Create a new role in a club"""
    club = get_object_or_404(models.Club, pk=pk, is_active=True)

    # Check if user has permission to manage roles
    membership = models.Membership.objects.filter(
        user=request.user, club=club
    ).prefetch_related('roles').first()

    if not membership or not membership.has_permission('can_manage_members'):
        return response.Response(
            {'detail': 'You do not have permission to create roles in this club.'},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = serializers.RoleCreateUpdateSerializer(
        data=request.data,
        context={'club': club, 'request': request}
    )

    if not serializer.is_valid():
        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    role = serializer.save(club=club)

    return response.Response(
        serializers.RoleSerializer(role, context={'request': request}).data,
        status=status.HTTP_201_CREATED
    )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_role_to_member(request, pk, user_id):
    """
    Add a role to a member (without removing existing roles)
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)
    user = get_object_or_404(User, pk=user_id)

    # Check permissions
    is_owner = club.owner == request.user

    if not is_owner:

        # perm = club_permissions.HasRolePermission()
        # perm.permission_name = 'can_manage_members'

        # if not perm.has_object_permission(request, None, club):
        #     return response.Response(
        #         {'detail': 'You do not have permission to manage roles.'},
        #         status=status.HTTP_403_FORBIDDEN
        #     )

        requester_membership = models.Membership.objects.filter(
            user=request.user, club=club
        ).first()

        if not requester_membership or not requester_membership.has_permission('can_manage_members'):
            return response.Response(
                {'detail': 'You do not have permission to manage roles.'},
                status=status.HTTP_403_FORBIDDEN
            )

    # Get membership
    try:
        membership = models.Membership.objects.get(user=user, club=club)
    except models.Membership.DoesNotExist:
        return response.Response(
            {'detail': 'User is not a member of this club.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Get role to add
    role_id = request.data.get('role_id')
    role_name = request.data.get('role_name')

    if not role_id and not role_name:
        return response.Response(
            {'detail': 'Provide either role_id or role_name.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get role
    try:
        if role_id:
            role = models.Role.objects.get(id=role_id, club=club)
        else:
            role = models.Role.objects.get(club=club, name__iexact=role_name)
    except models.Role.DoesNotExist:
        return response.Response(
            {'detail': 'Role not found in this club.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check if user already has this role
    if membership.roles.filter(id=role.id).exists():
        return response.Response(
            {'detail': f'User already has the "{role.name}" role.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Add the role
    membership.add_role(role)

    return response.Response({
        'detail': f'Role "{role.name}" added to {user.username}.',
        'user_id': user.id,
        'username': user.username,
        'role_id': role.id,
        'role_name': role.name,
        'current_roles': membership.role_names
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def remove_role_from_member(request, pk, user_id):
    """
    Remove a specific role from a member
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)
    user = get_object_or_404(User, pk=user_id)

    # ... permission checks ...
    is_owner = club.owner == request.user

    if not is_owner:

        # perm = club_permissions.HasRolePermission()
        # perm.permission_name = 'can_manage_members'

        # if not perm.has_object_permission(request, None, club):
        #     return response.Response(
        #         {'detail': 'You do not have permission to manage roles.'},
        #         status=status.HTTP_403_FORBIDDEN
        #     )

        requester_membership = models.Membership.objects.filter(
            user=request.user, club=club
        ).first()

        if not requester_membership or not requester_membership.has_permission('can_manage_members'):
            return response.Response(
                {'detail': 'You do not have permission to manage roles.'},
                status=status.HTTP_403_FORBIDDEN
            )

    # Get membership
    try:
        membership = models.Membership.objects.get(user=user, club=club)
    except models.Membership.DoesNotExist:
        return response.Response(
            {'detail': 'User is not a member of this club.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Get role to remove
    role_id = request.data.get('role_id')
    role_name = request.data.get('role_name')

    if not role_id and not role_name:
        return response.Response(
            {'detail': 'Provide either role_id or role_name.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get role
    try:
        if role_id:
            role = models.Role.objects.get(id=role_id, club=club)
        else:
            role = models.Role.objects.get(club=club, name__iexact=role_name)
    except models.Role.DoesNotExist:
        return response.Response(
            {'detail': 'Role not found in this club.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check if user has this role
    if not membership.roles.filter(id=role.id).exists():
        return response.Response(
            {'detail': f'User does not have the "{role.name}" role.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if this is the last admin role
    if role.has_permission('can_manage_settings'):
        # Count admins by checking all memberships
        admin_count = sum(
            1 for m in models.Membership.objects.filter(club=club).prefetch_related('roles')
            if m.has_permission('can_manage_settings')
        )
        if admin_count <= 1:
            return response.Response(
                {'detail': 'Cannot remove the last admin role. Add another admin role first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

    # Remove the role
    membership.remove_role(role)

    return response.Response({
        'detail': f'Role "{role.name}" removed from {user.username}.',
        'user_id': user.id,
        'username': user.username,
        'removed_role': role.name,
        'current_roles': membership.role_names,
        'primary_role': membership.primary_role.name if membership.primary_role else None
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def set_primary_role(request, pk, user_id):
    """
    Set a specific role as primary for a member
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)
    user = get_object_or_404(User, pk=user_id)

    # Check permissions
    is_owner = club.owner == request.user

    if not is_owner:
        requester_membership = models.Membership.objects.filter(
            user=request.user, club=club
        ).first()

        if not requester_membership or not requester_membership.has_permission('can_manage_members'):
            # Allow users to set their own primary role
            if request.user != user:
                return response.Response(
                    {'detail': 'You do not have permission to set primary roles.'},
                    status=status.HTTP_403_FORBIDDEN
                )

    # Get membership
    try:
        membership = models.Membership.objects.get(user=user, club=club)
    except models.Membership.DoesNotExist:
        return response.Response(
            {'detail': 'User is not a member of this club.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Get role to set as primary
    role_id = request.data.get('role_id')
    role_name = request.data.get('role_name')

    if not role_id and not role_name:
        return response.Response(
            {'detail': 'Provide either role_id or role_name.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get role
    try:
        if role_id:
            role = models.Role.objects.get(id=role_id, club=club)
        else:
            role = models.Role.objects.get(club=club, name__iexact=role_name)
    except models.Role.DoesNotExist:
        return response.Response(
            {'detail': 'Role not found in this club.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check if user has this role
    if not membership.roles.filter(id=role.id).exists():
        return response.Response(
            {'detail': f'User does not have the "{role.name}" role.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Set as primary
    membership.set_primary_role(role)

    return response.Response({
        'detail': f'Primary role set to "{role.name}" for {user.username}.',
        'user_id': user.id,
        'username': user.username,
        'primary_role': role.name,
        'all_roles': membership.role_names
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_club_posts(request, pk):
    """Get all posts in a club"""
    club = get_object_or_404(models.Club, pk=pk, is_active=True)

    # Check if user can view club posts
    if not (club.privacy == 'public' or club.members.filter(id=request.user.id).exists()):
        return response.Response(
            {'detail': 'You do not have permission to view posts in this club.'},
            status=status.HTTP_403_FORBIDDEN
        )

    posts = club.club_posts.filter(
        post__is_deleted=False
    ).select_related('post', 'post__author').order_by('-created_at')

    from apps.posts.serializers import PostSerializer

    paginator = pagination.StandardResultsSetPagination()
    paginated_posts = paginator.paginate_queryset(posts, request)

    serializer = PostSerializer(
        [p.post for p in paginated_posts],
        many=True,
        context={'request': request}
    )

    return paginator.get_paginated_response({
        'club_id': club.id,
        'club_name': club.name,
        'posts': serializer.data
    })


# Add this to your views.py

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def recommended_clubs(request):
    """
    Get recommended clubs for the authenticated user based on:
    - Clubs with similar origin/type
    - Clubs with friends/mutual connections
    - Popular clubs in user's location
    - Clubs related to user's interests (if available)
    """
    from apps.accounts.serializers import UserProfileSerializer
    user = request.user

    # Base query for active clubs
    clubs = models.Club.objects.filter(is_active=True)
    clubs = clubs.exclude(privacy='secret')

    # Exclude clubs user is already a member of
    user_club_ids = models.Membership.objects.filter(
        user=user).values_list('club_id', flat=True)
    clubs = clubs.exclude(id__in=user_club_ids)
    

    # Priority 1: Clubs with same origin as user's clubs
    user_origins = models.Membership.objects.filter(
        user=user
    ).values_list('club__origin', flat=True).distinct()

    if user_origins:
        clubs_same_origin = clubs.filter(origin__in=user_origins)
        if clubs_same_origin.exists():
            clubs = clubs_same_origin

    # If no same-origin clubs, try clubs from same origin as user's profile
    if hasattr(user, 'profile') and user.profile.origin:
        clubs_same_origin = clubs.filter(origin__iexact=user.profile.origin)
        if clubs_same_origin.exists():
            clubs_same_origin = clubs_same_origin.exclude(
                id__in=clubs.values_list('id', flat=True)
            )
            clubs = clubs | clubs_same_origin

    # (assuming user has department/origin field)
    # if not clubs.exists() and hasattr(user, 'department'):
    #     clubs = clubs.filter(origin__icontains=user.department)

    # Filter public clubs if user doesn't have specific origin matches
    if not clubs.exists():
        clubs = clubs.filter(is_public=True)
        
    # Annotate with popularity metrics
    clubs = clubs.annotate(
        member_count=Count('members', distinct=True),
        post_count=Count('club_posts', distinct=True),
        engagement_score=Count('club_posts', distinct=True) +
        Count('members', distinct=True)
        # Limit to 20 recommendations
    ).order_by('-engagement_score', '-member_count')[:20]

    # Add user membership info
    clubs = clubs.prefetch_related(
        Prefetch(
            'memberships',
            queryset=models.Membership.objects.filter(
                user=user).prefetch_related('roles'),
            to_attr='user_memberships'
        )
    )
    

    serializer = serializers.ClubListSerializer(
        clubs, many=True, context={'request': request}
    )
    # user_serializer = UserProfileSerializer(user)

    return response.Response({
        # 'user': user_serializer.data,
        'user_id': user.id,
        'username': user.username,
        'recommendation_basis': 'engagement_and_popularity',
        'total_recommendations': clubs.count(),
        'clubs': serializer.data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def club_stats(request, pk):
    """
    Get detailed statistics for a club
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)

    # Check if user is member
    is_member = models.Membership.objects.filter(
        user=request.user, club=club).exists()
    is_owner = club.owner == request.user

    if club.privacy != 'public' and not (is_member or is_owner):
        return response.Response(
            {'detail': 'You must be a club member to view statistics.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Basic stats
    member_count = club.members.count()
    post_count = club.club_posts.count()
    event_count = club.events.count()

    # Role distribution
    roles_data = []
    for role in club.roles.all():
        user_count = role.user_count() if hasattr(role, 'user_count') else 0
        roles_data.append({
            'role_id': str(role.id),
            'role_name': role.name,
            'user_count': user_count,
            'color': role.color,
            'is_default': role.is_default
        })

    # Activity over time (last 30 days)
    from django.utils import timezone
    from django.db.models import Count
    from datetime import timedelta

    thirty_days_ago = timezone.now() - timedelta(days=30)

    # Recent posts (last 30 days)
    recent_posts = models.Post.objects.filter(
        club=club,
        created_at__gte=thirty_days_ago
    ).count()

    # Recent events (last 30 days)
    recent_events = models.Event.objects.filter(
        club=club,
        created_at__gte=thirty_days_ago
    ).count()

    # New members (last 30 days)
    new_members = models.Membership.objects.filter(
        club=club,
        joined_at__gte=thirty_days_ago
    ).count()

    # Engagement rate (if member_count > 0)
    engagement_rate = 0
    if member_count > 0:
        # Calculate as percentage of active members
        engagement_rate = min(
            100, (recent_posts + recent_events) / member_count * 100)

    return response.Response({
        'club_id': str(club.id),
        'club_name': club.name,
        'overview': {
            'total_members': member_count,
            'total_posts': post_count,
            'total_events': event_count,
            'created_at': club.created_at,
            'privacy': club.privacy
        },
        'recent_activity': {
            'posts_last_30_days': recent_posts,
            'events_last_30_days': recent_events,
            'new_members_last_30_days': new_members,
            'engagement_rate': round(engagement_rate, 2)
        },
        'role_distribution': roles_data,
        'membership_info': {
            'is_member': is_member,
            'is_owner': is_owner,
            'joined_at': models.Membership.objects.filter(
                user=request.user, club=club
            ).values_list('joined_at', flat=True).first() if is_member else None
        }
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def trending_clubs(request):
    """
    Get trending clubs (most active/popular in last 7 days)
    """
    from django.utils import timezone
    from datetime import timedelta

    week_ago = timezone.now() - timedelta(days=7)

    clubs = models.Club.objects.filter(
        is_active=True
    ).exclude(
      privacy='secret'  
    ).annotate(
        member_count=Count('members', distinct=True),
        recent_posts=Count('club_posts', filter=Q(
            club_posts__created_at__gte=week_ago)),
        recent_events=Count('events', filter=Q(
            events__created_at__gte=week_ago)),
        trending_score=Count('club_posts', filter=Q(club_posts__created_at__gte=week_ago)) * 2 +
        Count('events', filter=Q(events__created_at__gte=week_ago)) * 3 +
        Count('members', distinct=True) * 0.5
    ).order_by('-trending_score', '-member_count')[:10]

    serializer = serializers.ClubListSerializer(
        clubs, many=True, context={'request': request}
    )

    return response.Response({
        'period': 'last_7_days',
        'total_trending': clubs.count(),
        'clubs': serializer.data
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def search_clubs(request):
    """
    Search clubs by name, origin, or description
    """
    query = request.query_params.get('q', '')

    if not query or len(query.strip()) < 2:
        return response.Response(
            {'detail': 'Search query must be at least 2 characters.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    clubs = models.Club.objects.filter(
        is_active=True,
        privacy='public'
    ).filter(
        Q(name__icontains=query) |
        Q(origin__icontains=query) |
        Q(about__icontains=query) |
        Q(slug__icontains=query)
    ).distinct().annotate(
        member_count=Count('members', distinct=True),
        post_count=Count('club_posts', distinct=True)
    ).order_by('-member_count', '-created_at')

    paginator = pagination.StandardResultsSetPagination()
    paginated_clubs = paginator.paginate_queryset(clubs, request)

    serializer = serializers.ClubListSerializer(
        paginated_clubs, many=True, context={'request': request}
    )

    return paginator.get_paginated_response({
        'query': query,
        'total_results': clubs.count(),
        'results': serializer.data
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def clubs_by_origin(request, origin):
    """
    Get all clubs from a specific origin
    """
    clubs = models.Club.objects.filter(
        is_active=True,
        privacy='public',
        origin__iexact=origin
    ).annotate(
        member_count=Count('members', distinct=True),
        post_count=Count('club_posts', distinct=True)
    ).order_by('-member_count', '-created_at')

    paginator = pagination.StandardResultsSetPagination()
    paginated_clubs = paginator.paginate_queryset(clubs, request)

    serializer = serializers.ClubListSerializer(
        paginated_clubs, many=True, context={'request': request}
    )

    return paginator.get_paginated_response({
        'origin': origin,
        'total_clubs': clubs.count(),
        'clubs': serializer.data
    })


# views.py
class ClubMediaUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _check_permission(self, request, club):
        is_owner = club.owner == request.user
        has_admin_perm = False
        if not is_owner:
            membership = models.Membership.objects.filter(
                user=request.user, club=club
            ).first()
            if membership:
                has_admin_perm = membership.has_permission(
                    'can_manage_settings')
        return is_owner or has_admin_perm

    def post(self, request, pk):
        club = get_object_or_404(models.Club, pk=pk, is_active=True)

        if not self._check_permission(request, club):
            return response.Response(
                {'detail': 'You do not have permission to update club media.'},
                status=status.HTTP_403_FORBIDDEN
            )

        is_avatar = request.FILES.get('avatar')
        is_banner = request.FILES.get('banner')

        if not (is_avatar or is_banner):
            return response.Response(
                {'detail': 'Please provide either "avatar" or "banner" file.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if is_avatar:
            serializer = serializers.ClubAvatarUploadSerializer(
                data=request.data)
        else:
            serializer = serializers.ClubBannerUploadSerializer(
                data=request.data)

        if serializer.is_valid():
            file = request.FILES.get('avatar' if is_avatar else 'banner')

            import os
            import time
            from django.core.files.storage import default_storage
            from django.core.files.base import ContentFile

            upload_path_prefix = 'images/club-pictures'

            ext = os.path.splitext(file.name)[1]
            filename = f"club_{club.id}_{'avatar' if is_avatar else 'banner'}_{int(time.time())}{ext}"
            file_path = os.path.join(upload_path_prefix, filename)

            # Save file
            saved_path = default_storage.save(
                file_path, ContentFile(file.read()))

            # Construct URL
            file_url = os.path.join(
                settings.MEDIA_URL, saved_path).replace('\\', '/')

            # Update Club model
            if is_avatar:
                club.avatar = file_url
            else:
                club.banner = file_url
            club.save()

            return response.Response({
                'detail': f"{'Avatar' if is_avatar else 'Banner'} updated successfully.",
                'url': file_url
            }, status=status.HTTP_200_OK)

        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        return self.post(request, pk)

    def delete(self, request, pk):
        club = get_object_or_404(models.Club, pk=pk, is_active=True)

        if not self._check_permission(request, club):
            return response.Response(
                {'detail': 'You do not have permission to delete club media.'},
                status=status.HTTP_403_FORBIDDEN
            )

        media_type = request.query_params.get('type')
        if media_type not in ['avatar', 'banner']:
            return response.Response(
                {'detail': 'Please provide "type" parameter as "avatar" or "banner".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if media_type == 'avatar':
            club.avatar = None
        else:
            club.banner = None

        club.save()

        return response.Response(
            {'detail': f'{media_type.capitalize()} deleted successfully.'},
            status=status.HTTP_200_OK
        )


# @api_view(['POST'])
# @permission_classes([permissions.IsAuthenticated])
# @parser_classes([parsers.MultiPartParser])
# def upload_club_avatar(request, pk):
#     """
#     Upload a new profile picture for the authenticated user
#     """
#     club = get_object_or_404(models.Club, pk=pk, is_active=True)
#     avatar = request.FILES.get('club_pictures')

#     if not avatar:
#         return response.Response({
#             'message': 'No image file provided'
#         }, status=status.HTTP_400_BAD_REQUEST)

#     # Validate file type
#     allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
#     file_extension = avatar.name.lower().split('.')[-1]

#     if f'.{file_extension}' not in allowed_extensions:
#         return response.Response({
#             'message': f'Invalid file type. Allowed extensions: {", ".join(allowed_extensions)}'
#         }, status=status.HTTP_400_BAD_REQUEST)

#     # Validate file size (5MB max)
#     max_size = 5 * 1024 * 1024
#     if avatar.size > max_size:
#         return response.Response({
#             'message': 'File size too large. Maximum size is 5MB'
#         }, status=status.HTTP_400_BAD_REQUEST)

#     # Delete old profile picture if exists
#     if club.avatar:
#         club.avatar.delete(save=False)

#     # Set new profile picture
#     club.avatar = avatar
#     club.save(update_fields=['avatar'])

#     return response.Response({
#         'message': 'Profile picture updated successfully',
#         'avatar_url': request.build_absolute_uri(club.avatar.url) if club.avatar else None
#     }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, club_permissions.IsClubAdminOrModerator])
def get_club_permissions(request, pk):
    """
    Get all permissions available for the club
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)

    is_member = models.Membership.objects.filter(
        user=request.user, club=club
    ).exists()
    is_owner = club.owner == request.user

    if not (is_member or is_owner):
        return response.Response(
            {'detail': 'You must be a club member to view permissions.'},
            status=status.HTTP_403_FORBIDDEN
        )

    roles = club.roles.all().order_by('name')
    serializer = serializers.RoleSerializer(
        roles,
        many=True,
        context={'request': request}
    )

    # all unique permission keys from all roles
    all_permissions = sorted(
        list(set().union(*(role.permissions.keys() for role in roles))))

    return response.Response({
        'club_id': str(club.id),
        'club_name': club.name,
        'total_roles': roles.count(),
        'all_permissions': all_permissions,
        # 'roles': serializer.data
    })
