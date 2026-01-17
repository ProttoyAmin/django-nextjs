# apps/followers/serializers.py
from rest_framework import serializers
from .models import Follow, Block
from apps.accounts.models import User


class FollowerSerializer(serializers.ModelSerializer):
    """Serializer for follower user info"""
    user_id = serializers.IntegerField(source='follower.id', read_only=True)
    username = serializers.CharField(
        source='follower.username', read_only=True)
    first_name = serializers.CharField(
        source='follower.first_name', read_only=True)
    last_name = serializers.CharField(
        source='follower.last_name', read_only=True)
    is_private = serializers.BooleanField(
        source='follower.is_private', read_only=True)
    # Follow status: pending, accepted, or blocked
    status = serializers.CharField(read_only=True)
    avatar = serializers.SerializerMethodField()
    bio = serializers.CharField(source='follower.bio', read_only=True)
    # you_following_back = serializers.SerializerMethodField()
    you_follow_them = serializers.SerializerMethodField()
    your_follow_status = serializers.SerializerMethodField()
    user_url = serializers.SerializerMethodField()

    class Meta:
        model = Follow
        fields = ['user_id', 'username', 'first_name', 'last_name', 'avatar', 'bio',
                  'you_follow_them', 'your_follow_status',
                  'is_private', 'user_url', 'status', 'created_at']

    def get_avatar(self, obj):
        """Get follower's avatar"""
        if obj.follower.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.follower.profile_picture.url)
        return obj.follower.avatar

    def get_user_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/v1/users/{obj.follower.id}/')
        return None

    # def get_you_following_back(self, obj):
    #     """Check if the followed user is following back"""
    #     return Follow.is_following(obj.following, obj.follower)

    def get_you_follow_them(self, obj):
        """Check if YOU (current user) are following THEM (the follower)"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Follow.is_following(request.user, obj.follower)
        return False

    def get_your_follow_status(self, obj):
        """Get YOUR follow status toward THEM (pending/accepted/null)"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Follow.get_follow_status(request.user, obj.follower)
        return None


class FollowingSerializer(serializers.ModelSerializer):
    """Serializer for following user info"""
    user_id = serializers.IntegerField(source='following.id', read_only=True)
    username = serializers.CharField(
        source='following.username', read_only=True)
    avatar = serializers.SerializerMethodField()
    bio = serializers.CharField(source='following.bio', read_only=True)
    is_follower = serializers.SerializerMethodField()
    user_url = serializers.SerializerMethodField()
    is_following_back = serializers.SerializerMethodField()
    you_follow_them = serializers.SerializerMethodField()
    your_follow_status = serializers.SerializerMethodField()
    first_name =serializers.CharField(
        source='following.first_name', read_only=True
    )
    last_name =serializers.CharField(
        source='following.last_name', read_only=True
    )

    is_private = serializers.BooleanField(
        source='following.is_private', read_only=True)

    class Meta:
        model = Follow
        fields = ['user_id', 'username', 'first_name', 'last_name', 'avatar', 'bio', 'is_follower', 'is_following_back', 'you_follow_them',
                  'your_follow_status', 'is_private', 'user_url', 'status', 'created_at']

    def get_you_follow_them(self, obj):
        """Check if YOU (current user) are following THEM (the user in the list)"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Follow.is_following(request.user, obj.following)
        return False

    def get_is_following_back(self, obj):
        """Check if the followed user is following back (mutual)"""
        return Follow.is_following(obj.following, obj.follower)

    def get_your_follow_status(self, obj):
        """Get YOUR follow status toward THEM (pending/accepted/null)"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Follow.get_follow_status(request.user, obj.following)
        return None

    def get_avatar(self, obj):
        """Get following user's avatar"""
        if obj.following.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.following.profile_picture.url)
        return obj.following.avatar

    def get_is_follower(self, obj):
        """Check if this user is also a follower (mutual)"""
        return Follow.is_following(obj.following, obj.follower)

    def get_user_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/v1/accounts/auth/{obj.following.id}/')
        return None


class FollowStatusSerializer(serializers.Serializer):
    """Serializer for follow status between two users"""
    is_following = serializers.BooleanField()
    is_followed_by = serializers.BooleanField()
    is_mutual = serializers.BooleanField()
    follow_status = serializers.CharField(
        allow_null=True)  # pending, accepted, blocked, None


class UserFollowStatsSerializer(serializers.Serializer):
    """Serializer for user's follow statistics"""
    total_followers = serializers.IntegerField()
    following_count = serializers.IntegerField()
    pending_requests_count = serializers.IntegerField()
    followers_url = serializers.URLField()
    following_url = serializers.URLField()
    pending_requests_url = serializers.URLField()


class BlockedUserSerializer(serializers.ModelSerializer):
    """Serializer for blocked user info"""
    user_id = serializers.IntegerField(source='blocked.id', read_only=True)
    username = serializers.CharField(source='blocked.username', read_only=True)
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = Block
        fields = ['id', 'user_id', 'username', 'avatar', 'created_at']

    def get_avatar(self, obj):
        if obj.blocked.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.blocked.profile_picture.url)
        return obj.blocked.avatar
