from django.contrib import admin
from . import models


class RoleInline(admin.TabularInline):
    model = models.Role
    extra = 0
    fields = ('name', 'permissions', 'is_default', 'color')


class MembershipInline(admin.TabularInline):
    model = models.Membership
    extra = 0
    raw_id_fields = ('user',)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "role":
            # Get the club from the parent object
            if request.resolver_match.kwargs.get('object_id'):
                club_id = request.resolver_match.kwargs.get('object_id')
                kwargs["queryset"] = models.Role.objects.filter(
                    club_id=club_id)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(models.Club)
class ClubAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'origin',
                    'is_public', 'is_active', 'created_at')
    list_filter = ('privacy', 'origin', 'is_public', 'is_active')
    search_fields = ('name', 'origin', 'owner__username')
    inlines = [RoleInline, MembershipInline]
    raw_id_fields = ('owner',)


# clubs/admin.py


class RoleInline(admin.TabularInline):
    model = models.Role
    extra = 0
    fields = ('name', 'can_manage_members', 'can_manage_posts',
              'can_manage_events', 'can_manage_settings', 'is_default', 'color')


class MembershipRoleInline(admin.TabularInline):
    """Inline for roles within membership"""
    model = models.Membership.roles.through  # Through table for ManyToMany
    extra = 1
    verbose_name = "Role"
    verbose_name_plural = "Roles"


@admin.register(models.Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'club', 'get_role_names',
                    'primary_role_name', 'joined_at')
    list_filter = ('club', 'roles', 'joined_at')
    search_fields = ('user__username', 'club__name', 'roles__name')
    raw_id_fields = ('user', 'club', 'primary_role')
    filter_horizontal = ('roles',)  # Add this for easy role selection

    fieldsets = (
        ('Membership Info', {
            'fields': ('user', 'club', 'primary_role')
        }),
        ('Roles', {
            'fields': ('roles',),
            'description': 'Select multiple roles for this member'
        }),
        ('Timestamps', {
            'fields': ('joined_at',),
            'classes': ('collapse',)
        })
    )

    readonly_fields = ('joined_at',)

    def get_role_names(self, obj):
        """Display all role names"""
        return ", ".join(obj.role_names)
    get_role_names.short_description = 'Roles'

    def primary_role_name(self, obj):
        """Display primary role name"""
        return obj.primary_role.name if obj.primary_role else "None"
    primary_role_name.short_description = 'Primary Role'

    def formfield_for_manytomany(self, db_field, request, **kwargs):
        """Filter roles to only show roles from the selected club"""
        if db_field.name == "roles":
            # Try to get club from the form data or the existing object
            club_id = None

            if request.method == 'POST':
                club_id = request.POST.get('club')
            elif hasattr(request, '_obj_') and request._obj_ is not None:
                club_id = request._obj_.club_id
            elif request.resolver_match.kwargs.get('object_id'):
                try:
                    membership = models.Membership.objects.get(
                        pk=request.resolver_match.kwargs.get('object_id'))
                    club_id = membership.club_id
                except models.Membership.DoesNotExist:
                    club_id = None

            if club_id:
                kwargs["queryset"] = models.Role.objects.filter(
                    club_id=club_id)
            else:
                kwargs["queryset"] = models.Role.objects.none()
                kwargs["help_text"] = "Please select a club first, then save and edit to assign roles."
        return super().formfield_for_manytomany(db_field, request, **kwargs)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Filter primary role to only show roles from the selected club"""
        if db_field.name == "primary_role":
            # Try to get club from the form data or the existing object
            club_id = None

            if request.method == 'POST':
                club_id = request.POST.get('club')
            elif hasattr(request, '_obj_') and request._obj_ is not None:
                club_id = request._obj_.club_id
            elif request.resolver_match.kwargs.get('object_id'):
                try:
                    membership = models.Membership.objects.get(
                        pk=request.resolver_match.kwargs.get('object_id'))
                    club_id = membership.club_id
                except models.Membership.DoesNotExist:
                    club_id = None

            if club_id:
                kwargs["queryset"] = models.Role.objects.filter(
                    club_id=club_id)
            else:
                kwargs["queryset"] = models.Role.objects.none()
                kwargs["help_text"] = "Please select a club first, then save and edit to assign primary role."
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def get_form(self, request, obj=None, **kwargs):
        # Store the object in request so we can access it in formfield_for_*
        request._obj_ = obj
        form = super().get_form(request, obj, **kwargs)
        return form


@admin.register(models.Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'club', 'user_count', 'is_default')
    list_filter = ('club', 'is_default')
    search_fields = ('name', 'club__name')
    raw_id_fields = ('club',)

    fieldsets = (
        (None, {
            'fields': ('club', 'name', 'color', 'is_default')
        }),
        ('Permissions', {
            'fields': (
                'permissions',
            )
        }),
    )

    readonly_fields = ('created_at', 'updated_at')

    def user_count(self, obj):
        """Display count of users with this role"""
        return obj.user_count()
    user_count.short_description = 'Users'

    def get_queryset(self, request):
        # Optimize queries
        return super().get_queryset(request).select_related('club')


@admin.register(models.ClubPost)
class ClubPostAdmin(admin.ModelAdmin):
    list_display = ('id', 'club', 'get_author', 'get_title', 'created_at')
    list_filter = ('club', 'created_at')
    search_fields = ('club__name', 'post__author__username', 'post__title')
    raw_id_fields = ('post', 'club')

    def get_author(self, obj):
        return obj.author.username if obj.author and hasattr(obj.author, 'username') else 'No author'
    get_author.short_description = 'Author'

    def get_title(self, obj):
        return obj.title[:50] + '...' if obj.title and len(obj.title) > 50 else obj.title or 'No title'
    get_title.short_description = 'Title'

    def get_queryset(self, request):
        # Optimize queries
        return super().get_queryset(request).select_related('post', 'club', 'post__author')


@admin.register(models.Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'creator', 'club', 'start_time',
                    'end_time', 'max_participants', 'participant_count')
    list_filter = ('club', 'created_at', 'status')
    search_fields = ('title', 'club__name', 'creator__username', 'location')
    raw_id_fields = ('club', 'creator', 'participants')
    filter_horizontal = ('participants',)

    fieldsets = (
        (None, {
            'fields': ('title', 'description', 'club', 'creator')
        }),
        ('Time & Location', {
            'fields': ('start_time', 'end_time', 'location')
        }),
        ('Settings', {
            'fields': ('status', 'max_participants', 'image')
        }),
        ('Participants', {
            'fields': ('participants',),
            'classes': ('collapse',)
        })
    )

    def participant_count(self, obj):
        return obj.participant_count
    participant_count.short_description = 'Participants'


@admin.register(models.Invite)
class InviteAdmin(admin.ModelAdmin):
    list_display = ('id', 'invite_type', 'inviter', 'invitee',
                    'club', 'event', 'status', 'created_at', 'expires_at')
    list_filter = ('invite_type', 'status', 'created_at', 'club')
    search_fields = ('inviter__username', 'invitee__username',
                     'club__name', 'event__title')
    raw_id_fields = ('inviter', 'invitee', 'club', 'event')
    readonly_fields = ('created_at', 'responded_at', 'is_expired')

    fieldsets = (
        ('Invitation Info', {
            'fields': ('invite_type', 'status', 'message')
        }),
        ('Parties', {
            'fields': ('inviter', 'invitee')
        }),
        ('Target', {
            'fields': ('club', 'event')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'expires_at', 'responded_at', 'is_expired'),
            'classes': ('collapse',)
        })
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('inviter', 'invitee', 'club', 'event')
