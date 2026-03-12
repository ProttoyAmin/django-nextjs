from django.contrib import admin
from . import models

# Register your models here.
# admin.site.register(models.Institute)
# admin.site.register(models.InstituteEmailDomain)
# admin.site.register(models.Department)
class InstituteTabluarInline(admin.TabularInline):
    model = models.InstituteEmailDomain
    extra = 1
    fields = (
        'domain',
        'domain_type',
        'is_active',
    )

@admin.register(models.Institute)
class InstituteAdmin(admin.ModelAdmin):
    list_display = ('code', 'country', 'created_at', 'updated_at', 'is_active',)
    list_filter = ('country', 'is_active', 'created_at')
    inlines = [InstituteTabluarInline, ]
    date_hierarchy = 'created_at'
    

    
    
@admin.register(models.Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('code', 'institute', 'created_at', 'updated_at', 'is_active',)
    list_filter = ('institute', 'is_active', 'created_at')
    
    
@admin.register(models.InstituteEmailDomain)
class InstituteEmailDomainAdmin(admin.ModelAdmin):
    list_display = ('domain', 'institute', 'domain_type', 'is_active',)
    list_filter = ('institute', 'domain_type', 'is_active',)