# serializers.py
from rest_framework import serializers as rest_serializers
from django.urls import reverse
from django.utils.text import slugify
from django.conf import settings
from . import models
import mimetypes

MAX_SIZE = 5 * 1024 * 1024


class RoleSerializer(rest_serializers.ModelSerializer):
    id = rest_serializers.CharField(read_only=True)
    user_count = rest_serializers.SerializerMethodField()

    class Meta:
        model = models.Role
        fields = [
            'id', 'name', 'permissions', 'is_default',
            'color', 'user_count'
        ]
        read_only_fields = ['id']

    def get_user_count(self, obj):
        """Get count of users with this role"""
        return obj.user_count() if hasattr(obj, 'user_count') else 0


class MembershipSerializer(rest_serializers.ModelSerializer):
    username = rest_serializers.CharField(
        source='user.username', read_only=True)
    email = rest_serializers.EmailField(source='user.email', read_only=True)
    user_id = rest_serializers.IntegerField(source='user.id', read_only=True)
    profile_picture_url = rest_serializers.SerializerMethodField()

    # CHANGE: roles is now a list
    roles = rest_serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=models.Role.objects.all(),
        required=False
    )
    role_details = RoleSerializer(source='roles', many=True, read_only=True)
    role_names = rest_serializers.SerializerMethodField()
    primary_role = rest_serializers.PrimaryKeyRelatedField(
        queryset=models.Role.objects.all(),
        required=False,
        allow_null=True
    )
    primary_role_details = RoleSerializer(
        source='primary_role', read_only=True)

    class Meta:
        model = models.Membership
        fields = [
            'id', 'user_id', 'username', 'email', 'profile_picture_url',
            'roles', 'role_details', 'role_names',
            'primary_role', 'primary_role_details', 'joined_at'
        ]

    def get_profile_picture_url(self, obj):
        request = self.context.get('request')
        if obj.user.profile_picture:
            return request.build_absolute_uri(obj.user.profile_picture.url)
        return None

    def get_role_names(self, obj):
        return obj.role_names

    def validate(self, data):
        """Validate that primary_role is in roles list"""
        primary_role = data.get('primary_role')
        roles = data.get('roles', [])

        if primary_role and primary_role not in roles:
            # Add primary role to roles if not already there
            if 'roles' in data:
                data['roles'].append(primary_role)

        return data

    def create(self, validated_data):
        roles = validated_data.pop('roles', [])
        primary_role = validated_data.pop('primary_role', None)

        membership = models.Membership.objects.create(**validated_data)

        # Add roles
        if roles:
            membership.roles.set(roles)

        # Set primary role
        if primary_role:
            membership.primary_role = primary_role
            membership.save()
        elif roles:
            # Set first role as primary if no primary specified
            membership.primary_role = roles[0]
            membership.save()

        return membership

    def update(self, instance, validated_data):
        roles = validated_data.pop('roles', None)
        primary_role = validated_data.pop('primary_role', None)

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Update roles if provided
        if roles is not None:
            instance.roles.set(roles)

        # Update primary role if provided
        if primary_role is not None:
            instance.primary_role = primary_role

        instance.save()
        return instance


class InviteSerializer(rest_serializers.ModelSerializer):
    """Serializer for club and event invitations"""
    inviter_details = rest_serializers.SerializerMethodField()
    invitee_details = rest_serializers.SerializerMethodField()
    club_name = rest_serializers.CharField(source='club.name', read_only=True)
    event_title = rest_serializers.CharField(
        source='event.title', read_only=True, allow_null=True)
    is_expired = rest_serializers.BooleanField(read_only=True)

    class Meta:
        model = models.Invite
        fields = [
            'id', 'invite_type', 'club', 'club_name', 'event', 'event_title',
            'inviter', 'inviter_details', 'invitee', 'invitee_details',
            'status', 'message', 'expires_at', 'created_at', 'responded_at',
            'is_expired'
        ]
        read_only_fields = ['id', 'status',
                            'responded_at', 'created_at', 'expires_at']

    def get_inviter_details(self, obj):
        return {
            'id': obj.inviter.id,
            'username': obj.inviter.username,
            'profile_picture': obj.inviter.profile_picture.url if obj.inviter.profile_picture else None,
        }

    def get_invitee_details(self, obj):
        return {
            'id': obj.invitee.id,
            'username': obj.invitee.username,
            'profile_picture': obj.invitee.profile_picture.url if obj.invitee.profile_picture else None,
        }

    def validate(self, data):
        """Validate invite data"""
        request = self.context.get('request')
        invite_type = data.get('invite_type')
        club = data.get('club')
        event = data.get('event')
        invitee = data.get('invitee')

        # Validate that event is provided for event invites
        if invite_type == 'event' and not event:
            raise rest_serializers.ValidationError(
                "Event must be specified for event invitations"
            )

        # Check if inviter has permission
        if request and request.user:
            membership = models.Membership.objects.filter(
                user=request.user,
                club=club
            ).prefetch_related('roles').first()

            if not membership:
                raise rest_serializers.ValidationError(
                    "You must be a member of this club to send invitations"
                )

            if invite_type == 'club':
                if not membership.has_permission('can_manage_members'):
                    raise rest_serializers.ValidationError(
                        "You don't have permission to invite members to this club"
                    )
            elif invite_type == 'event':
                if not membership.has_permission('can_manage_events'):
                    raise rest_serializers.ValidationError(
                        "You don't have permission to send event invitations"
                    )

        # Check if user is already a member (for club invites)
        if invite_type == 'club':
            if models.Membership.objects.filter(user=invitee, club=club).exists():
                raise rest_serializers.ValidationError(
                    f"{invitee.username} is already a member of {club.name}"
                )

        # Check if user is already attending (for event invites)
        if invite_type == 'event' and event:
            if event.participants.filter(id=invitee.id).exists():
                raise rest_serializers.ValidationError(
                    f"{invitee.username} is already attending this event"
                )

        # Check for duplicate pending invites
        existing_invite = models.Invite.objects.filter(
            club=club,
            invitee=invitee,
            status='pending'
        )
        if invite_type == 'event' and event:
            existing_invite = existing_invite.filter(event=event)

        if existing_invite.exists():
            raise rest_serializers.ValidationError(
                "A pending invitation already exists for this user"
            )

        return data


class ClubListSerializer(rest_serializers.ModelSerializer):
    id = rest_serializers.CharField(read_only=True)
    # Use annotated counts from view
    member_count = rest_serializers.IntegerField(read_only=True)
    post_count = rest_serializers.IntegerField(read_only=True)
    event_count = rest_serializers.IntegerField(read_only=True)
    user_role = rest_serializers.SerializerMethodField()
    is_member = rest_serializers.SerializerMethodField()
    url = rest_serializers.SerializerMethodField()
    members_url = rest_serializers.SerializerMethodField()
    posts_url = rest_serializers.SerializerMethodField()
    events_url = rest_serializers.SerializerMethodField()

    class Meta:
        model = models.Club
        fields = [
            'id', 'name', 'origin', 'slug', 'avatar', 'banner', 'privacy',
            'is_public', 'member_count', 'post_count', 'event_count',
            'user_role', 'is_member', 'url', 'members_url', 'posts_url', 'events_url'
        ]

    def get_url(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(reverse('clubs:club_info', kwargs={'pk': obj.pk}))

    def get_members_url(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(reverse('clubs:list_members', kwargs={'pk': obj.pk}))

    def get_posts_url(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(reverse('clubs:list_posts', kwargs={'pk': obj.pk}))

    def get_events_url(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(reverse('clubs:list_events', kwargs={'pk': obj.pk}))

    def get_user_role(self, obj):
        user_memberships = getattr(obj, 'user_memberships', [])
        if user_memberships:
            membership = user_memberships[0]
            # Use primary_role or first role from the ManyToMany relation
            role = membership.primary_role or membership.roles.first()
            if role:
                return {
                    'id': str(role.id),
                    'name': role.name,
                    'permissions': role.get_all_permissions()
                }
        return None

    def get_is_member(self, obj):
        return bool(getattr(obj, 'user_memberships', []))


class ClubDetailSerializer(rest_serializers.ModelSerializer):
    id = rest_serializers.CharField(read_only=True)
    owner_details = rest_serializers.SerializerMethodField()
    member_count = rest_serializers.SerializerMethodField()
    post_count = rest_serializers.SerializerMethodField()
    event_count = rest_serializers.SerializerMethodField()
    user_role = rest_serializers.SerializerMethodField()
    is_member = rest_serializers.SerializerMethodField()
    is_owner = rest_serializers.SerializerMethodField()
    avatar = rest_serializers.SerializerMethodField()
    banner = rest_serializers.SerializerMethodField()

    url = rest_serializers.SerializerMethodField()
    members_url = rest_serializers.SerializerMethodField()
    posts_url = rest_serializers.SerializerMethodField()
    events_url = rest_serializers.SerializerMethodField()
    leave_url = rest_serializers.SerializerMethodField()
    join_url = rest_serializers.SerializerMethodField()

    class Meta:
        model = models.Club
        fields = [
            'id', 'name', 'origin', 'slug', 'about', 'avatar', 'banner', 'privacy',
            'is_public', 'allow_public_posts', 'rules', 'owner', 'owner_details',
            'member_count', 'post_count', 'event_count',
            'user_role', 'is_member', 'is_owner',
            'url', 'members_url', 'posts_url', 'events_url', 'leave_url', 'join_url',
            'created_at', 'updated_at'
        ]

    def get_owner_details(self, obj):
        request = self.context.get('request')
        if obj.owner.profile_picture:
            profile_picture_url = request.build_absolute_uri(
                obj.owner.profile_picture.url)
        else:
            profile_picture_url = None
        return {
            'id': obj.owner.id,
            'username': obj.owner.username,
            'profile_picture': profile_picture_url
        }

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if not (request and request.user.is_authenticated):
            return False
        return obj.owner == request.user

    def get_avatar(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.avatar)

    def get_banner(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.banner if obj.banner else None)

    def get_url(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(reverse('clubs:club_info', kwargs={'pk': obj.pk}))

    def get_members_url(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(reverse('clubs:list_members', kwargs={'pk': obj.pk}))

    def get_posts_url(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(reverse('clubs:list_posts', kwargs={'pk': obj.pk}))

    def get_events_url(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(reverse('clubs:list_events', kwargs={'pk': obj.pk}))

    def get_leave_url(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(reverse('clubs:leave_club', kwargs={'pk': obj.pk}))

    def get_join_url(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(reverse('clubs:join_club', kwargs={'pk': obj.pk}))

    def get_member_count(self, obj):
        return getattr(obj, 'member_count', obj.members.count())

    def get_post_count(self, obj):
        return getattr(obj, 'post_count', obj.club_posts.count())

    def get_event_count(self, obj):
        return getattr(obj, 'event_count', obj.events.count())

    def get_user_role(self, obj):
        request = self.context.get('request')
        if not (request and request.user.is_authenticated):
            return None

        if hasattr(obj, 'user_memberships'):
            memberships = obj.user_memberships
        else:
            memberships = models.Membership.objects.filter(
                user=request.user, club=obj
            ).prefetch_related('roles')

        membership = memberships[0] if memberships else None
        if membership and membership.roles.exists():
            role = membership.roles.first()
            return {
                'id': str(role.id),
                'name': role.name,
                'permissions': role.get_all_permissions()
            }
        return None

    def get_is_member(self, obj):
        request = self.context.get('request')
        if not (request and request.user.is_authenticated):
            return False
        if hasattr(obj, 'user_memberships'):
            return bool(obj.user_memberships)
        return models.Membership.objects.filter(user=request.user, club=obj).exists()


class ClubSerializer(rest_serializers.ModelSerializer):
    """For create/update — requires name, origin, and optional fields"""
    id = rest_serializers.CharField(read_only=True)
    origin = rest_serializers.CharField(
        required=True,
        help_text="Origin/location of the club (e.g., 'dhaka', 'bracu', 'online')"
    )
    allow_public_posts = rest_serializers.BooleanField(
        default=False,
        help_text="Allow anyone to see posts from this club even if they are not members."
    )
    rules = rest_serializers.CharField(
        required=True,
        help_text="Rules for the club (e.g., 'No hate speech', 'No spam', 'No harassment')"
    )

    class Meta:
        model = models.Club
        fields = ['id', 'name', 'origin', 'about',
                  'avatar', 'banner', 'privacy', 'is_public', 'allow_public_posts', 'rules']
        read_only_fields = ['id']

    def get_validators(self):
        """
        Remove the default UniqueTogetherValidator that DRF adds automatically
        for the UniqueConstraint in the model. We'll handle this validation ourselves.
        """
        validators = super().get_validators()
        validators = [
            v for v in validators
            if not (
                hasattr(v, 'fields') and
                set(getattr(v, 'fields', [])) == {'name', 'origin'}
            )
        ]
        return validators

    def validate_origin(self, value):
        """Normalize origin to lowercase and slugify"""
        if not value or not value.strip():
            raise rest_serializers.ValidationError("Origin cannot be empty.")
        return slugify(value).lower()

    def validate(self, data):
        """Check for duplicate club name + origin combination"""
        name = data.get('name')
        origin = data.get('origin')

        instance = self.instance

        if name and origin:
            queryset = models.Club.objects.filter(name=name, origin=origin)
            if instance:
                queryset = queryset.exclude(pk=instance.pk)

            if queryset.exists():
                raise rest_serializers.ValidationError({
                    'origin': f'A club named "{name}" already exists in this origin". Please choose a different name or origin. (eg: AIUB, Online, Local)'
                })
        return data

    def update(self, instance, validated_data):
        """Handle Slug update on name/origin change"""
        if 'name' in validated_data:
            instance.slug = slugify(
                validated_data['name'].strip() + instance.origin)
        return super().update(instance, validated_data)


class ClubAvatarUploadSerializer(rest_serializers.Serializer):
    avatar = rest_serializers.FileField(
        required=True,
        allow_empty_file=False,
        max_length=None,
        help_text="Upload avatar image or video for the club"
    )

    def validate_avatar(self, value):
        max_size = MAX_SIZE

        if value.size > max_size:
            raise rest_serializers.ValidationError(
                f"File size too large. Maximum size is {max_size//1024//1024}MB"
            )

        valid_mime_types = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/webm', 'video/quicktime'
        ]
        mime_type, _ = mimetypes.guess_type(value.name)

        # Fallback using python-magic if available, or just extension check
        # For now relying on extension check via mimetypes
        if mime_type not in valid_mime_types:
            # Basic extension check as fallback
            ext = value.name.split('.')[-1].lower()
            allowed_exts = ['jpg', 'jpeg', 'png',
                            'gif', 'webp', 'mp4', 'webm', 'mov']
            if ext not in allowed_exts:
                raise rest_serializers.ValidationError(
                    f"Unsupported file type. Supported types: {', '.join(valid_mime_types)}"
                )

        # Image-specific validation
        if mime_type and mime_type.startswith('image/'):
            from PIL import Image
            import io

            # Since it's a FileField, we might need to handle it carefully
            # verifying it is indeed an image if the mime says so
            try:
                # We don't strictly enforce 100x100 for verified videos, but for images we do
                # Note: Reading chunks might be safer for large files but PIL needs file-like
                pass
                # image = Image.open(value)
                # width, height = image.size
                # if width < 100 or height < 100:
                #     raise rest_serializers.ValidationError("Image dimensions too small. Minimum 100x100 pixels")
            except Exception:
                pass

        return value


class ClubBannerUploadSerializer(rest_serializers.Serializer):
    banner = rest_serializers.FileField(
        required=True,
        allow_empty_file=False,
        max_length=None,
        help_text="Upload banner image or video for the club"
    )

    def validate_banner(self, value):
        max_size = MAX_SIZE * 2  # Allow larger size for banners/videos

        if value.size > max_size:
            raise rest_serializers.ValidationError(
                f"File size too large. Maximum size is {max_size//1024//1024}MB"
            )

        valid_mime_types = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/webm', 'video/quicktime'
        ]
        mime_type, _ = mimetypes.guess_type(value.name)

        if mime_type not in valid_mime_types:
            ext = value.name.split('.')[-1].lower()
            allowed_exts = ['jpg', 'jpeg', 'png',
                            'gif', 'webp', 'mp4', 'webm', 'mov']
            if ext not in allowed_exts:
                raise rest_serializers.ValidationError(
                    f"Unsupported file type. Supported types: {', '.join(valid_mime_types)}"
                )

        return value


class EventSerializer(rest_serializers.ModelSerializer):
    id = rest_serializers.CharField(read_only=True)
    creator_username = rest_serializers.CharField(
        source='creator.username', read_only=True)
    creator_id = rest_serializers.IntegerField(
        source='creator.id', read_only=True)
    creator_profile_picture = rest_serializers.SerializerMethodField()
    club_id = rest_serializers.CharField(read_only=True)
    club_name = rest_serializers.CharField(source='club.name', read_only=True)
    club_origin = rest_serializers.CharField(
        source='club.origin', read_only=True)
    participant_count = rest_serializers.IntegerField(read_only=True)
    is_full = rest_serializers.BooleanField(read_only=True)
    is_participant = rest_serializers.SerializerMethodField()
    can_edit = rest_serializers.SerializerMethodField()

    class Meta:
        model = models.Event
        fields = [
            'id', 'club_id', 'club_name', 'club_origin',
            'creator_id', 'creator_username', 'creator_profile_picture',
            'title', 'description', 'location', 'start_time', 'end_time',
            'status', 'max_participants', 'participant_count', 'is_full',
            'is_participant', 'can_edit', 'image', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'creator', 'participant_count',
                            'is_full', 'created_at', 'updated_at']

    def get_creator_profile_picture(self, obj):
        request = self.context.get('request')
        if obj.creator.profile_picture:
            return request.build_absolute_uri(obj.creator.profile_picture.url)
        return None

    def get_is_participant(self, obj):
        request = self.context.get('request')
        if not (request and request.user.is_authenticated):
            return False
        if hasattr(obj, 'user_is_participant'):
            return obj.user_is_participant
        return obj.participants.filter(id=request.user.id).exists()

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not (request and request.user.is_authenticated):
            return False
        if obj.creator == request.user:
            return True
        membership = models.Membership.objects.filter(
            user=request.user, club=obj.club
        ).prefetch_related('roles').first()
        if membership:
            # Check any role for the permission
            for role in membership.roles.all():
                if role.has_permission('can_manage_events'):
                    return True
        return False


# ============= NEW SERIALIZERS =============

class RoleCreateUpdateSerializer(rest_serializers.ModelSerializer):
    """Serializer for creating/updating roles"""
    class Meta:
        model = models.Role
        fields = [
            'name', 'permissions', 'color', 'is_default'
        ]

    def validate_name(self, value):
        """Ensure role name is unique within club"""
        club = self.context.get('club')
        if club and value:

            if not value or value.strip() == '':
                raise rest_serializers.ValidationError(
                    "Role name cannot be empty")
            if len(value.strip()) < 2:
                raise rest_serializers.ValidationError(
                    "Role name must be at least 2 characters long")
            if len(value.strip()) > 50:
                raise rest_serializers.ValidationError(
                    "Role name cannot exceed 50 characters")

            # Check case-insensitive uniqueness
            existing = models.Role.objects.filter(
                club=club,
                name__iexact=value
            ).exclude(id=getattr(self.instance, 'id', None))

            if existing.exists():
                raise rest_serializers.ValidationError(
                    f'A role with name "{value}" already exists in this club.'
                )
        return value


class ClubMemberUpdateSerializer(rest_serializers.Serializer):
    """Serializer for updating club members"""
    role_id = rest_serializers.IntegerField(required=False)
    role_name = rest_serializers.CharField(required=False)

    def validate(self, data):
        role_id = data.get('role_id')
        role_name = data.get('role_name')

        if not role_id and not role_name:
            raise rest_serializers.ValidationError(
                "Either role_id or role_name must be provided"
            )

        if role_id and role_name:
            raise rest_serializers.ValidationError(
                "Provide either role_id or role_name, not both"
            )

        return data
