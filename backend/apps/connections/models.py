# apps/followers/models.py
from django.db import models
from django.core.exceptions import ValidationError
from core.generate import generate_snowflake_id


class Follow(models.Model):
    """
    Optimized Follow relationship model
    - Uses symmetrical relationship for efficient queries
    - Includes status for handling private accounts (pending/accepted)
    - Indexed for fast lookups
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('blocked', 'Blocked'),
    ]

    id = models.BigIntegerField(primary_key=True, default=generate_snowflake_id, editable=False)
    
    # The user who is following (follower)
    follower = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='following_set',  # this person is following Users
        db_index=True
    )
    
    # The user being followed (following)
    following = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='follower_set',  # this person is follower by Users
        db_index=True
    )
    
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='accepted'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Ensure a user can't follow another user twice
        unique_together = ('follower', 'following')
        ordering = ['-created_at']
        indexes = [
            # Composite indexes for efficient queries
            models.Index(fields=['follower', 'status']),
            models.Index(fields=['following', 'status']),
            models.Index(fields=['follower', 'following', 'status']),
            models.Index(fields=['created_at']),
        ]
        verbose_name = 'Follow'
        verbose_name_plural = 'Follows'

    def __str__(self):
        return f"{self.follower.username} follows {self.following.username} ({self.status})"

    def clean(self):
        """Validate that user can't follow themselves"""
        if self.follower == self.following:
            raise ValidationError("Users cannot follow themselves.")

    def save(self, *args, **kwargs):
        """Custom save with validation"""
        self.clean()
        super().save(*args, **kwargs)

    @classmethod
    def is_following(cls, follower, following):
        """Check if follower is following the user (accepted status only)"""
        return cls.objects.filter(
            follower=follower,
            following=following,
            status='accepted'
        ).exists()

    @classmethod
    def get_follow_status(cls, follower, following):
        """Get the follow status between two users"""
        try:
            follow = cls.objects.get(follower=follower, following=following)
            return follow.status
        except cls.DoesNotExist:
            return None

    @classmethod
    def are_mutual_followers(cls, user1, user2):
        """Check if two users follow each other"""
        return (
            cls.objects.filter(follower=user1, following=user2, status='accepted').exists() and
            cls.objects.filter(follower=user2, following=user1, status='accepted').exists()
        )


class FollowRequest(models.Model):
    """
    Separate model for follow requests (optional - for notifications)
    Used primarily for tracking and notifications
    """
    id = models.BigIntegerField(primary_key=True, default=generate_snowflake_id, editable=False)
    follow = models.OneToOneField(Follow, on_delete=models.CASCADE, related_name='request')
    seen = models.BooleanField(default=False)  # Has the user seen this request?
    notified = models.BooleanField(default=False)  # Has notification been sent?
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['follow', 'seen']),
        ]

    def __str__(self):
        return f"Request: {self.follow}"


class Block(models.Model):
    """
    Block relationship - users can block others
    Blocked users cannot follow, see posts, or interact
    """
    id = models.BigIntegerField(primary_key=True, default=generate_snowflake_id, editable=False)
    
    # User who is blocking
    blocker = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='blocking_set'
    )
    
    # User being blocked
    blocked = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='blocked_by_set'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('blocker', 'blocked')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['blocker', 'blocked']),
        ]

    def __str__(self):
        return f"{self.blocker.username} blocked {self.blocked.username}"

    def clean(self):
        """Validate that user can't block themselves"""
        if self.blocker == self.blocked:
            raise ValidationError("Users cannot block themselves.")

    def save(self, *args, **kwargs):
        """Remove any existing follow relationships when blocking"""
        self.clean()
        
        # Remove follow relationships in both directions
        Follow.objects.filter(
            follower=self.blocker,
            following=self.blocked
        ).delete()
        
        Follow.objects.filter(
            follower=self.blocked,
            following=self.blocker
        ).delete()
        
        super().save(*args, **kwargs)

    @classmethod
    def is_blocked(cls, blocker, blocked):
        """Check if blocker has blocked the user"""
        return cls.objects.filter(blocker=blocker, blocked=blocked).exists()

    @classmethod
    def has_blocked_each_other(cls, user1, user2):
        """Check if either user has blocked the other"""
        return cls.objects.filter(
            models.Q(blocker=user1, blocked=user2) |
            models.Q(blocker=user2, blocked=user1)
        ).exists()