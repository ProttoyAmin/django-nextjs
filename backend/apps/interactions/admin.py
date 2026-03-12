from django.contrib import admin
from . import models

# Register your models here.
# admin.site.register(models.Like)
admin.site.register(models.Comment)
admin.site.register(models.Share)

@admin.register(models.Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'object_id', 'content_type', 'created_at')
    search_fields = ('user__username', 'content_type__model')
    list_filter = ('created_at',)