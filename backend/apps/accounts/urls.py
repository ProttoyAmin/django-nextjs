from django.urls import path, re_path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'accounts'

router = DefaultRouter()
router.register(r'auth/main', views.UserViewSet, basename='user')

urlpatterns = [
    # Djoser auth endpoints
    re_path(r'^auth/', include('djoser.urls')),
    re_path(r'^auth/', include('djoser.urls.authtoken')),
    re_path(r'^auth/', include('djoser.urls.jwt')),
    
    # Authentication
    path("auth/jwt/logout/", views.LogoutView.as_view(), name="jwt_logout"),
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/obtain/", views.CustomTokenObtainPairView.as_view(), name="obtain_token"),
    path("auth/validate/", views.ValidateTypeView.as_view(), name="authenticate_type"),
    
    # User lookup
    path("auth/users/user/<str:username>/", views.get_user_byUsername, name="user_details"),
    path('auth/all/', views.get_users, name="all_users"),
    path('auth/<int:user_id>/all/', views.CompleteUserInfoView.as_view(), name="all_users_by_id"),
    
    # Current user endpoints
    path('auth/me/', views.get_current_user, name='current_user'),
    path('auth/me/profile/', views.update_profile, name='update_profile'),
    path("auth/me/upload-profile-picture/", views.upload_profile_picture, name="upload_profile_picture"),
    path('auth/me/clear-profile-picture/', views.clear_profile_picture, name='clear_profile_picture'),
    path('auth/me/email-preference/', views.manage_email_preference, name='email_preference'),
    
    # User profiles
    path('auth/<int:user_id>/', views.get_user_profile, name='user_profile'),
    path('auth/<int:user_id>/clubs/', views.get_user_clubs, name='user_clubs'),
    path('auth/<int:user_id>/posts/', views.get_user_posts, name='user_posts'),
    path('auth/<int:user_id>/activity/', views.get_user_activity, name='user_activity'),
    
    # User roles and permissions
    path('auth/<int:user_id>/roles/', views.get_all_user_roles, name='user_all_roles'),
    path('auth/<int:user_id>/roles/club/<int:club_id>/', views.get_user_roles_in_club, name='user_club_roles'),
    path('clubs/<int:club_id>/users/<int:user_id>/assign-role/', views.assign_role_to_user, name='assign_role'),
    path('clubs/<int:club_id>/users/<int:user_id>/remove-role/', views.remove_role_from_user, name='remove_role'),
    path('clubs/<int:club_id>/users/<int:user_id>/check-permission/<str:permission>/', 
         views.check_user_permission, name='check_permission'),
    
    # Club role management
    path('clubs/<int:club_id>/roles/<str:role_name>/users/', views.get_users_with_role, name='users_with_role'),
    
    # Search
    path('search/', views.search_users, name='search_users'),
    
    # Include router URLs
    path('', include(router.urls)),
]