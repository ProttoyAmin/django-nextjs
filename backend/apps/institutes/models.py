from django.db import models
from core.generate import generate_snowflake_id

# Create your models here.


class Institute(models.Model):
    """Model representing an institute. (universitites, colleges, orgs, companies etc)"""
    id = models.BigIntegerField(
        primary_key=True, unique=True, editable=False, default=generate_snowflake_id)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True, blank=True, null=True)
    country = models.CharField(max_length=100)
    address = models.TextField()
    website = models.URLField(blank=True, null=True)
    portal = models.URLField(blank=True, null=True)
    courses = models.JSONField(
        default=dict, help_text="Dictionary of courses offered by the institute", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    logo = models.URLField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    established_year = models.PositiveIntegerField(blank=True, null=True)
    accreditation = models.CharField(max_length=255, blank=True, null=True)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    social_links = models.JSONField(
        default=dict, help_text="Dictionary of social media links", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = "Institute"
        verbose_name_plural = "Institutes"
        db_table = "institute"
        ordering = ["-created_at"]
        
        
    # @property
        
    def __str__(self):
        return self.name
    
    def get_active_email_domains(self):
        """Get all active email domains associated with the institute"""
        return self.email_domains.filter(is_active=True)
    
    




class InstituteEmailDomain(models.Model):
    STUDENT = "student"
    FACULTY = "faculty"
    ALUMNI = "alumni"
    STAFF = "staff"

    DOMAIN_TYPE_CHOICES = [
        (STUDENT, "Student"),
        (FACULTY, "Faculty"),
        (ALUMNI, "Alumni"),
        (STAFF, "Staff"),
    ]

    institute = models.ForeignKey(
        "Institute",
        on_delete=models.CASCADE,
        related_name="email_domains"
    )
    domain = models.CharField(max_length=255)
    domain_type = models.CharField(
        max_length=20,
        choices=DOMAIN_TYPE_CHOICES
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("institute", "domain")
        
        
    def __str__(self):
        return f"Email Domain for {self.institute.name}: {self.domain} ({self.domain_type})"


class Department(models.Model):
    """Model representing a department within an institute (e.g., Computer Science, Mathematics) --- Optional"""
    id = models.BigIntegerField(
        primary_key=True, unique=True, editable=False, default=generate_snowflake_id
    )
    institute = models.ForeignKey('Institute', on_delete=models.CASCADE, null=True, related_name='departments')
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    
    def __str__(self):
        return f"{self.institute.name} - {self.name} ({self.code})"
    