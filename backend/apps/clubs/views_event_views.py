from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions, response, status
from rest_framework.views import APIView
from django.db.models import Count, Prefetch
from django.shortcuts import get_object_or_404

from . import models, serializers, permissions as club_permissions
from core import pagination


# # ==================== EVENT VIEWS ====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_events(request, pk):
    """
    List all events in a club
    Query params:
    - status: upcoming|ongoing|completed|cancelled
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)

    # Check if user is a member (for non-public clubs)
    is_member = models.Membership.objects.filter(
        user=request.user, club=club).exists()
    is_owner = club.owner == request.user

    if club.privacy != 'public' and not (is_member or is_owner):
        return response.Response(
            {'detail': 'You must be a club member to view events in private clubs.'},
            status=status.HTTP_403_FORBIDDEN
        )

    events = models.Event.objects.filter(
        club=club).select_related('creator', 'club')

    # Filter by status
    event_status = request.query_params.get('status')
    if event_status in ['upcoming', 'ongoing', 'completed', 'cancelled']:
        events = events.filter(status=event_status)

    # Check if user is participant for each event
    if is_member or is_owner:
        events = events.prefetch_related(
            Prefetch(
                'participants',
                queryset=request.user._meta.model.objects.filter(
                    id=request.user.id),
                to_attr='user_is_participant_list'
            )
        )

        # Add user_is_participant attribute
        for event in events:
            event.user_is_participant = bool(event.user_is_participant_list)

    # Pagination
    paginator = pagination.StandardResultsSetPagination()
    paginated_events = paginator.paginate_queryset(events, request)

    serializer = serializers.EventSerializer(
        paginated_events,
        many=True,
        context={'request': request}
    )

    return paginator.get_paginated_response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_event(request, pk):
    """
    Create a new event in a club
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)

    # Check if user is a member
    membership = models.Membership.objects.filter(
        user=request.user,
        club=club
    ).prefetch_related('roles').first()

    is_owner = club.owner == request.user

    if not is_owner and not membership:
        return response.Response(
            {'detail': 'You must be a club member to create events.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Check if user has permission to create events
    can_create_events = False
    if is_owner:
        can_create_events = True
    elif membership and membership.role:
        can_create_events = membership.role.has_permission('can_manage_events')

    if not can_create_events:
        return response.Response(
            {'detail': 'You do not have permission to create events in this club.'},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = serializers.EventSerializer(
        data=request.data,
        context={'request': request}
    )

    if serializer.is_valid():
        event = serializer.save(creator=request.user, club=club)

        # Auto-join creator to event
        event.participants.add(request.user)

        # Fetch event with all relationships for response
        event = models.Event.objects.select_related(
            'creator', 'club').get(pk=event.pk)
        event.user_is_participant = True

        serializer = serializers.EventSerializer(
            event,
            context={'request': request}
        )
        return response.Response(serializer.data, status=status.HTTP_201_CREATED)

    return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def event_detail(request, pk, event_id):
    """
    Get, update, or delete a specific event
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)
    event = get_object_or_404(models.Event, pk=event_id, club=club)

    # Check if user can view event (for non-public clubs)
    is_member = models.Membership.objects.filter(
        user=request.user, club=club).exists()
    is_owner = club.owner == request.user

    if club.privacy != 'public' and not (is_member or is_owner):
        return response.Response(
            {'detail': 'You must be a club member to view events in private clubs.'},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.method == 'GET':
        # Check if user is participant
        if is_member or is_owner:
            event.user_is_participant = event.participants.filter(
                id=request.user.id).exists()

        serializer = serializers.EventSerializer(
            event,
            context={'request': request}
        )
        return response.Response(serializer.data)

    # Check permissions for edit/delete
    membership = models.Membership.objects.filter(
        user=request.user,
        club=club
    ).prefetch_related('roles').first()

    is_creator = event.creator == request.user
    is_club_owner = club.owner == request.user

    # Check if user can manage events
    can_manage_events = False
    if is_club_owner:
        can_manage_events = True
    elif membership and membership.role:
        can_manage_events = membership.role.has_permission('can_manage_events')

    if not (is_creator or can_manage_events):
        return response.Response(
            {'detail': 'You do not have permission to modify this event.'},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.method == 'PATCH':
        serializer = serializers.EventSerializer(
            event,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            updated_event = serializer.save()

            # Check if user is participant for response
            if is_member or is_owner:
                updated_event.user_is_participant = updated_event.participants.filter(
                    id=request.user.id).exists()

            serializer = serializers.EventSerializer(
                updated_event,
                context={'request': request}
            )
            return response.Response(serializer.data)
        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        event.delete()
        return response.Response(
            {'detail': 'Event deleted successfully.'},
            status=status.HTTP_200_OK
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def join_event(request, pk, event_id):
    """
    Join an event as a participant
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)
    event = get_object_or_404(models.Event, pk=event_id, club=club)

    # Check if user is a club member
    membership = models.Membership.objects.filter(
        user=request.user, club=club).first()
    is_owner = club.owner == request.user

    if not (membership or is_owner):
        return response.Response(
            {'detail': 'You must be a club member to join events.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Check if event is full
    if event.is_full:
        return response.Response(
            {'detail': 'This event is already full.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if already joined
    if event.participants.filter(id=request.user.id).exists():
        return response.Response(
            {'detail': 'You have already joined this event.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if event is joinable (only upcoming or ongoing)
    if event.status not in ['upcoming', 'ongoing']:
        return response.Response(
            {'detail': 'You can only join upcoming or ongoing events.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    event.participants.add(request.user)

    return response.Response(
        {
            'detail': 'Successfully joined the event.',
            'event_id': event.id,
            'event_title': event.title,
            'participant_count': event.participant_count,
            'is_full': event.is_full
        },
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def leave_event(request, pk, event_id):
    """
    Leave an event
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)
    event = get_object_or_404(models.Event, pk=event_id, club=club)

    # Check if user is a participant
    if not event.participants.filter(id=request.user.id).exists():
        return response.Response(
            {'detail': 'You are not a participant of this event.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Prevent event creator from leaving if they're the only participant
    if event.creator == request.user and event.participant_count == 1:
        return response.Response(
            {'detail': 'As the event creator and only participant, you cannot leave. Delete the event instead.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    event.participants.remove(request.user)

    return response.Response(
        {
            'detail': 'Successfully left the event.',
            'event_id': event.id,
            'event_title': event.title,
            'participant_count': event.participant_count
        },
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def event_participants(request, pk, event_id):
    """
    Get all participants of an event
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)
    event = get_object_or_404(models.Event, pk=event_id, club=club)

    # Check if user is a club member
    membership = models.Membership.objects.filter(
        user=request.user, club=club).first()
    is_owner = club.owner == request.user

    if not (membership or is_owner):
        return response.Response(
            {'detail': 'You must be a club member to view event participants.'},
            status=status.HTTP_403_FORBIDDEN
        )

    participants = event.participants.select_related('profile').all()

    participants_data = []
    for user in participants:
        participants_data.append({
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'profile_picture': user.profile_picture.url if user.profile_picture else None
        })

    return response.Response({
        'event_id': event.id,
        'event_title': event.title,
        'participant_count': participants.count(),
        'max_participants': event.max_participants,
        'is_full': event.is_full,
        'status': event.status,
        'participants': participants_data
    })


# ============= NEW EVENT VIEWS =============

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_events(request, pk):
    """
    Get events for the authenticated user in a specific club
    Query params:
    - type: created|joined|upcoming|past
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)

    # Check if user is a member
    membership = models.Membership.objects.filter(
        user=request.user, club=club).first()
    is_owner = club.owner == request.user

    if not (membership or is_owner):
        return response.Response(
            {'detail': 'You must be a club member to view your events.'},
            status=status.HTTP_403_FORBIDDEN
        )

    event_type = request.query_params.get('type', 'upcoming')

    if event_type == 'created':
        events = models.Event.objects.filter(
            club=club,
            creator=request.user
        )
    elif event_type == 'joined':
        events = models.Event.objects.filter(
            club=club,
            participants=request.user
        )
    elif event_type == 'upcoming':
        events = models.Event.objects.filter(
            club=club,
            participants=request.user,
            status__in=['upcoming', 'ongoing']
        )
    elif event_type == 'past':
        events = models.Event.objects.filter(
            club=club,
            participants=request.user,
            status__in=['completed', 'cancelled']
        )
    else:
        events = models.Event.objects.filter(
            club=club,
            participants=request.user
        )

    events = events.select_related('creator', 'club').order_by('-start_time')

    # Mark user as participant for all events
    for event in events:
        event.user_is_participant = True

    paginator = pagination.StandardResultsSetPagination()
    paginated_events = paginator.paginate_queryset(events, request)

    serializer = serializers.EventSerializer(
        paginated_events,
        many=True,
        context={'request': request}
    )

    return paginator.get_paginated_response({
        'club_id': club.id,
        'club_name': club.name,
        'event_type': event_type,
        'events': serializer.data
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_event_status(request, pk, event_id):
    """
    Update event status (admin/moderator only)
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)
    event = get_object_or_404(models.Event, pk=event_id, club=club)

    # Check permissions
    membership = models.Membership.objects.filter(
        user=request.user,
        club=club
    ).prefetch_related('roles').first()

    is_owner = club.owner == request.user
    is_creator = event.creator == request.user

    # Check if user can manage events
    can_manage_events = False
    if is_owner:
        can_manage_events = True
    elif membership and membership.role:
        can_manage_events = membership.role.has_permission('can_manage_events')

    if not (is_creator or can_manage_events):
        return response.Response(
            {'detail': 'You do not have permission to update event status.'},
            status=status.HTTP_403_FORBIDDEN
        )

    new_status = request.data.get('status')

    if not new_status or new_status not in ['upcoming', 'ongoing', 'completed', 'cancelled']:
        return response.Response(
            {'detail': 'Valid status is required: upcoming, ongoing, completed, or cancelled.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    event.status = new_status
    event.save()

    return response.Response({
        'detail': f'Event status updated to {new_status}.',
        'event_id': event.id,
        'event_title': event.title,
        'new_status': event.status
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def public_club_events(request, pk):
    """
    Get public events for a club (no authentication required for public clubs)
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)

    # Only show events for public clubs
    if club.privacy != 'public':
        return response.Response(
            {'detail': 'Event list is only available for public clubs.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Only show upcoming events for public access
    events = models.Event.objects.filter(
        club=club,
        status__in=['upcoming', 'ongoing']
    ).select_related('creator', 'club').order_by('start_time')

    paginator = pagination.StandardResultsSetPagination()
    paginated_events = paginator.paginate_queryset(events, request)

    serializer = serializers.EventSerializer(
        paginated_events,
        many=True,
        context={'request': request}
    )

    return paginator.get_paginated_response({
        'club_id': club.id,
        'club_name': club.name,
        'club_privacy': club.privacy,
        'total_upcoming_events': events.count(),
        'events': serializer.data
    })


# ============= EVENT INVITATION VIEWS =============

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def invite_to_event(request, pk, event_id):
    """
    Send event invitation to a user
    Required: invitee_id
    Optional: message
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)
    event = get_object_or_404(models.Event, pk=event_id, club=club)

    # Check if user has permission to send event invites
    membership = models.Membership.objects.filter(
        user=request.user,
        club=club
    ).prefetch_related('roles').first()

    is_creator = event.creator == request.user
    is_owner = club.owner == request.user

    can_manage_events = False
    if is_owner or is_creator:
        can_manage_events = True
    elif membership:
        can_manage_events = membership.has_permission('can_manage_events')

    if not can_manage_events:
        return response.Response(
            {'detail': 'You don\'t have permission to send event invitations'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Prepare data for serializer
    data = {
        'invite_type': 'event',
        'club': club.id,
        'event': event.id,
        'inviter': request.user.id,
        'invitee': request.data.get('invitee_id'),
        'message': request.data.get('message', '')
    }

    serializer = serializers.InviteSerializer(
        data=data,
        context={'request': request}
    )

    if serializer.is_valid():
        invite = serializer.save()
        return response.Response(
            serializers.InviteSerializer(
                invite, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_event_invites(request, pk, event_id):
    """
    List all invitations for a specific event
    Query params:
    - status: pending|accepted|declined|expired
    """
    club = get_object_or_404(models.Club, pk=pk, is_active=True)
    event = get_object_or_404(models.Event, pk=event_id, club=club)

    # Check permissions
    membership = models.Membership.objects.filter(
        user=request.user,
        club=club
    ).prefetch_related('roles').first()

    is_creator = event.creator == request.user
    is_owner = club.owner == request.user

    can_view = False
    if is_owner or is_creator:
        can_view = True
    elif membership:
        can_view = membership.has_permission('can_manage_events')

    if not can_view:
        return response.Response(
            {'detail': 'You don\'t have permission to view event invitations'},
            status=status.HTTP_403_FORBIDDEN
        )

    invites = models.Invite.objects.filter(
        invite_type='event',
        event=event,
        club=club
    ).select_related('inviter', 'invitee').order_by('-created_at')

    # Filter by status
    invite_status = request.query_params.get('status')
    if invite_status in ['pending', 'accepted', 'declined', 'expired']:
        invites = invites.filter(status=invite_status)

    paginator = pagination.StandardResultsSetPagination()
    paginated_invites = paginator.paginate_queryset(invites, request)

    serializer = serializers.InviteSerializer(
        paginated_invites,
        many=True,
        context={'request': request}
    )

    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_event_invites(request):
    """
    Get all pending event invitations for the authenticated user
    """
    invites = models.Invite.objects.filter(
        invite_type='event',
        invitee=request.user,
        status='pending'
    ).select_related('inviter', 'club', 'event').order_by('-created_at')

    paginator = pagination.StandardResultsSetPagination()
    paginated_invites = paginator.paginate_queryset(invites, request)

    serializer = serializers.InviteSerializer(
        paginated_invites,
        many=True,
        context={'request': request}
    )

    return paginator.get_paginated_response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def accept_event_invite(request, invite_id):
    """
    Accept an event invitation
    """
    invite = get_object_or_404(
        models.Invite,
        pk=invite_id,
        invite_type='event',
        invitee=request.user
    )

    success, message = invite.accept()

    if success:
        return response.Response(
            {
                'detail': message,
                'invite_id': invite.id,
                'event_id': invite.event.id,
                'event_title': invite.event.title
            },
            status=status.HTTP_200_OK
        )

    return response.Response(
        {'detail': message},
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def decline_event_invite(request, invite_id):
    """
    Decline an event invitation
    """
    invite = get_object_or_404(
        models.Invite,
        pk=invite_id,
        invite_type='event',
        invitee=request.user
    )

    success, message = invite.decline()

    if success:
        return response.Response(
            {'detail': message, 'invite_id': invite.id},
            status=status.HTTP_200_OK
        )

    return response.Response(
        {'detail': message},
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_event_invite(request, invite_id):
    """
    Cancel an event invitation (inviter only)
    """
    invite = get_object_or_404(
        models.Invite,
        pk=invite_id,
        invite_type='event',
        inviter=request.user
    )

    success, message = invite.cancel()

    if success:
        return response.Response(
            {'detail': message, 'invite_id': invite.id},
            status=status.HTTP_200_OK
        )

    return response.Response(
        {'detail': message},
        status=status.HTTP_400_BAD_REQUEST
    )
