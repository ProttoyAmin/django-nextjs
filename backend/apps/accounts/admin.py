from django.contrib import admin
from . import models

# Register your models here.
# admin.site.register(models.User)

@admin.register(models.User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'id', 'institute', 'type', 'created_at', 'updated_at', 'is_active')
    list_filter = ('institute', 'type', 'created_at', 'is_active')
    search_fields = ('username', 'institute', 'email', 'type')
    date_hierarchy = 'created_at'