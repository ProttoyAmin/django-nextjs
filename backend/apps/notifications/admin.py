# apps/notifications/admin.py
from django.contrib import admin
from .models import Notification, NotificationActor, NotificationTarget, NotificationDelivery


class NotificationActorInline(admin.TabularInline):
    model = NotificationActor
    extra = 0
    raw_id_fields = ['actor']


class NotificationTargetInline(admin.TabularInline):
    model = NotificationTarget
    extra = 0


class NotificationDeliveryInline(admin.TabularInline):
    model = NotificationDelivery
    extra = 0


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'recipient', 'verb',
                    'is_read', 'is_seen', 'created_at']
    list_filter = ['verb', 'is_read', 'is_seen', 'created_at']
    search_fields = ['recipient__username', 'description']
    raw_id_fields = ['recipient']
    readonly_fields = ['id', 'created_at']
    inlines = [NotificationActorInline,
               NotificationTargetInline, NotificationDeliveryInline]
    date_hierarchy = 'created_at'
    ordering = ['-created_at']


@admin.register(NotificationActor)
class NotificationActorAdmin(admin.ModelAdmin):
    list_display = ['id', 'notification', 'actor', 'created_at']
    raw_id_fields = ['notification', 'actor']
    search_fields = ['actor__username']


@admin.register(NotificationTarget)
class NotificationTargetAdmin(admin.ModelAdmin):
    list_display = ['id', 'notification', 'content_type', 'object_id']
    raw_id_fields = ['notification']
    list_filter = ['content_type']


@admin.register(NotificationDelivery)
class NotificationDeliveryAdmin(admin.ModelAdmin):
    list_display = ['id', 'notification', 'channel',
                    'status', 'sent_at', 'created_at']
    list_filter = ['channel', 'status', 'created_at']
    raw_id_fields = ['notification']
    readonly_fields = ['id', 'created_at', 'updated_at']
