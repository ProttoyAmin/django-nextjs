# apps/clubs/urls.py
from django.urls import path
from . import views, views_clubs_post_views, views_members_views, views_event_views

app_name = 'clubs'

urlpatterns = [
    # ==================== CLUB MANAGEMENT ====================
    path('', views.list_clubs, name='list_clubs'),    # ---- checked
    path('recommended/', views.recommended_clubs, name='recommended_clubs'),  # NEW
    path('test/manager/', views.SuperuserOnlyStrictTestView.as_view(),
         name='manager_only_test'),
    path('create/', views.create_club, name='create_club'),    # ---- checked
    path('<int:pk>/', views.club_info, name='club_info'),    # ---- checked
    path('<int:pk>/join/', views.join_club,
         name='join_club'),    # ---- checked
    path('<int:pk>/leave/', views.leave_club,
         name='leave_club'),    # ---- checked
    path('<int:pk>/stats/', views.club_stats, name='club_stats'),  # NEW
    path('<int:pk>/upload-media/', views.ClubMediaUploadView.as_view(), name='ClubMediaUploadView'),  # NEW

    # ==================== MEMBER MANAGEMENT ====================
    path('<int:pk>/members/', views_members_views.list_members,
         name='list_members'),    # ---- checked
    path('<int:pk>/members/search/', views_members_views.search_members,
         name='search_members'),  # NEW
    path('<int:pk>/members/<int:user_id>/', views_members_views.member_detail,
         name='member_detail'),  # NEW
    path('<int:pk>/members/<int:user_id>/role/',
         views_members_views.update_member_role, name='update_member_role'),
    path('<int:pk>/members/<int:user_id>/remove/',
         views_members_views.remove_member, name='remove_member'),
    path('<int:pk>/members/invite/', views_members_views.invite_member,
         name='invite_member'),  # NEW
    path('<int:pk>/invites/', views_members_views.list_club_invites,
         name='club_invites'),  # NEW
    path('invites/me/', views_members_views.my_club_invites,
         name='club_invites'),  # NEW
    path('invites/accept/<int:invite_id>', views_members_views.accept_club_invite,
         name='accept_club_invite'),  # NEW
#     path('<int:pk>/members/pending/', views_members_views.pending_members,
#          name='pending_members'),  # NEW
#     path('<int:pk>/members/requests/', views_members_views.membership_requests,
#          name='membership_requests'),  # NEW

    # ==================== ROLE MANAGEMENT ====================
    path('<int:pk>/roles/', views_members_views.list_roles, name='list_roles'),
#     path('<int:pk>/roles/<int:user_id>/permissions/', views_members_views.get_user_permissions, name='get_user_permissions'),
    path('<int:pk>/roles/<int:user_id>/permissions/', views_members_views.get_user_club_permissions, name='get_user_club_permissions'),
    path('<int:pk>/permissions/', views.get_club_permissions, name='club_permissions'),
    path('<int:pk>/roles/assign/<int:user_id>/', views.add_role_to_member, name='add_role_to_member'),
    path('<int:pk>/roles/set_primary_role/<int:user_id>/', views.set_primary_role, name='set_primary_role'),
    path('<int:pk>/roles/user/<int:user_id>/',
         views_members_views.get_user_roles, name='get_user_roles'),  # UPDATED
    path('<int:pk>/roles/create/',
         views_members_views.create_role, name='create_role'),
    path('<int:pk>/roles/<int:role_id>/',
         views_members_views.manage_role, name='manage_role'),
    path('<int:pk>/roles/<int:role_id>/users/',
         views_members_views.role_users, name='role_users'),  # NEW
    path('<int:pk>/roles/<str:role_name>/users/',
         views_members_views.role_users_by_name, name='role_users_by_name'),  # NEW


    # ==================== EVENT MANAGEMENT ====================
    path('<int:pk>/events/', views_event_views.list_events, name='list_events'),
    path('<int:pk>/events/public/', views_event_views.public_club_events,
         name='public_club_events'),  # NEW
    path('<int:pk>/events/my/', views_event_views.user_events,
         name='user_events'),  # NEW
    path('<int:pk>/events/create/',
         views_event_views.create_event, name='create_event'),
    path('<int:pk>/events/<int:event_id>/',
         views_event_views.event_detail, name='event_detail'),
    path('<int:pk>/events/<int:event_id>/join/',
         views_event_views.join_event, name='join_event'),
    path('<int:pk>/events/<int:event_id>/leave/',
         views_event_views.leave_event, name='leave_event'),
    path('<int:pk>/events/<int:event_id>/participants/',
         views_event_views.event_participants, name='event_participants'),
    path('<int:pk>/events/<int:event_id>/status/',
         views_event_views.update_event_status, name='update_event_status'),  # NEW
#     path('<int:pk>/events/upcoming/', views_event_views.upcoming_events,
#          name='upcoming_events'),  # NEW
#     path('<int:pk>/events/past/', views_event_views.past_events,
#          name='past_events'),  # NEW
     path('<int:pk>/posts/', views_clubs_post_views.list_posts, name='list_posts'),

    # ==================== CLUB SETTINGS ====================
#     path('<int:pk>/settings/', views.club_settings, name='club_settings'),  # NEW
#     path('<int:pk>/settings/privacy/', views.update_club_privacy,
#          name='update_club_privacy'),  # NEW
#     path('<int:pk>/settings/transfer-ownership/', views.transfer_ownership,
#          name='transfer_ownership'),  # NEW
#     path('<int:pk>/settings/delete/', views.delete_club,
#          name='delete_club'),  # NEW (soft delete)

#     # ==================== ANALYTICS & INSIGHTS ====================
#     path('<int:pk>/analytics/', views.club_analytics, name='club_analytics'),  # NEW
#     path('<int:pk>/analytics/engagement/', views.engagement_analytics,
#          name='engagement_analytics'),  # NEW
#     path('<int:pk>/analytics/members/', views.member_analytics,
#          name='member_analytics'),  # NEW

    # ==================== SEARCH & DISCOVERY ====================
    path('search/', views.search_clubs, name='search_clubs'),  # NEW
    path('trending/', views.trending_clubs, name='trending_clubs'),  # NEW
#     path('categories/', views.club_categories, name='club_categories'),  # NEW
    path('origin/<str:origin>/', views.clubs_by_origin,
         name='clubs_by_origin'),  # NEW

    # ==================== CLUB INVITES ====================
#     path('<int:pk>/invites/', views.club_invites, name='club_invites'),  # NEW
#     path('<int:pk>/invites/create/', views.create_invite,
#          name='create_invite'),  # NEW
#     path('invites/<str:invite_code>/', views.use_invite,
#          name='use_invite'),  # NEW
#     path('invites/<str:invite_code>/status/', views.invite_status,
#          name='invite_status'),  # NEW
]