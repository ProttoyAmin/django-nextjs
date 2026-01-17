# apps/posts/serializers.py
from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import Post, PostMedia
from apps.interactions.models import Like, Comment, Share
from apps.clubs.models import Role
import os


class PostMediaSerializer(serializers.ModelSerializer):
    """Serializer for PostMedia model"""
    media_url = serializers.ReadOnlyField()
    id = serializers.CharField()

    class Meta:
        model = PostMedia
        fields = ['id', 'media_type', 'image_file', 'video_file',
                  'image_url', 'video_url', 'media_url', 'order']
        read_only_fields = ['id']


class PostSerializer(serializers.ModelSerializer):
    """Detailed serializer for user posts with interaction data"""
    id = serializers.CharField()
    author_id = serializers.IntegerField(source='author.id', read_only=True)
    author_username = serializers.CharField(
        source='author.username', read_only=True)
    author_avatar = serializers.SerializerMethodField()
    author_url = serializers.SerializerMethodField()

    # Club info for club posts
    club_id = serializers.CharField(
        source='club.id', read_only=True, allow_null=True)
    club_name = serializers.CharField(
        source='club.name', read_only=True, allow_null=True)
    club_url = serializers.SerializerMethodField()

    # NEW: Multiple media support
    images = serializers.SerializerMethodField()
    videos = serializers.SerializerMethodField()
    media_files = PostMediaSerializer(many=True, read_only=True)

    # Interaction counts
    like_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    share_count = serializers.SerializerMethodField()
    repost_count = serializers.IntegerField(read_only=True)

    # User-specific data
    is_liked = serializers.SerializerMethodField()
    is_shared = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()

    # Original post info (for reposts)
    original_post_data = serializers.SerializerMethodField()

    # URLs (GitHub style)
    url = serializers.SerializerMethodField()
    likes_url = serializers.SerializerMethodField()
    comments_url = serializers.SerializerMethodField()
    shares_url = serializers.SerializerMethodField()
    like_toggle_url = serializers.SerializerMethodField()
    share_toggle_url = serializers.SerializerMethodField()
    repost_url = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'url', 'author_id', 'author_username', 'author_avatar', 'author_url',
            'club_id', 'club_name', 'club_url', 'title', 'is_pinned',
            'post_type', 'content',
            'image', 'video', 'image_file', 'video_file', 'image_url', 'video_url',
            'images', 'videos', 'media_files',  # NEW: Multiple media arrays
            'original_post', 'original_post_data',
            'like_count', 'comment_count', 'share_count', 'repost_count',
            'is_liked', 'is_shared', 'can_edit',
            'likes_url', 'comments_url', 'shares_url',
            'like_toggle_url', 'share_toggle_url', 'repost_url',
            'is_public', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'club_id',
                            'club_name', 'repost_count', 'created_at', 'updated_at']

    def get_images(self, obj):
        """Get all image media for this post"""
        images = []

        if obj.image_file or obj.image_url:
            request = self.context.get('request')
            images.append({
                'file': obj.image_url,
                'url': request.build_absolute_uri(obj.image_file.url) if obj.image_file and request else (obj.image_file.url if obj.image_file else None)
            })

        request = self.context.get('request')
        for media in obj.media_files.filter(media_type='IMAGE'):
            images.append({
                'file': media.image_url,
                'url': request.build_absolute_uri(media.image_file.url) if media.image_file and request else (media.image_file.url if media.image_file else None)
            })

        return images

    def get_videos(self, obj):
        """Get all video media for this post"""
        videos = []

        if obj.video_file or obj.video_url:
            request = self.context.get('request')
            videos.append({
                'file': obj.video_url,
                'url': request.build_absolute_uri(obj.video_file.url) if obj.video_file and request else (obj.video_file.url if obj.video_file else None)
            })

        request = self.context.get('request')
        for media in obj.media_files.filter(media_type='VIDEO'):
            videos.append({
                'file': media.video_url,
                'url': request.build_absolute_uri(media.video_file.url) if media.video_file and request else (media.video_file.url if media.video_file else None)
            })

        return videos

    def get_author_avatar(self, obj):
        """Get author's avatar (profile picture or avatar URL)"""
        if obj.author.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.author.profile_picture.url)
        return obj.author.avatar

    def get_author_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/v1/accounts/auth/users/{obj.author.id}/')
        return None

    def get_club_url(self, obj):
        """Get club URL if this is a club post"""
        if obj.club:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(f'/api/v1/clubs/{obj.club.id}/')
        return None

    def get_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/v1/posts/{obj.id}/')
        return None

    def get_likes_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/v1/posts/{obj.id}/likes/')
        return None

    def get_comments_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/v1/posts/{obj.id}/comments/')
        return None

    def get_shares_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/v1/posts/{obj.id}/shares/')
        return None

    def get_like_toggle_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/v1/posts/{obj.id}/like/')
        return None

    def get_share_toggle_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/v1/posts/{obj.id}/share/')
        return None

    def get_repost_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/v1/posts/{obj.id}/repost/')
        return None

    def get_like_count(self, obj):
        content_type = ContentType.objects.get_for_model(Post)
        return Like.objects.filter(content_type=content_type, object_id=obj.id).count()

    def get_comment_count(self, obj):
        content_type = ContentType.objects.get_for_model(Post)
        return Comment.objects.filter(
            content_type=content_type,
            object_id=obj.id,
            parent=None
        ).count()

    def get_share_count(self, obj):
        content_type = ContentType.objects.get_for_model(Post)
        return Share.objects.filter(content_type=content_type, object_id=obj.id).count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            content_type = ContentType.objects.get_for_model(Post)
            return Like.objects.filter(
                user=request.user,
                content_type=content_type,
                object_id=obj.id
            ).exists()
        return False

    def get_is_shared(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            content_type = ContentType.objects.get_for_model(Post)
            return Share.objects.filter(
                user=request.user,
                content_type=content_type,
                object_id=obj.id
            ).exists()
        return False

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.author == request.user
        return False

    def get_original_post_data(self, obj):
        """Return lightweight data about original post if this is a repost"""
        if obj.original_post and not obj.original_post.is_deleted:
            return {
                'id': str(obj.original_post.id),
                'author_username': obj.original_post.author.username,
                'author_avatar': self.get_author_avatar(obj.original_post),
                'content': obj.original_post.content[:100] + '...' if obj.original_post.content and len(obj.original_post.content) > 100 else obj.original_post.content,
                'post_type': obj.original_post.post_type,
                'image': obj.original_post.image,
                'video': obj.original_post.video,
                'image_file': obj.original_post.image_file.url if obj.original_post.image_file else None,
                'video_file': obj.original_post.video_file.url if obj.original_post.video_file else None,
                'image_url': obj.original_post.image_url,
                'video_url': obj.original_post.video_url,
                'created_at': obj.original_post.created_at
            }
        return None


class PostListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing posts (feed view)"""
    id = serializers.CharField()
    author_username = serializers.CharField(
        source='author.username', read_only=True)
    author_avatar = serializers.SerializerMethodField()
    like_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    # NEW: Multiple media support
    images = serializers.SerializerMethodField()
    videos = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'url', 'author_username', 'author_avatar',
            'title', 'post_type', 'content',
            # Backward compatibility
            'image', 'video', 'image_file', 'video_file', 'image_url', 'video_url',
            'images', 'videos',  # NEW: Multiple media arrays
            'like_count', 'comment_count', 'is_liked',
            'is_public', 'created_at'
        ]

    def get_images(self, obj):
        """Get all image media for this post"""
        images = []

        # Add single image if exists (backward compatibility)
        if obj.image_file or obj.image_url:
            request = self.context.get('request')
            images.append({
                'image_url': obj.image_url,
                'image_file': request.build_absolute_uri(obj.image_file.url) if obj.image_file and request else (obj.image_file.url if obj.image_file else None)
            })

        # Add images from PostMedia
        request = self.context.get('request')
        for media in obj.media_files.filter(media_type='IMAGE'):
            images.append({
                'image_url': media.image_url,
                'image_file': request.build_absolute_uri(media.image_file.url) if media.image_file and request else (media.image_file.url if media.image_file else None)
            })

        return images

    def get_videos(self, obj):
        """Get all video media for this post"""
        videos = []

        # Add single video if exists (backward compatibility)
        if obj.video_file or obj.video_url:
            request = self.context.get('request')
            videos.append({
                'video_url': obj.video_url,
                'video_file': request.build_absolute_uri(obj.video_file.url) if obj.video_file and request else (obj.video_file.url if obj.video_file else None)
            })

        # Add videos from PostMedia
        request = self.context.get('request')
        for media in obj.media_files.filter(media_type='VIDEO'):
            videos.append({
                'video_url': media.video_url,
                'video_file': request.build_absolute_uri(media.video_file.url) if media.video_file and request else (media.video_file.url if media.video_file else None)
            })

        return videos

    def get_author_avatar(self, obj):
        if obj.author.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.author.profile_picture.url)
        return obj.author.avatar

    def get_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/v1/posts/{obj.id}/')
        return None

    def get_like_count(self, obj):
        content_type = ContentType.objects.get_for_model(Post)
        return Like.objects.filter(content_type=content_type, object_id=obj.id).count()

    def get_comment_count(self, obj):
        content_type = ContentType.objects.get_for_model(Post)
        return Comment.objects.filter(
            content_type=content_type,
            object_id=obj.id,
            parent=None
        ).count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            content_type = ContentType.objects.get_for_model(Post)
            return Like.objects.filter(
                user=request.user,
                content_type=content_type,
                object_id=obj.id
            ).exists()
        return False


class PostCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating posts"""
    class Meta:
        model = Post
        fields = ['post_type', 'content', 'title', 'club', 'is_pinned', 'image_file', 'video_file',
                  'image_url', 'video_url', 'is_public', 'original_post']

    def validate(self, data):
        """Validate based on post type"""
        post_type = data.get('post_type', 'TEXT')

        # Check file uploads
        image_file = data.get('image_file')
        video_file = data.get('video_file')
        image_url = data.get('image_url')
        video_url = data.get('video_url')

        if post_type == 'IMAGE' and not image_file and not image_url:
            raise serializers.ValidationError({
                'image_file': 'Either image_file or image_url is required for IMAGE posts.',
                'image_url': 'Either image_file or image_url is required for IMAGE posts.'
            })

        if post_type == 'VIDEO' and not video_file and not video_url:
            raise serializers.ValidationError({
                'video_file': 'Either video_file or video_url is required for VIDEO posts.',
                'video_url': 'Either video_file or video_url is required for VIDEO posts.'
            })

        if post_type == 'TEXT' and not data.get('content'):
            raise serializers.ValidationError({
                'content': 'Content is required for TEXT posts.'
            })

        return data


class FileUploadSerializer(serializers.Serializer):
    """Serializer for file uploads"""
    file = serializers.FileField()

    def validate_file(self, value):
        """Validate file type based on file extension"""
        allowed_image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
        allowed_video_extensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm']

        # Get file extension
        file_extension = os.path.splitext(value.name)[1].lower()

        # You can pass file_type context to determine allowed extensions
        file_type = self.context.get('file_type', 'image')

        if file_type == 'image' and file_extension not in allowed_image_extensions:
            raise serializers.ValidationError(
                f'Invalid image file. Allowed extensions: {", ".join(allowed_image_extensions)}'
            )

        if file_type == 'video' and file_extension not in allowed_video_extensions:
            raise serializers.ValidationError(
                f'Invalid video file. Allowed extensions: {", ".join(allowed_video_extensions)}'
            )

        # Check file size (optional)
        max_size = 50 * 1024 * 1024  # 50MB
        if value.size > max_size:
            raise serializers.ValidationError(
                f'File size exceeds {max_size / (1024*1024)}MB')

        return value
