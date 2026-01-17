# apps/connections/admin.py
from django.contrib import admin
from .models import Follow, FollowRequest, Block

# Register your models here.

@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ['follower', 'following', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['follower__username', 'following__username']
    raw_id_fields = ['follower', 'following']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    actions = ['accept_pending_follows', 'reject_pending_follows']
    
    def accept_pending_follows(self, request, queryset):
        """Accept selected pending follow requests"""
        updated = queryset.filter(status='pending').update(status='accepted')
        self.message_user(request, f'{updated} follow requests accepted.')
    accept_pending_follows.short_description = 'Accept selected pending requests'
    
    def reject_pending_follows(self, request, queryset):
        """Reject selected pending follow requests"""
        deleted = queryset.filter(status='pending').delete()[0]
        self.message_user(request, f'{deleted} follow requests rejected.')
    reject_pending_follows.short_description = 'Reject selected pending requests'


@admin.register(FollowRequest)
class FollowRequestAdmin(admin.ModelAdmin):
    list_display = ['get_follower', 'get_following', 'seen', 'notified', 'created_at']
    list_filter = ['seen', 'notified', 'created_at']
    search_fields = ['follow__follower__username', 'follow__following__username']
    raw_id_fields = ['follow']
    readonly_fields = ['created_at']
    
    def get_follower(self, obj):
        return obj.follow.follower.username
    get_follower.short_description = 'Follower'
    
    def get_following(self, obj):
        return obj.follow.following.username
    get_following.short_description = 'Following'


@admin.register(Block)
class BlockAdmin(admin.ModelAdmin):
    list_display = ['blocker', 'blocked', 'created_at']
    list_filter = ['created_at']
    search_fields = ['blocker__username', 'blocked__username']
    raw_id_fields = ['blocker', 'blocked']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'