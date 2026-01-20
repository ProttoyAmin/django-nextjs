from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.institutes import models, serializers
from core import pagination

# Create your views here.
@api_view(['GET'])
@permission_classes([AllowAny])
def institute_list(request):
    requested_fields = request.query_params.get('fields')
    field_list = None
    
    if requested_fields:
        field_list = [field.strip() for field in requested_fields.split(',')]
        # Always include id for relationships
        if 'id' not in field_list:
            field_list.append('id')
    
    institutes = models.Institute.objects.filter(is_active=True)
    
    # Apply filters
    by_country = request.query_params.get('country')
    is_verified = request.query_params.get('is_verified')
    
    if by_country:
        institutes = institutes.filter(country__iexact=by_country)
        
    if is_verified is not None:
        if is_verified.lower() == 'true':
            institutes = institutes.filter(is_verified=True)
        elif is_verified.lower() == 'false':
            institutes = institutes.filter(is_verified=False)
    
    # Use only() to fetch specific fields from DB
    if field_list:
        institutes = institutes.only(*field_list)
    
    paginator = pagination.StandardResultsSetPagination()
    paginated_institutes = paginator.paginate_queryset(institutes, request)
    
    # Pass fields to serializer via context
    context = {'request': request}
    if field_list:
        context['fields'] = field_list
    
    serializer = serializers.InstituteSerializer(
        paginated_institutes, 
        many=True, 
        context=context
    )
    
    return paginator.get_paginated_response(serializer.data)