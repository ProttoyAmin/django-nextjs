# apps/posts/urls.py
from django.urls import path
from . import views

app_name = 'posts'

urlpatterns = [
    # Post CRUD
    path('', views.list_posts, name='list_posts'),  # GET all posts
    path('create/', views.create_post, name='create_post'),  # POST create text post
    path('create-with-media/', views.create_post_with_media, name='create_post_with_media'),  # POST create post with media
    path('create-mixed-media/', views.create_mixed_media_post, name='create_mixed_media_post'),  # POST create post with multiple media
    path('feed/', views.get_feed, name='feed'),  # GET personalized feed
    path('trending/', views.trending_posts, name='trending_posts'),  # GET trending
    path('<int:post_id>/', views.post_detail, name='post_detail'),  # GET/PATCH/DELETE
    path('<int:post_id>/repost/', views.repost, name='repost'),  # POST repost
    
    # Post Likes
    path('<int:post_id>/likes/', views.post_likes, name='post_likes'),  # GET likes
    path('<int:post_id>/like/', views.toggle_post_like, name='toggle_post_like'),  # POST toggle
    
    # Post Comments
    path('<int:post_id>/comments/', views.post_comments, name='post_comments'),  # GET comments
    path('<int:post_id>/comments/create/', views.create_post_comment, name='create_post_comment'),  # POST create
    path('<int:post_id>/comments/<int:comment_id>/', views.manage_post_comment, name='manage_post_comment'),  # PATCH/DELETE
    path('<int:post_id>/comments/<int:comment_id>/like/', views.toggle_comment_like, name='toggle_comment_like'),  # POST toggle
    path('<int:post_id>/comments/<int:comment_id>/replies/', views.get_comment_replies, name='comment_replies'),  # GET replies
    
    # Post Shares
    path('<int:post_id>/shares/', views.post_shares, name='post_shares'),  # GET shares
    path('<int:post_id>/share/', views.toggle_post_share, name='toggle_post_share'),  # POST toggle
    
    # File Upload
    path('upload-media/', views.upload_post_media, name='upload_post_media'),  # POST upload media
]