# apps/clubs/permissions.py
from rest_framework import permissions
from .models import Membership


def get_club_from_obj(obj):
    if hasattr(obj, "members"):
        return obj
    if hasattr(obj, "club"):
        return obj.club
    raise ValueError("Object has no club relation")

class IsSuperUserOnly(permissions.BasePermission):
    """
    Custom permission to only allow access to users with the is_superuser=True flag.
    """
    message = "You must be a Superuser to access this endpoint."

    def has_permission(self, request, view):
        # 1. Check if the user is authenticated (set by the JWT).
        if not request.user.is_authenticated:
            return False

        # 2. The core check: Is the user a superuser?
        return request.user.is_superuser


class IsClubMember(permissions.BasePermission):
    """
    Allow access only to club members
    """

    def has_object_permission(self, request, view, obj):
        # obj can be Club or a related model (Post, Event)
        if club.owner == request.user:
            return True
        club = get_club_from_obj(obj)
        return Membership.objects.filter(user=request.user, club=club).exists()


class IsClubAdminOrModerator(permissions.BasePermission):
    """
    Allow access only to users with can_manage_members permission or club owner
    """

    def has_object_permission(self, request, view, obj):
        club = obj if hasattr(obj, 'members') else obj.club

        # Check if user is the club owner
        if club.owner == request.user:
            return True

        # Check if user has can_manage_members permission through any role
        membership = Membership.objects.filter(
            user=request.user, club=club).prefetch_related('roles').first()
        return membership and membership.has_permission('can_manage_members')


class IsClubAdmin(permissions.BasePermission):
    """
    Allow access only to club owner or users with can_manage_settings permission
    """

    def has_object_permission(self, request, view, obj):
        club = obj if hasattr(obj, 'members') else obj.club

        # Check if user is the club owner
        if club.owner == request.user:
            return True

        # Check if user has can_manage_settings permission through any role
        membership = Membership.objects.filter(
            user=request.user, club=club).prefetch_related('roles').first()
        return membership and membership.has_permission('can_manage_settings')


class IsAuthorOrClubMod(permissions.BasePermission):
    """
    Allow edit access to content author, club owner, or users with can_manage_posts permission
    """

    def has_object_permission(self, request, view, obj):
        # Safe methods allowed for all club members
        if request.method in permissions.SAFE_METHODS:
            return Membership.objects.filter(user=request.user, club=club).exists()

        # Author can edit their own content
        if hasattr(obj, 'author') and obj.author == request.user:
            return True

        # Creator can edit their own content
        if hasattr(obj, 'creator') and obj.creator == request.user:
            return True

        club = obj.club

        # Check if user is the club owner
        if club.owner == request.user:
            return True

        # Check if user has can_manage_posts permission through any role
        membership = Membership.objects.filter(
            user=request.user, club=club).prefetch_related('roles').first()
        return membership and membership.has_permission('can_manage_posts')



class HasRolePermission(permissions.BasePermission):
    """
    Checks if a user has a specific permission in a club
    Works with standard role permissions + custom_permissions
    """
    permission_name = None  # e.g., 'can_manage_events'
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        club = get_club_from_obj(obj)
        
        # Owner always has all permissions
        if request.user == club.owner:
            return True
        
        try:
            membership = Membership.objects.get(user=request.user, club=club)
        except Membership.DoesNotExist:
            return False
        
        role_perms = membership.get_permissions_dict()  # returns dict of all role perms
        custom_perms = membership.custom_permissions or {}
        all_perms = {**role_perms, **custom_perms}  # custom_permissions overwrite role perms if conflict
        
        return all_perms.get(self.permission_name, False)