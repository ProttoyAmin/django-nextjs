# apps/notifications/urls.py
from django.urls import path
from . import views

app_name = 'notifications'

urlpatterns = [
    # Main notification endpoints
    # GET all notifications
    path('', views.list_notifications, name='list_notifications'),
    path('counts/', views.notification_counts,
         name='notification_counts'),  # GET counts
    path('<int:notification_id>/', views.notification_detail,
         name='notification_detail'),  # GET detail
    path('<int:notification_id>/delete/', views.delete_notification,
         name='delete_notification'),  # DELETE

    # Mark as read/seen
    path('<int:notification_id>/read/',
         views.mark_as_read, name='mark_as_read'),  # POST
    path('<int:notification_id>/seen/',
         views.mark_as_seen, name='mark_as_seen'),  # POST
    path('mark-all-read/', views.mark_all_as_read,
         name='mark_all_as_read'),  # POST
    path('mark-all-seen/', views.mark_all_as_seen,
         name='mark_all_as_seen'),  # POST

    # Clear all notifications
    path('clear/', views.clear_all_notifications, name='clear_all'),  # DELETE

    # Delivery tracking
    path('<int:notification_id>/deliveries/',
         views.notification_deliveries, name='notification_deliveries'),  # GET

    # Filter shortcuts by type
    path('posts/', views.post_notifications, name='post_notifications'),  # GET
    path('likes/', views.like_notifications, name='like_notifications'),  # GET
    path('comments/', views.comment_notifications,
         name='comment_notifications'),  # GET
    path('follow-requests/', views.follow_request_notifications,
         name='follow_request_notifications'),  # GET
    path('follow-accepts/', views.follow_accept_notifications,
         name='follow_accept_notifications'),  # GET
]
