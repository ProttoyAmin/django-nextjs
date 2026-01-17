# apps/connections/urls.py
from django.urls import path
from . import views

app_name = 'connections'

urlpatterns = [
    # Follow/Unfollow
    path('<int:user_id>/toggle/', views.toggle_follow, name='toggle_follow'),
    path('<int:user_id>/status/', views.follow_status, name='follow_status'),
    
    # Followers & Following Lists
    path('<int:user_id>/followers/', views.list_followers, name='list_followers'),
    path('<int:user_id>/following/', views.list_following, name='list_following'),
    path('<int:user_id>/remove/', views.remove_follower, name='remove_follower'),
    
    # Follow Requests (Private Accounts)
    path('requests/', views.pending_follow_requests, name='pending_requests'),
    path('requests/<int:user_id>/accept/', views.accept_follow_request, name='accept_request'),
    path('requests/<int:user_id>/reject/', views.reject_follow_request, name='reject_request'),
    
    # Blocking
    path('<int:user_id>/block/', views.block_user, name='block_user'),
    path('<int:user_id>/unblock/', views.unblock_user, name='unblock_user'),
    path('blocked/', views.list_blocked_users, name='list_blocked'),
    
    # Social Features
    path('suggestions/', views.suggested_users, name='suggestions'),
    path('<int:user_id>/mutual/', views.mutual_followers, name='mutual_followers'),
    path('<int:user_id>/relationship/', views.relationship_view, name='relationship_view'),
    path('relations/', views.user_relationships, name='relations'),
    path('relations/connected/', views.connected_followers_view, name='connected_followers'),
    path('relations/pending/', views.pending_request_view, name='pending_requests'),
    path('relations/sent/', views.sent_requests_view, name='sent_requests'),
]