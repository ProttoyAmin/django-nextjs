from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import Like, Comment, Share

class LikeSerializer(serializers.ModelSerializer):
    """Works for ANY content type due to GenericForeignKey"""
    id = serializers.CharField()
    username = serializers.CharField(source='user.username', read_only=True)
    user_avatar = serializers.SerializerMethodField()
    object_id = serializers.CharField()

    class Meta:
        model = Like
        fields = "__all__"

    def get_user_avatar(self, obj):
        return getattr(obj.user, 'avatar', None)


class CommentSerializer(serializers.ModelSerializer):
    """Works for ANY content type"""
    id = serializers.CharField(read_only=True)
    # parent = serializers.CharField(read_only=True)
    author_username = serializers.CharField(source='author.username', read_only=True)
    author_id = serializers.IntegerField(source='author.id', read_only=True)
    author_url = serializers.SerializerMethodField()
    like_count = serializers.IntegerField(read_only=True)
    reply_count = serializers.IntegerField(read_only=True)
    is_liked = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'author_id', 'author_username', 'author_url', 'parent',
            'content', 'parent', 'is_edited', 'like_count', 'reply_count',
            'is_liked', 'can_edit', 'replies', 'created_at', 'updated_at'
        ]
        read_only_fields = ['author', 'is_edited', 'created_at', 'updated_at']

    def get_author_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/v1/users/{obj.author.id}/')
        return None
    
    def get_like_count(self, obj):
        like_count = obj.objects.filter(
            object_id=obj.id
        ).count()
        return like_count

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            content_type = ContentType.objects.get_for_model(obj)
            return Like.objects.filter(
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

    def get_replies(self, obj):
        if obj.parent is None:
            replies = obj.replies.all()[:5]
            return CommentSerializer(replies, many=True, context=self.context).data
        return []



class ShareSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    id = serializers.CharField()
    
    class Meta:
        model = Share
        fields = ['id', 'user', 'username', 'message', 'created_at']
        read_only_fields = ['user', 'created_at']