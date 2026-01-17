# apps/posts/tasks.py
from celery import shared_task
from .models import Post

@shared_task
def delete_post_task(post_id):
    try:
        post = Post.objects.get(id=post_id, soft_deleted=True)
        post.delete()  # Hard delete from DB
        return f"Post {post_id} deleted"
    except Post.DoesNotExist:
        return f"Post {post_id} not found"
