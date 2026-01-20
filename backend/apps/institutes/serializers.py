from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from djoser.serializers import TokenCreateSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.contenttypes.models import ContentType
from . import models
from apps.clubs.models import Club, Membership, Role

from apps.interactions.models import Like, Comment, Share
from djoser.serializers import UserCreateSerializer
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from apps.institutes.models import Institute


class InstituteSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    email_domains = serializers.SerializerMethodField()
    clubs = serializers.SerializerMethodField()

    class Meta:
        model = Institute
        fields = [
            "id",
            "name",
            "code",
            "country",
            "address",
            "website",
            "portal",
            "courses",
            "email_domains",
            "clubs",
            "is_active",
            "is_verified",
            "logo",
            "description",
            "established_year",
            "accreditation",
            "contact_number",
            "social_links",
            "created_at",
            "updated_at",
        ]
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # Get requested fields from context
        requested_fields = self.context.get('fields')
        
        if requested_fields:
            # Filter the representation to include only requested fields
            filtered_representation = {}
            for field in requested_fields:
                if field in representation:
                    filtered_representation[field] = representation[field]
            return filtered_representation
        
        return representation

    def get_email_domains(self, obj):
        """Get all active email domains associated with the institute"""
        domains = obj.get_active_email_domains()
        return [{
                domain.domain_type: domain.domain
                for domain in domains}]
        
    def get_clubs(self, obj):
        """Get all clubs associated with the institute"""
        clubs = Club.objects.filter(origin=obj, is_active=True)
        return [{
                "id" : str(club.id),
                "name": club.name,
                "owner": {
                    "id": str(club.owner.id),
                    "username": str(club.owner.username),
                    "avatar": club.owner.profile_picture.url if club.owner.profile_picture else None,
                    "full_name": club.owner.get_full_name(),
                    "email": club.owner.email,
                },
                }   for club in clubs]
