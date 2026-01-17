# Feed Algorithm Update - Documentation

## Overview
Updated the `get_feed` function in `backend/apps/posts/views.py` to implement a personalized feed algorithm that respects user privacy settings and follow relationships.

## Feed Algorithm Rules

### ✅ What Users See in Their Feed

1. **Posts from Followed Users**
   - Shows public posts (`is_public=True`) from users the current user follows
   - Only includes follows with `status='accepted'` (not pending or blocked)
   - Respects the post's privacy setting

2. **Posts from Public Profiles**
   - Shows public posts from users with `is_private=False`
   - These are users who have chosen to make their profile public
   - Only shows posts where `is_public=True`

3. **Exclusions**
   - ❌ Posts from blocked users (in both directions)
   - ❌ Posts from users who blocked the current user
   - ❌ Current user's own posts (optional - can be changed)
   - ❌ Deleted posts (`is_deleted=True`)
   - ❌ Private posts (`is_public=False`)

## Privacy Matrix

| Author Type | Post Privacy | Relationship | Shown in Feed? |
|-------------|--------------|--------------|----------------|
| Public Profile (`is_private=False`) | Public (`is_public=True`) | Any | ✅ Yes |
| Public Profile | Private (`is_public=False`) | Any | ❌ No |
| Private Profile (`is_private=True`) | Public | Following (accepted) | ✅ Yes |
| Private Profile | Public | Not following | ❌ No |
| Private Profile | Private | Following (accepted) | ❌ No |
| Blocked User | Any | Blocked | ❌ No |
| User who blocked me | Any | Blocked me | ❌ No |

## Implementation Details

### Database Queries

```python
# 1. Get followed users (accepted only)
following_users = Follow.objects.filter(
    follower=current_user,
    status='accepted'
).values_list('following_id', flat=True)

# 2. Get blocked users (both directions)
blocked_by_me = Block.objects.filter(blocker=current_user).values_list('blocked_id', flat=True)
blocked_me = Block.objects.filter(blocked=current_user).values_list('blocker_id', flat=True)
blocked_users = set(list(blocked_by_me) + list(blocked_me))

# 3. Build the feed query
posts = Post.objects.filter(
    Q(author_id__in=following_users, is_public=True) |  # Followed users
    Q(author__is_private=False, is_public=True),         # Public profiles
    is_deleted=False
).exclude(
    author_id__in=blocked_users
).exclude(
    author=current_user  # Optional
).distinct()
```

### Query Optimization

- ✅ Uses `select_related('author')` to reduce database queries
- ✅ Uses `prefetch_related('media_files')` for efficient media loading
- ✅ Uses `values_list('id', flat=True)` for efficient ID lookups
- ✅ Uses `distinct()` to avoid duplicate posts
- ✅ Indexed fields used in queries (see models.py)

## Models Used

### Follow Model (`apps/connections/models.py`)
```python
class Follow(models.Model):
    follower = ForeignKey(User, related_name='following_set')
    following = ForeignKey(User, related_name='follower_set')
    status = CharField(choices=['pending', 'accepted', 'blocked'])
```

### Block Model (`apps/connections/models.py`)
```python
class Block(models.Model):
    blocker = ForeignKey(User, related_name='blocking_set')
    blocked = ForeignKey(User, related_name='blocked_by_set')
```

### User Model (`apps/accounts/models.py`)
```python
class User(AbstractUser):
    is_private = BooleanField(default=False)  # Private profile setting
```

### Post Model (`apps/posts/models.py`)
```python
class Post(models.Model):
    author = ForeignKey(User, related_name='posts')
    is_public = BooleanField(default=True)  # Post privacy setting
    is_deleted = BooleanField(default=False)  # Soft delete
```

## API Endpoint

### GET `/api/v1/posts/feed/`

**Authentication**: Required

**Query Parameters**:
- `post_type` (optional): Filter by type (`TEXT`, `IMAGE`, `VIDEO`, `MIXED`)
- `search` (optional): Search in post content
- `page` (optional): Page number for pagination

**Response**:
```json
{
  "count": 100,
  "next": "http://api.example.com/posts/feed/?page=2",
  "previous": null,
  "results": [
    {
      "id": "123456789",
      "author_id": "987654321",
      "author_username": "john_doe",
      "author_avatar": "https://...",
      "post_type": "IMAGE",
      "content": "Beautiful sunset!",
      "media_files": [...],
      "like_count": 42,
      "comment_count": 5,
      "is_liked": false,
      "created_at": "2025-11-27T02:00:00Z"
    }
  ]
}
```

## Use Cases

### Example 1: New User
- **Scenario**: User just joined, not following anyone
- **Feed**: Shows all public posts from public profiles
- **Result**: Discover content from the community

### Example 2: Active User
- **Scenario**: User follows 50 people, 10 have private profiles
- **Feed**: 
  - Public posts from 40 public profiles they follow
  - Public posts from 10 private profiles they follow
  - Public posts from all other public profiles
- **Result**: Personalized feed with followed content prioritized

### Example 3: Private Account User
- **Scenario**: User has `is_private=True`
- **Feed**: Same as active user (privacy setting doesn't affect what they see)
- **Their Posts**: Only visible to their accepted followers

### Example 4: Blocked User
- **Scenario**: User blocked someone or was blocked
- **Feed**: Never shows posts from blocked users
- **Result**: Clean feed without unwanted content

## Testing Scenarios

### Test 1: Follow Relationship
```python
# Setup
user_a.follow(user_b)  # status='accepted'
user_b.create_post(content="Hello", is_public=True)

# Expected
user_a.get_feed()  # Should include user_b's post
```

### Test 2: Private Profile
```python
# Setup
user_c.is_private = True
user_c.create_post(content="Private user post", is_public=True)

# Expected
user_a.get_feed()  # Should NOT include user_c's post (not following)
user_a.follow(user_c)  # status='accepted'
user_a.get_feed()  # Should NOW include user_c's post
```

### Test 3: Block Relationship
```python
# Setup
user_a.block(user_d)
user_d.create_post(content="Blocked user post", is_public=True)

# Expected
user_a.get_feed()  # Should NOT include user_d's post
```

### Test 4: Private Post
```python
# Setup
user_b.create_post(content="Secret", is_public=False)

# Expected
user_a.get_feed()  # Should NOT include this post (even if following)
```

## Performance Considerations

### Database Indexes
Ensure these indexes exist (already defined in models):
- `Post`: `(author, -created_at)`, `(is_public, -created_at)`
- `Follow`: `(follower, status)`, `(following, status)`
- `Block`: `(blocker, blocked)`

### Query Count
For a typical feed request:
- 1 query: Get following users
- 2 queries: Get blocked users (both directions)
- 1 query: Get posts (with select_related/prefetch_related)
- **Total**: ~4 queries per feed request

### Caching Opportunities (Future)
```python
# Cache following list (updates when user follows/unfollows)
cache_key = f"user:{user_id}:following"
following_users = cache.get(cache_key)

# Cache blocked users (updates when user blocks/unblocks)
cache_key = f"user:{user_id}:blocked"
blocked_users = cache.get(cache_key)
```

## Future Enhancements

### 1. Feed Ranking Algorithm
```python
# Sort by engagement score instead of chronological
posts = posts.annotate(
    engagement_score=Count('likes') + Count('comments') * 2
).order_by('-engagement_score', '-created_at')
```

### 2. Personalized Recommendations
```python
# Show posts from users with similar interests
recommended_users = get_recommended_users(current_user)
posts = posts.filter(
    Q(author_id__in=following_users) |
    Q(author_id__in=recommended_users) |
    Q(author__is_private=False)
)
```

### 3. Content Filtering
```python
# Filter out sensitive content based on user preferences
if not user.show_sensitive_content:
    posts = posts.exclude(is_sensitive=True)
```

### 4. Muted Users
```python
# Add mute functionality (hide posts without unfollowing)
muted_users = Mute.objects.filter(
    muter=current_user
).values_list('muted_id', flat=True)

posts = posts.exclude(author_id__in=muted_users)
```

## Migration Guide

### Before (Old Feed)
```python
# Showed all public posts
posts = Post.objects.filter(is_public=True, is_deleted=False)
```

### After (New Feed)
```python
# Personalized feed with privacy controls
posts = Post.objects.filter(
    Q(author_id__in=following_users, is_public=True) |
    Q(author__is_private=False, is_public=True),
    is_deleted=False
).exclude(author_id__in=blocked_users)
```

### Breaking Changes
- ❌ None - API endpoint remains the same
- ✅ Backward compatible
- ✅ No database migrations needed

## Troubleshooting

### Issue: Feed is empty
**Possible causes**:
1. User not following anyone and all users have private profiles
2. All followed users have private posts
3. Database issue with Follow/Block models

**Solution**: Check Follow relationships and user privacy settings

### Issue: Seeing blocked user's posts
**Possible causes**:
1. Block relationship not properly saved
2. Cache not cleared

**Solution**: Verify Block model entries and clear cache

### Issue: Not seeing followed user's posts
**Possible causes**:
1. Follow status is 'pending' not 'accepted'
2. Posts are private (`is_public=False`)
3. Posts are soft-deleted

**Solution**: Check Follow status and post privacy settings

---

**Last Updated**: 2025-11-27
**Version**: 2.0
**Author**: Backend Team
