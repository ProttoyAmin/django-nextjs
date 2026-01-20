# apps/accounts/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.contrib.contenttypes.fields import GenericRelation
from core.generate import generate_snowflake_id
from apps.posts.models import Post
from apps.clubs.models import Role
from . import managers
# Create your models here.


class User(AbstractUser):
    USER_TYPES = [
        ('student', 'Student'),
        ('faculty', 'Faculty'),
        ('staff', 'Staff'),
        ('alumni', 'Alumni'),
        ('other', 'Other'),
    ]

    GENDER_TYPES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other')
    ]

    EMAIL_PREFERENCE_CHOICES = [
        ('email', 'Personal Email'),
        ('professional_email', 'Professional Email'),
    ]

    STATUS_CHOICES = [
        ('online', 'Online'),
        ('away', 'Away'),
        ('dnd', 'Do Not Disturb'),
    ]

    institute = models.ForeignKey(
        "institutes.Institute",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users"
    )
    professional_email = models.EmailField(
        unique=True, blank=True, null=True, default='')
    student_id = models.CharField(unique=True, blank=True, null=True)
    department = models.ForeignKey(
        "institutes.Department",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users"
    )
    year = models.PositiveSmallIntegerField(blank=True, null=True)
    level = models.PositiveBigIntegerField(blank=True, null=True)
    email_verified = models.BooleanField(default=False)
    last_active = models.DateTimeField(null=True, blank=True)
    profile_picture = models.ImageField(
        upload_to='images/profile-pictures/',
        null=True,
        blank=True,
        default=None
    )
    avatar = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    gender = models.CharField(
        max_length=20, choices=GENDER_TYPES, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    type = models.CharField(max_length=50, choices=USER_TYPES,
                            blank=False, null=True, default=None)
    preferred_email = models.CharField(
        max_length=20,
        choices=EMAIL_PREFERENCE_CHOICES,
        default='email',
        help_text="Which email address to use for notifications"
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='online',
        help_text="User's current online status"
    )
    is_status_manual = models.BooleanField(
        default=False,
        help_text="Whether the status was set manually by the user"
    )
    is_private = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'username'

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['email']),
        ]

    def __str__(self):
        return f'{self.username} - {self.id}'
    
    def get_full_name(self):
        """Return the full name of the user"""
        full_name = f'{self.first_name} {self.last_name}'.strip()
        return full_name if full_name else self.username

    # ==================== CLUB RELATED PROPERTIES ====================
    
    @property
    def origin(self):
        """Get the user origin (institute name)"""
        return self.institute.name if self.institute else None

    @property
    def joined_clubs(self):
        """Get all clubs the user is a member of"""
        return self.clubs.all()

    @property
    def club_count(self):
        """Count of clubs user has joined"""
        return self.clubs.count()

    @property
    def owned_clubs(self):
        """Get clubs where user is the owner"""
        from apps.clubs.models import Club
        return Club.objects.filter(owner=self, is_active=True)

    @property
    def member_clubs(self):
        """Get all clubs where user is a member (through membership)"""
        from apps.clubs.models import Membership
        memberships = Membership.objects.filter(
            user=self
        ).select_related('club')
        return [m.club for m in memberships]

    @property
    def club_count(self):
        """Count of clubs user is member of"""
        from apps.clubs.models import Membership
        return Membership.objects.filter(user=self).count()

    def is_club_member(self, club):
        """Check if user is a member of a specific club"""
        return self.clubs.filter(id=club.id).exists()

    def is_club_owner(self, club):
        """Check if user is the owner of a specific club"""
        return club.owner == self

    def has_club_permission(self, club, permission_name):
        """Check if user has a specific permission in a club"""
        from apps.clubs.models import Membership
        try:
            membership = Membership.objects.get(user=self, club=club)
            return membership.has_permission(permission_name)
        except Membership.DoesNotExist:
            return False

    def get_club_roles(self, club):
        """Get all roles a user has in a specific club"""
        from apps.clubs.models import Membership
        try:
            membership = Membership.objects.get(user=self, club=club)
            return list(membership.roles.all())
        except Membership.DoesNotExist:
            return []

    def get_club_role_names(self, club):
        """Get role names for a user in a specific club"""
        roles = self.get_club_roles(club)
        return [role.name for role in roles] if roles else []

    def get_all_club_roles(self):
        """Get all roles across all clubs"""
        from apps.clubs.models import Membership
        memberships = Membership.objects.filter(
            user=self).prefetch_related('roles', 'club')
        roles = []
        for membership in memberships:
            for role in membership.roles.all():
                roles.append({
                    'club': membership.club,
                    'role': role
                })
        return roles

    # def get_club_permssions(self, club):
    #     """Get all permissions for a user in a specific club"""
    #     from apps.clubs.models import Membership
    #     try:
    #         membership = Membership.objects.get(user=self, club=club)
    #         permissions = set()
    #         for role in membership.roles.all():
    #             permissions.update(role.permissions.all())
    #         return list(permissions)
    #     except Membership.DoesNotExist:
    #         return []

    def get_club_posts_count(self):
        """Count of posts in clubs"""
        from apps.posts.models import Post
        return Post.objects.filter(author=self, club_post__isnull=False).count()

    def get_club_posts(self):
        """Get all club posts created by this user"""
        from apps.posts.models import Post
        return Post.objects.filter(author=self, club__isnull=False, is_deleted=False)

    # ==================== CONNECTIONS RELATED PROPERTIES ====================

    @property
    def follower_count(self):
        """Count of users following this user (accepted only)"""
        from apps.connections.models import Follow
        return Follow.objects.filter(following=self, status='accepted').count()

    @property
    def following_count(self):
        """Count of users this user is following (accepted only)"""
        from apps.connections.models import Follow
        return Follow.objects.filter(follower=self, status='accepted').count()

    @property
    def pending_follow_requests_count(self):
        """Count of pending follow requests (for private accounts)"""
        from apps.connections.models import Follow
        return Follow.objects.filter(following=self, status='pending').count()

    def get_followers(self):
        """Get all users following this user (accepted only)"""
        from apps.connections.models import Follow
        follow_relationships = Follow.objects.filter(
            following=self,
            status='accepted'
        ).select_related('follower')
        return [f.follower for f in follow_relationships]

    def get_following(self):
        """Get all users this user is following (accepted only)"""
        from apps.connections.models import Follow
        follow_relationships = Follow.objects.filter(
            follower=self,
            status='accepted'
        ).select_related('following')
        return [f.following for f in follow_relationships]

    def is_following(self, user):
        """Check if this user is following another user"""
        if not isinstance(user, User):
            return False
        from apps.connections.models import Follow
        return Follow.is_following(self, user)

    def is_followed_by(self, user):
        """Check if this user is followed by another user"""
        if not isinstance(user, User):
            return False
        from apps.connections.models import Follow
        return Follow.is_following(user, self)

    def are_mutual_followers(self, user):
        """Check if two users follow each other"""
        if not isinstance(user, User):
            return False
        from apps.connections.models import Follow
        return Follow.are_mutual_followers(self, user)

    def has_blocked(self, user):
        """Check if this user has blocked another user"""
        if not isinstance(user, User):
            return False
        from apps.connections.models import Block
        return Block.is_blocked(self, user)

    def is_blocked_by(self, user):
        """Check if this user is blocked by another user"""
        if not isinstance(user, User):
            return False
        from apps.connections.models import Block
        return Block.is_blocked(user, self)

    def can_view_profile(self, viewer):
        """
        Check if viewer can view this user's profile
        Rules:
        1. Own profile - always yes
        2. Blocked - no
        3. Public profile - yes
        4. Private profile + follower - yes
        5. Private profile + not follower - no
        """
        # User can always view their own profile
        if viewer == self:
            return True

        # Handle anonymous users
        if not isinstance(viewer, User) or not viewer.is_authenticated:
            # Anonymous users can only view public profiles
            return not self.is_private

        # Check if blocked
        from apps.connections.models import Block
        if Block.has_blocked_each_other(self, viewer):
            return False

        # Public profiles are visible to all
        if not self.is_private:
            return True

        # Private profiles only visible to accepted followers
        from apps.connections.models import Follow
        return Follow.is_following(viewer, self)

    def can_view_posts(self, viewer):
        """
        Check if viewer can view this user's posts
        Same logic as profile viewing
        """
        return self.can_view_profile(viewer)

    # ==================== POST RELATED PROPERTIES ====================

    @property
    def user_posts(self):
        """Get all user posts (non-club posts)"""
        from apps.posts.models import Post
        return Post.objects.filter(author=self, club__isnull=True, is_deleted=False)

    @property
    def user_post_count(self):
        """Count of user posts"""
        from apps.posts.models import Post
        return Post.objects.filter(author=self, club__isnull=True, is_deleted=False).count()

    @property
    def total_posts_count(self):
        """Total posts (user posts + club posts)"""
        return self.user_post_count + self.get_club_posts_count()

    # ==================== INTERACTION PROPERTIES ====================

    @property
    def total_likes_given(self):
        """Count of likes user has given"""
        return self.likes.count()

    @property
    def total_comments_made(self):
        """Count of comments user has made"""
        return self.comments.count()

    @property
    def total_shares_made(self):
        """Count of shares user has made"""
        return self.shares.count()

    @property
    def total_likes_received(self):
        """Count of likes received on ALL user's posts (club + user posts)"""
        from django.contrib.contenttypes.models import ContentType
        from apps.interactions.models import Like
        from apps.posts.models import Post

        # All posts (both user posts and club posts) are now in the Post model
        content_type = ContentType.objects.get_for_model(Post)
        post_ids = Post.objects.filter(
            author=self, is_deleted=False).values_list('id', flat=True)
        total_likes = Like.objects.filter(
            content_type=content_type,
            object_id__in=post_ids
        ).count()

        return total_likes

    # ==================== ACTIVITY METHODS ====================

    def get_notification_email(self):
        """Get the email address to use for notifications based on user preference"""
        if self.preferred_email == 'professional_email' and self.professional_email:
            return self.professional_email
        return self.email

    def get_recent_activity(self, limit=10):
        """Get user's recent activities (likes, comments, shares)"""
        from apps.interactions.models import Like, Comment, Share

        recent_likes = self.likes.all()[:limit]
        recent_comments = self.comments.all()[:limit]
        recent_shares = self.shares.all()[:limit]

        return {
            'likes': recent_likes,
            'comments': recent_comments,
            'shares': recent_shares
        }
