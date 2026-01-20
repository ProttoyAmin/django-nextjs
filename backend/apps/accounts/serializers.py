from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from djoser.serializers import TokenCreateSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.validators import UnicodeUsernameValidator
from . import models
from apps.clubs.models import Club, Membership, Role

from apps.interactions.models import Like, Comment, Share
from djoser.serializers import UserCreateSerializer
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from apps.institutes.models import Institute


EDUCATION_EMAIL_DOMAINS = [
    '@g.bracu.ac.bd',
    '@diu.edu.bd',
]

PROFESSIONAL_EMAIL_DOMAINS = [
    '@bracu.ac.bd',
]


def get_institutes():
    """Get all institutes"""
    return Institute.objects.filter(is_active=True)


def get_email_domain_list(institute):
    """Get list of active email domains for an institute"""
    if not institute:
        return []
    domains = institute.get_active_email_domains()
    return {
        domain.domain_type: domain.domain for domain in domains
    }


def match_email_and_type(email: str, domain_map: dict):
    """
    Returns (True, user_type) if email matches a domain
    Returns (False, None) if no match
    """
    if not domain_map:
        return True, None  # fallback / allow-all case

    for user_type, domain in domain_map.items():
        if email.endswith(domain):
            return True, user_type

    return False, None


class ProfilePictureSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.User
        fields = ['profile_picture']


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.User
        exclude = ['password']
        read_only_fields = ['last_active']

    def get_profile_picture_url(self, obj):
        """Return full URL for profile picture"""
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None


class RegistrationSerializer(UserCreateSerializer):
    class Meta(UserCreateSerializer.Meta):
        model = models.User
        fields = (
            "id",
            "username",
            "email",
            "password",
            "re_password",
            "professional_email",
            "type",
        )

    def create(self, validated_data):
        professional_email = validated_data.pop('professional_email', None)
        user_type = validated_data.pop('type', None)

        user = models.User.objects.create_user(**validated_data)

        if professional_email:
            user.professional_email = professional_email
        if user_type:
            user.type = user_type

        user.save()
        return user


class RegisterSerializer(serializers.ModelSerializer):
    
    
    re_password = serializers.CharField(write_only=True, required=True)
    institute = serializers.PrimaryKeyRelatedField(
        queryset=Institute.objects.filter(is_active=True),
        required=False,
        allow_null=True
    )
    user_type = None

    class Meta:
        model = models.User
        fields = ["id", "username", "email", "password",
                  "re_password", "institute", "professional_email"]
        extra_kwargs = {
            'username': {'required': True, 'validators': [UnicodeUsernameValidator()]},
            'password': {'write_only': True},
            'email': {'required': True, 'validators': []},
            'professional_email': {'required': False},
        }

    def validate(self, data):
        print("Validating registration data:", data)

        if ' ' in data['username']:
            raise serializers.ValidationError(
                {'username': 'Username should not contain any spaces'}
            )
        
        

        institute = data.get('institute')
        professional_email = data.get('professional_email')

        if institute:
            domain_list = get_email_domain_list(institute)
            print("Domain List:", domain_list)
            if domain_list:
                if not professional_email:
                    raise serializers.ValidationError({
                        'professional_email': 'Professional e-mail is required for this institute'
                    })
                    
                matched, target_type = match_email_and_type(professional_email, domain_list)
                if not matched:
                    raise serializers.ValidationError({
                        'professional_email': 'Professional e-mail must be a valid institute e-mail address'
                    })
                data['type'] = target_type

        if data['password'] != data['re_password']:
            raise serializers.ValidationError(
                {"re_password": "Passwords do not match"})

        if models.User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError(
                {"username": "Username already exists"})

        if models.User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError(
                {"email": "Email already exists"})

        if data.get('professional_email') and models.User.objects.filter(professional_email=data['professional_email']).exists():
            raise serializers.ValidationError(
                {"professional_email": "Professional e-mail already exists"})

        try:
            validate_password(
                password=data["password"],
                user=models.User(
                    username=data.get("username"),
                    email=data.get("email"),
                )
            )
        except DjangoValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})

        return data

    def create(self, validated_data):
        validated_data.pop('re_password')
        password = validated_data.pop('password')

        user = models.User(**validated_data)
        user.set_password(password)
        user.is_active = False  # Requires email verification
        user.save()

        return user


class CustomTokenObtainPairSerializer(serializers.Serializer):
    username_or_email = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username_or_email = attrs.get("username_or_email")
        password = attrs.get("password")

        if "@" in username_or_email:
            try:
                user_obj = models.User.objects.get(email=username_or_email)
                username = user_obj.username
            except models.User.DoesNotExist:
                raise serializers.ValidationError(
                    "No account found with this email.")
        else:
            username = username_or_email

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError(
                {"username_or_email": "No username or password found in our database"})

        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        refresh = RefreshToken.for_user(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }


class UserClubMembershipSerializer(serializers.ModelSerializer):
    """Serializer for user's club memberships"""
    from apps.clubs.models import Club, Membership
    
    club_id = serializers.CharField(source='club.id', read_only=True)
    club_name = serializers.CharField(source='club.name', read_only=True)
    club_slug = serializers.CharField(source='club.slug', read_only=True)
    # club_avatar = serializers.URLField(source='club.avatar', read_only=True)
    is_public = serializers.BooleanField(
        source='club.is_public', read_only=True)
    is_visible = serializers.BooleanField(
        source='club.is_visible', read_only=True)
    is_active = serializers.BooleanField(
        source='club.is_active', read_only=True)
    role_name = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()
    role_permissions = serializers.SerializerMethodField()
    club_url = serializers.SerializerMethodField()
    club_avatar = serializers.SerializerMethodField()
    club_banner = serializers.SerializerMethodField()

    class Meta:
        model = Membership
        fields = ['club_id', 'club_name', 'club_slug', 'club_avatar', 'club_banner', 'is_public',
                  'is_visible', 'is_active', 'club_url', 'is_owner', 'role_name', 'role_permissions', 'joined_at']

    def get_club_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/v1/clubs/{obj.club.id}/')
        return None

    def get_club_avatar(self, obj):
        request = self.context.get('request')
        if obj.club.avatar:
            if request:
                return request.build_absolute_uri(obj.club.avatar)
        else:
            return None

    def get_club_banner(self, obj):
        request = self.context.get('request')
        if obj.club.banner:
            if request:
                return request.build_absolute_uri(obj.club.banner)
        else:
            return None

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if not (request and request.user.is_authenticated):
            return False
        return obj.club.owner == request.user

    def get_role_name(self, obj):
        """Get role name for this membership"""
        if obj.primary_role:
            return obj.primary_role.name
        roles = list(obj.roles.all())
        if roles:
            return roles[0].name
        return "Member"

    def get_role_permissions(self, obj):
        """Get combined role permissions for this membership"""
        permissions = {
            'can_manage_members': False,
            'can_manage_posts': False,
            'can_manage_events': False,
            'can_manage_settings': False,
        }
        for role in obj.roles.all():
            role_perms = role.get_all_permissions()
            for perm_name, has_perm in role_perms.items():
                if has_perm:
                    permissions[perm_name] = True
        return permissions


class UserProfileSerializer(serializers.ModelSerializer):
    """Detailed user profile with club, post, and follow information"""
    # Personal info
    department = serializers.SerializerMethodField()
    # Institute info
    institute = serializers.CharField(
        source='institute.name', read_only=True)
    institute_id = serializers.CharField(
        source='institute.id', read_only=True
    )
    # Club stats
    club_count = serializers.SerializerMethodField()
    clubs = serializers.SerializerMethodField()
    clubs_url = serializers.SerializerMethodField()

    # Post stats
    user_post_count = serializers.IntegerField(read_only=True)
    club_post_count = serializers.SerializerMethodField()
    total_posts_count = serializers.IntegerField(read_only=True)
    posts_url = serializers.SerializerMethodField()

    # Follow stats
    follower_count = serializers.IntegerField(read_only=True)
    following_count = serializers.IntegerField(read_only=True)
    pending_requests_count = serializers.IntegerField(read_only=True)
    followers_url = serializers.SerializerMethodField()
    following_url = serializers.SerializerMethodField()

    # Current user's relationship with this user
    is_following = serializers.SerializerMethodField()
    is_followed_by = serializers.SerializerMethodField()
    is_mutual = serializers.SerializerMethodField()
    follow_status = serializers.SerializerMethodField()
    can_view_profile = serializers.SerializerMethodField()

    # Activity stats
    likes_given = serializers.IntegerField(
        source='total_likes_given', read_only=True)
    comments_made = serializers.IntegerField(
        source='total_comments_made', read_only=True)
    shares_made = serializers.IntegerField(
        source='total_shares_made', read_only=True)
    likes_received = serializers.IntegerField(
        source='total_likes_received', read_only=True)

    # URLs
    url = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        visible_fields = [
            'id', 'username', 'first_name', 'last_name', 'email', 'professional_email', 'url', 'institute',
            'institute_id', 'student_id', 'department', 'year', 'level', 'type', 'preferred_email',
            'profile_picture_url', 'avatar', 'bio', 'location', 'website', 'date_of_birth',
            'email_verified', 'is_private', 'status', 'is_status_manual',
            'club_count', 'clubs', 'clubs_url',
            'user_post_count', 'club_post_count', 'total_posts_count', 'posts_url',
            'follower_count', 'following_count', 'pending_requests_count',
            'followers_url', 'following_url',
            'is_following', 'is_followed_by', 'is_mutual', 'follow_status', 'can_view_profile',
            'likes_given', 'comments_made', 'shares_made', 'likes_received',
            'last_active', 'created_at', 'updated_at', 'last_login'
        ]

        model = models.User
        fields = visible_fields
        read_only_fields = [
            'id', 'email', 'professional_email', 'email_verified',
            'created_at', 'updated_at', 'last_login'
        ]

    def update(self, instance, validated_data):
        # If status is being updated, it's a manual change
        if 'status' in validated_data:
            instance.is_status_manual = True
            # Special case: if manually setting to online, we actually clear manual flag
            # as per the user's request that online should always go to away on leave.
            if validated_data['status'] == 'online':
                instance.is_status_manual = False

        return super().update(instance, validated_data)

    def __init__(self, *args, fields=None, **kwargs):
        super().__init__(*args, **kwargs)

        if fields is not None:
            # Get the existing set of fields from the Meta class
            existing_fields = set(self.fields)

            # Determine the fields to be removed
            removable_fields = existing_fields - set(fields)

            # Remove fields not present in the 'fields' argument
            for field_name in removable_fields:
                self.fields.pop(field_name)

    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
        return None

    def get_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/v1/accounts/auth/{obj.id}/')
        return None
    
    def get_department(self, obj):
        if obj.department:
            return obj.department.code
        return None

    def get_clubs_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/v1/accounts/auth/{obj.id}/clubs/')
        return None

    def get_posts_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/v1/accounts/auth/{obj.id}/posts/')
        return None

    def get_followers_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/v1/connections/{obj.id}/followers/')
        return None

    def get_following_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/v1/connections/{obj.id}/following/')
        return None

    def get_clubs(self, obj):
        """Return lightweight club info"""
        from apps.clubs.models import Membership
        memberships = Membership.objects.filter(
            user=obj).select_related('club').prefetch_related('roles')
        return UserClubMembershipSerializer(
            memberships,
            many=True,
            context=self.context
        ).data

    def get_club_count(self, obj):
        """Get club count from property"""
        return obj.club_count if hasattr(obj, 'club_count') else 0

    def get_club_post_count(self, obj):
        return obj.get_club_posts_count() if hasattr(obj, 'get_club_posts_count') else 0

    def get_is_following(self, obj):
        """Is current user following this user?"""
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user != obj:
            return obj.is_followed_by(request.user) if hasattr(obj, 'is_followed_by') else False
        return False

    def get_is_followed_by(self, obj):
        """Is this user following current user?"""
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user != obj:
            return obj.is_following(request.user) if hasattr(obj, 'is_following') else False
        return False

    def get_is_mutual(self, obj):
        """Are they mutual followers?"""
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user != obj:
            return obj.are_mutual_followers(request.user) if hasattr(obj, 'are_mutual_followers') else False
        return False

    def get_follow_status(self, obj):
        """Get follow status (pending, accepted, None)"""
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user != obj:
            from apps.connections.models import Follow
            return Follow.get_follow_status(request.user, obj) if hasattr(Follow, 'get_follow_status') else None
        return None

    def get_can_view_profile(self, obj):
        """Can current user view this profile?"""
        request = self.context.get('request')
        if request:
            if request.user.is_authenticated:
                return obj.can_view_profile(request.user) if hasattr(obj, 'can_view_profile') else True
            else:
                # Anonymous users - only public profiles
                return not obj.is_private if hasattr(obj, 'is_private') else True
        return not obj.is_private if hasattr(obj, 'is_private') else True


class UserListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing users"""
    club_count = serializers.SerializerMethodField()
    post_count = serializers.IntegerField(
        source='total_posts_count', read_only=True)
    url = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = models.User
        fields = [
            'id', 'username', 'profile_picture_url', 'avatar',
            'bio', 'club_count', 'post_count', 'url', 'created_at'
        ]

    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
        return None

    def get_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/v1/users/{obj.id}/')
        return None

    def get_club_count(self, obj):
        """Get club count from property"""
        return obj.club_count if hasattr(obj, 'club_count') else 0


class UserBasicSerializer(serializers.ModelSerializer):
    """Minimal user info for nested serialization"""
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = models.User
        fields = ['id', 'username', 'profile_picture_url', 'avatar']

    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
        return None


class RoleBasicSerializer(serializers.ModelSerializer):
    """Basic serializer for Role model"""
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ['id', 'name', 'color', 'user_count', 'is_default']

    def get_user_count(self, obj):
        """Get count of users with this role"""
        return obj.user_count() if hasattr(obj, 'user_count') else 0


class UserRoleInClubSerializer(serializers.Serializer):
    """Serializer for user's roles in a specific club"""
    club_id = serializers.IntegerField()
    club_name = serializers.CharField()
    role_names = serializers.ListField(child=serializers.CharField())
    permissions = serializers.DictField()

    def to_representation(self, instance):
        """instance is a dict with club and roles info"""
        return {
            'club_id': instance['club'].id,
            'club_name': instance['club'].name,
            'role_names': instance['role_names'],
            'permissions': instance['permissions']
        }
