# apps/interactions/urls.py
from django.urls import path
from . import views

app_name = 'interactions'

urlpatterns = [
    # Likes
    path('likes/', views.list_likes, name='list_likes'),  # GET: list likes on an object
    path('likes/toggle/', views.toggle_like, name='toggle_like'),  # POST: like/unlike
    path('likes/check/', views.check_like_status, name='check_like_status'),  # GET: check if liked
    
    # # Comments
    path('comments/', views.list_comments, name='list_comments'),  # GET: list comments
    path('comments/create/', views.create_comment, name='create_comment'),  # POST: create comment
    path('comments/<int:comment_id>/', views.manage_comment, name='manage_comment'),  # GET/PATCH/DELETE
    path('comments/<int:comment_id>/replies/', views.get_comment_replies, name='comment_replies'),  # GET: get replies
    
    # # Shares
    # path('shares/', views.list_shares, name='list_shares'),  # GET: list shares
    # path('shares/create/', views.create_share, name='create_share'),  # POST: create share
    # path('shares/delete/', views.delete_share, name='delete_share'),  # DELETE: delete share
    
    # # User Activity
    # path('my-likes/', views.my_likes, name='my_likes'),  # GET: user's likes
    # path('my-comments/', views.my_comments, name='my_comments'),  # GET: user's comments
    # path('my-shares/', views.my_shares, name='my_shares'),  # GET: user's shares
]