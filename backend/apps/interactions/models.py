from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from core.generate import generate_snowflake_id


# Create your models here.

class Like(models.Model):
    """
    Generic Like model that works with ANY content (ClubPost, UserPost, etc.)
    Uses Django's ContentType framework for flexibility
    """
    id = models.BigIntegerField(primary_key=True, default=generate_snowflake_id, editable=False)
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='likes')

    # Generic relation to any content type, allows liking different models (Post, ClubPost, etc)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.BigIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Prevent a user from liking the same object/posts multiple times
        unique_together = ('user', 'content_type', 'object_id')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),         # For faster lookups of likes on a specific object
            models.Index(fields=['user', 'content_type']),              # For faster lookups of what a user has liked
        ]


        def __str__(self):
            return f"{self.user.username} likes {self.content_type}"


class Comment(models.Model):
    """
    Generic Comment model that works with ANY content (ClubPost, UserPost, etc.)
    Supports nested replies via parent field
    """
    id = models.BigIntegerField(primary_key=True, default=generate_snowflake_id, editable=False)
    author = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()

    # Generic relation to any content type, allows commenting on different models (Post, ClubPost, etc)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.BigIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    parent = models.ForeignKey('self', on_delete=models.CASCADE, related_name='replies', null=True, blank=True)
    is_edited = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['content_type', 'object_id', 'created_at']),
            models.Index(fields=['parent']),
        ]


    def __str__(self):
        return f"Comment by {self.author.username} on {self.content_type}"
    

    @property
    def total_likes(self):
        """Count likes on this comment"""
        content_type = ContentType.objects.get_for_model(self)
        return Like.objects.filter(
            content_type=content_type,
            object_id=self.id
        ).count()
    
    @property
    def total_replies(self):
        """Count direct replies to this comment"""
        return self.replies.count()
    

class Share(models.Model):
    """
    Generic Share model for sharing posts (future implementation)
    """
    id = models.BigIntegerField(primary_key=True, default=generate_snowflake_id, editable=False)
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='shares')
    
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.BigIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Optional message when sharing
    message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'content_type', 'object_id')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
        ]

    def __str__(self):
        return f"{self.user.username} shared {self.content_object}"
