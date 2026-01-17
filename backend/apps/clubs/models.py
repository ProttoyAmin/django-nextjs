from django.db import models
from django.contrib.contenttypes.fields import GenericRelation
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from core.generate import generate_snowflake_id
# from apps.accounts.models import User
from apps.posts.models import Post
from apps.interactions.models import Like, Comment, Share
from django.conf import settings


class Club(models.Model):
    PRIVACY_CHOICES = [
        ('public', 'Public'),
        ('closed', 'Closed'),
        ('secret', 'Secret')
    ]

    id = models.BigIntegerField(
        primary_key=True, default=generate_snowflake_id, editable=False)
    name = models.CharField(max_length=100)
    origin = models.CharField(
        max_length=50,
        blank=False,
        null=False,
        help_text="Origin/location of the club (e.g., 'BRACU', 'International', 'Online')"
    )
    about = models.TextField(blank=True, null=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    avatar = models.URLField(blank=True, null=True)
    banner = models.URLField(blank=True, null=True)
    is_public = models.BooleanField(default=True)
    is_visible = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='club_owner')
    privacy = models.CharField(
        max_length=20, choices=PRIVACY_CHOICES, default='public')
    allow_public_posts = models.BooleanField(default=True)
    rules = models.TextField(blank=True, null=True, default='',
                             help_text="Club rules and guidelines")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='clubs',
        through='Membership',
        blank=True
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['slug']),
            models.Index(fields=['name', 'origin']),
            models.Index(fields=['privacy', 'is_active']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['name', 'origin'],
                name='unique_name_origin_per_club'
            )
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            import uuid
            base_slug = slugify(self.name)
            unique_id = str(uuid.uuid4())[:8]
            self.slug = f"{base_slug}{self.origin}{unique_id}".lower()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.origin})"

    @property
    def total_members(self):
        return self.members.count()

    @property
    def total_posts(self):
        return self.posts.filter(is_deleted=False).count()

    @property
    def total_events(self):
        return self.events.count()

    def get_members_by_role(self, role_name):
        """Get all members with a specific role"""
        return self.members.filter(
            memberships__role__name__iexact=role_name
        ).distinct()

    def get_all_roles_with_members(self):
        """Get all roles with their members"""
        from collections import defaultdict
        roles_members = defaultdict(list)

        memberships = Membership.objects.filter(
            club=self).select_related('role', 'user')
        for membership in memberships:
            role_name = membership.role.name if membership.role else "Member"
            roles_members[role_name].append(membership.user)

        return dict(roles_members)


class Role(models.Model):
    """Dynamic role model for clubs - allows custom roles with specific permissions"""
    id = models.BigIntegerField(
        primary_key=True, default=generate_snowflake_id, editable=False)
    club = models.ForeignKey(
        Club, on_delete=models.CASCADE, related_name='roles')
    name = models.CharField(
        max_length=50, help_text="Role name (e.g., Member, Moderator, Admin)")

    # Consolidated permissions field
    permissions = models.JSONField(
        default=dict,
        blank=True,
        help_text="Permission dictionary with keys like 'can_manage_members', 'can_manage_posts', etc."
    )

    is_default = models.BooleanField(
        default=False,
        help_text="Is this a default role (e.g., Member role for new joiners)"
    )
    color = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        help_text="Hex color code for role display (e.g., #FF5733)"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Unique role name per club (case-insensitive)
        constraints = [
            models.UniqueConstraint(
                fields=['club', 'name'],
                name='unique_role_name_per_club',
                condition=models.Q(name__isnull=False)
            )
        ]
        ordering = ['name']
        indexes = [
            models.Index(fields=['club', 'name']),
            models.Index(fields=['club', 'is_default']),
        ]

    def clean(self):
        """Validate that role name is case-insensitive unique within club"""
        if self.name:
            existing = Role.objects.filter(
                club=self.club,
                name__iexact=self.name
            ).exclude(id=self.id)

            if existing.exists():
                raise ValidationError(
                    f'A role with name "{self.name}" already exists in this club.'
                )

    def save(self, *args, **kwargs):
        if self.name:
            self.name = self.name.strip()
        # Ensure permissions is a dict
        if not isinstance(self.permissions, dict):
            self.permissions = {}
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.club.name})"

    @property
    def is_admin(self):
        """Check if role has admin-level permissions"""
        return self.permissions.get('can_manage_settings', False) or (
            self.permissions.get('can_manage_members', False) and
            self.permissions.get('can_manage_posts', False)
        )

    def has_permission(self, permission_name: str) -> bool:
        """Check if role has a specific permission"""
        return self.permissions.get(permission_name, False)

    def set_permission(self, permission_name: str, value: bool):
        """Set a specific permission"""
        if not isinstance(self.permissions, dict):
            self.permissions = {}
        self.permissions[permission_name] = value
        self.save()

    def get_all_permissions(self) -> dict:
        """Get all permissions for this role"""
        return self.permissions.copy() if isinstance(self.permissions, dict) else {}

    @property
    def users(self):
        """Get all users who have this role"""
        from apps.accounts.models import User
        return User.objects.filter(
            club_memberships__club=self.club,
            club_memberships__roles=self
        ).distinct()

    def user_count(self):
        return self.users.count()


class Membership(models.Model):
    """
    Now supports multiple roles per user through a ManyToMany relationship
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='club_memberships'
    )
    club = models.ForeignKey(
        Club,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    # CHANGE: Changed from ForeignKey to ManyToManyField
    roles = models.ManyToManyField(
        Role,
        related_name='memberships',
        blank=True,
        help_text="User's roles in the club"
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    # Add a primary field to mark which role is primary/display
    primary_role = models.ForeignKey(
        Role,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='primary_for_memberships',
        help_text="Primary/display role for this membership"
    )

    class Meta:
        unique_together = ('user', 'club')
        indexes = [
            models.Index(fields=['user', 'club']),
        ]

    def __str__(self):
        role_names = ", ".join([role.name for role in self.roles.all()])
        return f"{self.user.username} in {self.club.name} ({role_names})"

    @property
    def role_names(self):
        """Get list of role names"""
        return [role.name for role in self.roles.all()]

    @property
    def display_role(self):
        """Get primary role or first role"""
        if self.primary_role:
            return self.primary_role
        return self.roles.first()

    def has_permission(self, permission_name: str) -> bool:
        """Check if user has any permission through any role"""
        for role in self.roles.all():
            if role.has_permission(permission_name):
                return True
        return False

    def user_permissions(self):
        """Get a set of all permissions the user has through their roles"""
        permissions = set()
        for role in self.roles.all():
            # All permissions are stored in the permissions JSON field
            for perm, has_perm in role.permissions.items():
                if has_perm:
                    permissions.add(perm)
        return permissions

    def add_role(self, role, set_as_primary=False):
        """Add a role to this membership"""
        self.roles.add(role)
        if set_as_primary or not self.primary_role:
            self.primary_role = role
            self.save()

    def remove_role(self, role):
        """Remove a role from this membership"""
        self.roles.remove(role)
        if self.primary_role == role:
            # Set new primary role
            new_primary = self.roles.first()
            self.primary_role = new_primary
            self.save()

    def set_primary_role(self, role):
        """Set a specific role as primary"""
        if role in self.roles.all():
            self.primary_role = role
            self.save()
            return True
        return False


class Invite(models.Model):
    """
    Unified invitation model for both club memberships and event attendance.
    - Club invites: Users with can_manage_members can invite users to join a club
    - Event invites: Users with can_manage_events can invite members to attend an event
    """

    INVITE_TYPE_CHOICES = [
        ('club', 'Club Invitation'),
        ('event', 'Event Invitation'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('expired', 'Expired'),
    ]

    id = models.BigIntegerField(
        primary_key=True, default=generate_snowflake_id, editable=False)
    invite_type = models.CharField(
        max_length=10, choices=INVITE_TYPE_CHOICES)

    # For club invites (always required)
    club = models.ForeignKey(
        'Club',
        on_delete=models.CASCADE,
        related_name='invites'
    )

    # For event invites (optional, only when invite_type='event')
    event = models.ForeignKey(
        'Event',
        on_delete=models.CASCADE,
        related_name='invites',
        null=True,
        blank=True
    )

    inviter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_invites'
    )
    invitee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_invites'
    )

    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='pending')
    message = models.TextField(blank=True)

    # Auto-expire after 7 days by default
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['club', 'status', 'created_at']),
            models.Index(fields=['event', 'status', 'created_at']),
            models.Index(fields=['invitee', 'status']),
            models.Index(fields=['inviter', 'created_at']),
        ]
        constraints = [
            # Ensure event is set for event invites
            models.CheckConstraint(
                check=~models.Q(invite_type='event', event__isnull=True),
                name='event_invite_must_have_event'
            ),
            # Only one pending club invite per user per club
            models.UniqueConstraint(
                fields=['club', 'invitee'],
                condition=models.Q(invite_type='club', status='pending'),
                name='unique_pending_club_invite'
            ),
            # Only one pending event invite per user per event
            models.UniqueConstraint(
                fields=['event', 'invitee'],
                condition=models.Q(invite_type='event', status='pending'),
                name='unique_pending_event_invite'
            ),
        ]
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        # Set expires_at to 7 days from now if not set
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=7)
        super().save(*args, **kwargs)

    def __str__(self):
        if self.invite_type == 'club':
            return f"{self.inviter.username} invited {self.invitee.username} to {self.club.name}"
        else:
            return f"{self.inviter.username} invited {self.invitee.username} to event {self.event.title}"

    @property
    def is_expired(self):
        """Check if the invitation has expired"""
        if self.status != 'pending':
            return False
        if self.expires_at is None:
            return False
        return timezone.now() > self.expires_at

    def can_accept(self):
        """Check if the invitation can be accepted"""
        if self.status != 'pending':
            return False, "Invitation has already been responded to"

        if self.is_expired:
            self.status = 'expired'
            self.save()
            return False, "Invitation has expired"

        # For club invites, check if user is already a member
        if self.invite_type == 'club':
            if Membership.objects.filter(user=self.invitee, club=self.club).exists():
                return False, "User is already a member of this club"

        # For event invites, check if user is already attending
        if self.invite_type == 'event':
            # Note: EventAttendee model needs to be created if not exists
            pass

        return True, "Can accept"

    def accept(self):
        """Accept the invitation"""
        can_accept, message = self.can_accept()
        if not can_accept:
            return False, message

        if self.invite_type == 'club':
            # Create membership with default role
            default_role = self.club.roles.filter(is_default=True).first()
            membership = Membership.objects.create(
                user=self.invitee,
                club=self.club
            )
            if default_role:
                membership.add_role(default_role, set_as_primary=True)

        elif self.invite_type == 'event':
            # Add user to event participants
            self.event.participants.add(self.invitee)

        # Update invite status
        self.status = 'accepted'
        self.responded_at = timezone.now()
        self.save()

        return True, "Invitation accepted"

    def decline(self):
        """Decline the invitation"""
        if self.status != 'pending':
            return False, "Invitation has already been responded to"

        self.status = 'declined'
        self.responded_at = timezone.now()
        self.save()

        return True, "Invitation declined"

    def cancel(self):
        """Cancel the invitation (by inviter)"""
        if self.status != 'pending':
            return False, "Cannot cancel a responded invitation"

        self.status = 'expired'
        self.save()

        return True, "Invitation cancelled"


class ClubPost(models.Model):
    """
    Lightweight wrapper for club posts.
    All post data is stored in the Post model - this just holds club-specific metadata.
    """

    id = models.BigIntegerField(
        primary_key=True, default=generate_snowflake_id, editable=False)
    # Temporarily nullable to allow migration - will create data migration to populate
    post = models.OneToOneField(
        Post,
        on_delete=models.CASCADE,
        related_name='club_post',
        null=True,
        blank=True,
        help_text="The underlying post object containing all content and interactions"
    )
    club = models.ForeignKey(
        Club,
        on_delete=models.CASCADE,
        related_name='club_posts',
        help_text="The club this post belongs to"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['club', '-created_at']),
        ]

    def __str__(self):
        return f"{self.post.title or 'Post'} in {self.club.name}"

    # Convenience properties to access post data
    @property
    def author(self):
        """Get the post author"""
        return self.post.author

    @property
    def title(self):
        """Get the post title"""
        return self.post.title

    @property
    def content(self):
        """Get the post content"""
        return self.post.content

    @property
    def post_type(self):
        """Get the post type"""
        return self.post.post_type

    @property
    def is_pinned(self):
        """Check if post is pinned"""
        return self.post.is_pinned

    @is_pinned.setter
    def is_pinned(self, value):
        """Set pinned status"""
        self.post.is_pinned = value
        self.post.save()

    @property
    def is_public(self):
        """Check if post is public"""
        return self.post.is_public

    @property
    def is_deleted(self):
        """Check if post is deleted"""
        return self.post.is_deleted

    @property
    def image(self):
        """Get post image URL"""
        return self.post.image

    @property
    def video(self):
        """Get post video URL"""
        return self.post.video

    # Interaction counts (delegated to Post)
    @property
    def like_count(self):
        """Count of likes on this post"""
        return self.post.like_count

    @property
    def comment_count(self):
        """Count of comments on this post"""
        return self.post.comment_count

    @property
    def share_count(self):
        """Count of shares of this post"""
        return self.post.share_count

    @property
    def repost_count(self):
        """Count of reposts"""
        return self.post.repost_count

    # Access to interaction relations (via the Post model)
    @property
    def likes(self):
        """Access likes on the underlying post"""
        return self.post.likes

    @property
    def comments(self):
        """Access comments on the underlying post"""
        return self.post.comments

    @property
    def shares(self):
        """Access shares on the underlying post"""
        return self.post.shares

    # Methods delegated to Post
    def soft_delete(self):
        """Soft delete the underlying post"""
        self.post.soft_delete()

    def restore(self):
        """Restore the underlying post"""
        self.post.restore()

    def get_all_media(self):
        """Get all media files for this post"""
        return self.post.get_all_media()


class Event(models.Model):
    STATUS_CHOICES = [
        ('upcoming', 'Upcoming'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.BigIntegerField(
        primary_key=True, default=generate_snowflake_id, editable=False)
    club = models.ForeignKey(
        Club, on_delete=models.CASCADE, related_name='events')
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_events')
    title = models.CharField(max_length=255)
    description = models.TextField()
    location = models.CharField(max_length=255, blank=True, null=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='upcoming')
    max_participants = models.PositiveIntegerField(blank=True, null=True)
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL, related_name='club_events', blank=True)
    image = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_time']
        indexes = [
            models.Index(fields=['club', 'start_time']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.title} - {self.club.name}"

    @property
    def participant_count(self):
        return self.participants.count()

    @property
    def is_full(self):
        if self.max_participants:
            return self.participant_count >= self.max_participants
        return False
