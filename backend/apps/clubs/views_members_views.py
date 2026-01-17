from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions, response, status
from django.db.models import Count, Q, Prefetch
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db import transaction

from . import models, serializers, permissions as club_permissions
from apps.accounts.models import User
from core import pagination

# # ==================== MEMBER VIEWS ====================


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_members(request, pk):
    """
    List all members of a club with filtering options
    Query params:
    - role: Filter by role name
    - search: Search members by username or email
    - sort: joined_at (default), username, role
    - order: asc, desc (default)
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)

    # Check if user can view members
    is_member = models.Membership.objects.filter(
        user=request.user, club=club).exists()
    is_owner = club.owner == request.user

    if club.privacy != 'public' and not (is_member or is_owner):
        return response.Response(
            {'detail': 'You must be a club member to view members.'},
            status=status.HTTP_403_FORBIDDEN
        )

    memberships = models.Membership.objects.filter(
        club=club
    ).select_related('user').prefetch_related('roles').order_by('-joined_at')

    # Filter by role name
    role_name = request.query_params.get('role')
    if role_name:
        memberships = memberships.filter(role__name__iexact=role_name)

    # Search members
    search = request.query_params.get('search')
    if search:
        memberships = memberships.filter(
            Q(user__username__icontains=search) |
            Q(user__email__icontains=search) |
            Q(user__first_name__icontains=search) |
            Q(user__last_name__icontains=search)
        )

    # Sorting
    sort_by = request.query_params.get('sort', 'joined_at')
    order = request.query_params.get('order', 'desc')

    if sort_by == 'username':
        sort_field = 'user__username'
    elif sort_by == 'role':
        sort_field = 'role__name'
    else:
        sort_field = 'joined_at'

    if order == 'asc':
        sort_field = sort_field
    else:
        sort_field = f'-{sort_field}'

    memberships = memberships.order_by(sort_field)

    paginator = pagination.StandardResultsSetPagination()
    paginated_memberships = paginator.paginate_queryset(memberships, request)

    serializer = serializers.MembershipSerializer(
        paginated_memberships,
        many=True,
        context={'request': request}
    )

    return paginator.get_paginated_response({
        'club_id': str(club.id),
        'club_name': club.name,
        'total_members': memberships.count(),
        'is_member': is_member,
        'is_owner': is_owner,
        'members': serializer.data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def member_detail(request, pk, user_id):
    """
    Get detailed information about a specific member
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)
    user = get_object_or_404(User, pk=user_id)

    # Check if user can view member details
    is_member = models.Membership.objects.filter(
        user=request.user, club=club).exists()
    is_owner = club.owner == request.user
    is_target_member = models.Membership.objects.filter(
        user=user, club=club).exists()

    if not is_target_member:
        return response.Response(
            {'detail': 'User is not a member of this club.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if club.privacy != 'public' and not (is_member or is_owner):
        return response.Response(
            {'detail': 'You must be a club member to view member details.'},
            status=status.HTTP_403_FORBIDDEN
        )

    membership = models.Membership.objects.filter(
        user=user, club=club
    ).select_related('user').first()

    # Get user's activity in club (posts, comments, etc.)
    from apps.posts.models import Post
    post_count = Post.objects.filter(
        author=user,
        club_post__club=club,
        is_deleted=False
    ).count()

    # Get role permissions combined from all roles
    role_permissions = membership.user_permissions()

    return response.Response({
        'club': {
            'id': str(club.id),
            'name': club.name,
            'slug': club.slug
        },
        'member': {
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'profile_picture': user.profile_picture.url if user.profile_picture else None,
            'joined_at': membership.joined_at,
            'post_count': post_count
        },
        'roles': [
            {
                'id': str(role.id),
                'name': role.name,
                'color': role.color
            } for role in membership.roles.all()
        ],
        'permissions': role_permissions,
        'is_owner': club.owner == user,
        'can_manage': False  # Will be populated based on requester's permissions
    })


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_member_role(request, pk, user_id):
    """
    Update a member's role in a club
    Body: { "role_id": "<role_id>" } or { "role_name": "<role_name>" }
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)
    user = get_object_or_404(User, pk=user_id)

    # Check if target user is a member
    try:
        target_membership = models.Membership.objects.get(user=user, club=club)
    except models.Membership.DoesNotExist:
        return response.Response(
            {'detail': 'User is not a member of this club.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check if requester has permission to manage members
    is_owner = club.owner == request.user

    if not is_owner:
        requester_membership = models.Membership.objects.filter(
            user=request.user, club=club
        ).prefetch_related('roles').first()

        if not requester_membership or not requester_membership.role:
            return response.Response(
                {'detail': 'You do not have permission to update member roles.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not requester_membership.role.has_permission('can_manage_members'):
            return response.Response(
                {'detail': 'You do not have permission to update member roles.'},
                status=status.HTTP_403_FORBIDDEN
            )

    # Validate role data
    role_id = request.data.get('role_id')
    role_name = request.data.get('role_name')

    if not role_id and not role_name:
        return response.Response(
            {'detail': 'Either role_id or role_name is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get the role
    try:
        if role_id:
            new_role = models.Role.objects.get(id=role_id, club=club)
        else:
            new_role = models.Role.objects.get(
                club=club, name__iexact=role_name)
    except models.Role.DoesNotExist:
        return response.Response(
            {'detail': 'Role not found in this club.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Prevent last admin from being demoted
    # Check if user currently has admin permissions and new role doesn't
    has_admin = target_membership.has_permission('can_manage_settings')
    if has_admin and not new_role.has_permission('can_manage_settings'):
        # Count admins programmatically
        admin_count = sum(
            1 for m in models.Membership.objects.filter(club=club).prefetch_related('roles')
            if m.has_permission('can_manage_settings') and m.user != club.owner
        )

        if admin_count == 1:
            return response.Response(
                {'detail': 'Cannot demote the last admin. Promote another member to admin first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

    # Prevent changing club owner's roles
    if user == club.owner:
        return response.Response(
            {'detail': 'Cannot change the club owner\'s roles.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Add the role to membership and set as primary
    target_membership.add_role(new_role, set_as_primary=True)

    serializer = serializers.MembershipSerializer(
        target_membership,
        context={'request': request}
    )

    return response.Response({
        'detail': f'Role updated to {new_role.name}.',
        'membership': serializer.data
    })


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def remove_member(request, pk, user_id):
    """
    Remove a member from the club
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)
    user = get_object_or_404(User, pk=user_id)

    # Check if target user is a member
    try:
        target_membership = models.Membership.objects.get(user=user, club=club)
    except models.Membership.DoesNotExist:
        return response.Response(
            {'detail': 'User is not a member of this club.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check if requester has permission to remove members
    is_owner = club.owner == request.user

    if not is_owner:
        requester_membership = models.Membership.objects.filter(
            user=request.user, club=club
        ).prefetch_related('roles').first()

        if not requester_membership or not requester_membership.roles:
            return response.Response(
                {'detail': 'You do not have permission to remove members.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not requester_membership.has_permission('can_manage_members'):
            return response.Response(
                {'detail': 'You do not have permission to remove members.'},
                status=status.HTTP_403_FORBIDDEN
            )

    # Prevent self-removal (use leave_club instead)
    if request.user == user:
        return response.Response(
            {'detail': 'You cannot remove yourself. Use the leave club feature instead.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Prevent removing club owner
    if user == club.owner:
        return response.Response(
            {'detail': 'Cannot remove the club owner. Transfer ownership first.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if target has higher permissions
    if target_membership.has_permission('can_manage_settings'):
        # Check if requester can manage admins (only owners or other admins)
        if not is_owner:
            if not requester_membership.has_permission('can_manage_settings'):
                return response.Response(
                    {'detail': 'You cannot remove members with admin permissions.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Prevent removing last admin
        admin_count = sum(
            1 for m in models.Membership.objects.filter(club=club).prefetch_related('roles')
            if m.has_permission('can_manage_settings') and m.user != club.owner
        )
        print('admin count',admin_count)

        if admin_count == 1:
            return response.Response(
                {'detail': 'Cannot remove the last admin. Promote another member to admin first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

    # Remove the member
    target_membership.delete()

    return response.Response({
        'detail': f'Member {user.username} removed from {club.name}.',
        'removed_user': {
            'id': user.id,
            'username': user.username
        },
        'club': {
            'id': str(club.id),
            'name': club.name
        }
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_roles(request, pk):
    """
    List all roles in a club
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)

    # Check if user is a member
    is_member = models.Membership.objects.filter(
        user=request.user, club=club).exists()
    is_owner = club.owner == request.user

    if club.privacy != 'public' and not (is_member or is_owner):
        return response.Response(
            {'detail': 'You must be a club member to view roles.'},
            status=status.HTTP_403_FORBIDDEN
        )

    roles = club.roles.all().order_by('name')

    # Filter by user_id if provided
    user_id = request.query_params.get('user_id')
    if user_id:
        # Get roles assigned to specific user
        user_roles = []
        for role in roles:
            if role.users.filter(id=user_id).exists():
                user_roles.append(role)
        roles = user_roles

    serializer = serializers.RoleSerializer(
        roles,
        many=True,
        context={'request': request}
    )

    return response.Response({
        'club_id': club.id,
        'club_name': club.name,
        'total_roles': roles.count(),
        'roles': serializer.data
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_role(request, pk):
    """
    Create a new role in a club
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)

    # Check if user has permission to create roles
    is_owner = club.owner == request.user

    if not is_owner:
        membership = models.Membership.objects.filter(
            user=request.user, club=club
        ).prefetch_related('roles').first()

        if not membership or not membership.roles.exists():
            return response.Response(
                {'detail': 'You do not have permission to create roles.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not membership.has_permission('can_manage_roles'):
            return response.Response(
                {'detail': 'You do not have permission to create roles.'},
                status=status.HTTP_403_FORBIDDEN
            )

    serializer = serializers.RoleCreateUpdateSerializer(
        data=request.data,
        context={'club': club, 'request': request}
    )

    if serializer.is_valid():
        role = serializer.save(club=club)

        full_serializer = serializers.RoleSerializer(
            role,
            context={'request': request}
        )

        return response.Response(
            full_serializer.data,
            status=status.HTTP_201_CREATED
        )

    return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def manage_role(request, pk, role_id):
    """
    Update or delete a role
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)
    role = get_object_or_404(models.Role, pk=role_id, club=club)

    # Check if user has permission to manage roles
    is_owner = club.owner == request.user

    if not is_owner:
        membership = models.Membership.objects.filter(
            user=request.user, club=club
        ).prefetch_related('roles').first()

        if not membership or not membership.roles:
            return response.Response(
                {'detail': 'You do not have permission to manage roles.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not membership.has_permission('can_manage_members'):
            return response.Response(
                {'detail': 'You do not have permission to manage roles.'},
                status=status.HTTP_403_FORBIDDEN
            )

    if request.method == 'PATCH':
        serializer = serializers.RoleCreateUpdateSerializer(
            role,
            data=request.data,
            partial=True,
            context={'club': club, 'request': request}
        )

        if serializer.is_valid():
            updated_role = serializer.save()

            # Return full role data
            full_serializer = serializers.RoleSerializer(
                updated_role,
                context={'request': request}
            )

            return response.Response(full_serializer.data)

        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        # Prevent deleting default roles
        if role.is_default:
            return response.Response(
                {'detail': 'Cannot delete default roles.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if role is in use
        user_count = role.user_count() if hasattr(role, 'user_count') else 0
        if user_count > 0:
            return response.Response(
                {'detail': f'Cannot delete role with {user_count} members. Reassign members first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        role_name = role.name
        role.delete()

        return response.Response({
            'detail': f'Role "{role_name}" deleted successfully.',
            'deleted_role': role_name
        })


# ============= NEW MEMBER VIEWS =============

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_members(request, pk):
    """
    Search members within a club
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)

    # Check if user can view members
    is_member = models.Membership.objects.filter(
        user=request.user, club=club).exists()
    is_owner = club.owner == request.user

    if club.privacy != 'public' and not (is_member or is_owner):
        return response.Response(
            {'detail': 'You must be a club member to search members.'},
            status=status.HTTP_403_FORBIDDEN
        )

    query = request.query_params.get('q', '')

    if not query or len(query.strip()) < 2:
        return response.Response(
            {'detail': 'Search query must be at least 2 characters.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    memberships = models.Membership.objects.filter(
        club=club
    ).filter(
        Q(user__username__icontains=query) |
        Q(user__email__icontains=query) |
        Q(user__first_name__icontains=query) |
        Q(user__last_name__icontains=query)
    ).select_related('user', 'club').order_by('user__username')

    serializer = serializers.MembershipSerializer(
        memberships,
        many=True,
        context={'request': request}
    )

    return response.Response({
        'club_id': club.id,
        'club_name': club.name,
        'query': query,
        'total_results': memberships.count(),
        'members': serializer.data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_roles(request, pk, user_id):
    """
    Get all roles assigned to a specific user in a club
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)
    user = get_object_or_404(User, pk=user_id)

    # Check if user is a member
    is_member = models.Membership.objects.filter(
        user=request.user, club=club).exists()
    is_owner = club.owner == request.user

    if club.privacy != 'public' and not (is_member or is_owner):
        return response.Response(
            {'detail': 'You must be a club member to view user roles.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Get user's membership
    membership = models.Membership.objects.filter(
        user=user, club=club
    ).prefetch_related('roles').first()

    if not membership:
        return response.Response({
            'club_id': str(club.id),
            'club_name': club.name,
            'user_id': user.id,
            'username': user.username,
            'is_member': False,
            'roles': []
        })

    # Get all roles for this membership
    roles = []
    for role in membership.roles.all():
        roles.append({
            'id': str(role.id),
            'name': role.name,
            'color': role.color,
            'is_default': role.is_default,
            'permissions': role.get_all_permissions()
        })

    return response.Response({
        'club_id': str(club.id),
        'club_name': club.name,
        'user_id': str(user.id),
        'username': user.username,
        'is_member': True,
        'joined_at': membership.joined_at,
        'roles': roles
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def role_users(request, pk, role_id):
    """
    Get all users with a specific role in a club
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)
    role = get_object_or_404(models.Role, pk=role_id, club=club)

    # Check if user can view members
    is_member = models.Membership.objects.filter(
        user=request.user, club=club).exists()
    is_owner = club.owner == request.user

    if club.privacy != 'public' and not (is_member or is_owner):
        return response.Response(
            {'detail': 'You must be a club member to view role users.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Get users with this role
    memberships = models.Membership.objects.filter(
        club=club,
        roles=role
    ).select_related('user').order_by('joined_at')

    users_data = []
    for membership in memberships:
        users_data.append({
            'user_id': membership.user.id,
            'username': membership.user.username,
            'email': membership.user.email,
            'first_name': membership.user.first_name,
            'last_name': membership.user.last_name,
            'profile_picture': membership.user.profile_picture.url if membership.user.profile_picture else None,
            'joined_at': membership.joined_at
        })

    return response.Response({
        'club_id': club.id,
        'club_name': club.name,
        'role_id': role.id,
        'role_name': role.name,
        'total_users': len(users_data),
        'users': users_data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def role_users_by_name(request, pk, role_name):
    """
    Get all users with a specific role (by name) in a club
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)

    # Try to get role by name (case-insensitive)
    try:
        role = models.Role.objects.get(club=club, name__iexact=role_name)
    except models.Role.DoesNotExist:
        return response.Response(
            {'detail': f'Role "{role_name}" not found in this club.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check if user can view members
    is_member = models.Membership.objects.filter(
        user=request.user, club=club).exists()
    is_owner = club.owner == request.user

    if club.privacy != 'public' and not (is_member or is_owner):
        return response.Response(
            {'detail': 'You must be a club member to view role users.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Get users with this role
    memberships = models.Membership.objects.filter(
        club=club,
        roles=role
    ).select_related('user').order_by('joined_at')

    users_data = []
    for membership in memberships:
        users_data.append({
            'user_id': membership.user.id,
            'username': membership.user.username,
            'email': membership.user.email,
            'first_name': membership.user.first_name,
            'last_name': membership.user.last_name,
            'profile_picture': membership.user.profile_picture.url if membership.user.profile_picture else None,
            'joined_at': membership.joined_at
        })

    return response.Response({
        'club_id': club.id,
        'club_name': club.name,
        'role_id': role.id,
        'role_name': role.name,
        'total_users': len(users_data),
        'users': users_data
    })


# ============= CLUB INVITATION VIEWS =============

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def invite_member(request, pk):
    """
    Send club invitation to a user
    Required: invitee_id
    Optional: message
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)
    membership = models.Membership.objects.filter(club=club, user=request.user
                                                  ).prefetch_related('roles').first()

    # Check if user has permission to invite members

    can_invite = False
    if request.user.id == club.owner:
        can_invite = True
    elif membership:
        can_invite = membership.has_permission('can_manage_members')

    if not can_invite:
        return response.Response(
            {'detail': 'You don\'t have permission to invite members to this club'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Prepare data for serializer
    data = {
        'invite_type': 'club',
        'club': club.id,
        'inviter': request.user.id,
        'invitee': request.data.get('invitee_id'),
        'message': request.data.get('message', '')
    }

    serializer = serializers.InviteSerializer(
        data=data,
        context={'request': request}
    )

    if serializer.is_valid():
        invite = serializer.save()
        return response.Response(
            serializers.InviteSerializer(
                invite, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_club_invites(request, pk):
    """
    List all club invitations
    Query params:
    - status: pending|accepted|declined|expired
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)

    # Check permissions
    membership = models.Membership.objects.filter(
        user=request.user,
        club=club
    ).prefetch_related('roles').first()

    is_owner = club.owner == request.user

    can_view = False
    if is_owner:
        can_view = True
    elif membership:
        can_view = membership.has_permission('can_manage_members')

    if not can_view:
        return response.Response(
            {'detail': 'You don\'t have permission to view club invitations'},
            status=status.HTTP_403_FORBIDDEN
        )

    invites = models.Invite.objects.filter(
        invite_type='club',
        club=club
    ).select_related('inviter', 'invitee').order_by('-created_at')

    # Filter by status
    invite_status = request.query_params.get('status')
    if invite_status in ['pending', 'accepted', 'declined', 'expired']:
        invites = invites.filter(status=invite_status)

    paginator = pagination.StandardResultsSetPagination()
    paginated_invites = paginator.paginate_queryset(invites, request)

    serializer = serializers.InviteSerializer(
        paginated_invites,
        many=True,
        context={'request': request}
    )

    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_club_invites(request):
    """
    Get all pending club invitations for the authenticated user
    """
    invites = models.Invite.objects.filter(
        invite_type='club',
        invitee=request.user,
        status='pending'
    ).select_related('inviter', 'club').order_by('-created_at')

    paginator = pagination.StandardResultsSetPagination()
    paginated_invites = paginator.paginate_queryset(invites, request)

    serializer = serializers.InviteSerializer(
        paginated_invites,
        many=True,
        context={'request': request}
    )

    return paginator.get_paginated_response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def accept_club_invite(request, invite_id):
    """
    Accept a club invitation
    """
    invite = get_object_or_404(
        models.Invite,
        pk=invite_id,
        invite_type='club',
        invitee=request.user
    )

    success, message = invite.accept()

    if success:
        return response.Response(
            {
                'detail': message,
                'invite_id': invite.id,
                'club_id': invite.club.id,
                'club_name': invite.club.name
            },
            status=status.HTTP_200_OK
        )

    return response.Response(
        {'detail': message},
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def decline_club_invite(request, invite_id):
    """
    Decline a club invitation
    """
    invite = get_object_or_404(
        models.Invite,
        pk=invite_id,
        invite_type='club',
        invitee=request.user
    )

    success, message = invite.decline()

    if success:
        return response.Response(
            {'detail': message, 'invite_id': invite.id},
            status=status.HTTP_200_OK
        )

    return response.Response(
        {'detail': message},
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_club_invite(request, invite_id):
    """
    Cancel a club invitation (inviter only)
    """
    invite = get_object_or_404(
        models.Invite,
        pk=invite_id,
        invite_type='club',
        inviter=request.user
    )

    success, message = invite.cancel()

    if success:
        return response.Response(
            {'detail': message, 'invite_id': invite.id},
            status=status.HTTP_200_OK
        )

    return response.Response(
        {'detail': message},
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_permissions(request, pk, user_id):
    """
    Get all permissions for a specific user in a club
    requires: user_id
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)
    user = get_object_or_404(User, pk=user_id)
    u = User.objects.first()

    methods = user.can_view_profile(user)
    return response.Response({
        "user_permissions": methods
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_club_permissions(request, pk, user_id):
    """
    Get all permissions for a specific user in a club
    requires: user_id
    """
    import json, inspect
    from apps.clubs.serializers import MembershipSerializer
    
    club = get_object_or_404(models.Club, pk=pk, is_active=True)
    user = get_object_or_404(User, pk=user_id)
    membership = get_object_or_404(models.Membership, user=user, club=club)
    all_roles = membership.roles.all()
    methods = user.get_all_permissions()
    custom_methods = [
    name for name, value in inspect.getmembers(models.Membership)
    if inspect.isfunction(value)
]


    permissions = {}

    return response.Response({
        "callable_methods": custom_methods
    })
