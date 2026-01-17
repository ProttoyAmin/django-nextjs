# Multiple Media Support - Changes Summary

## Overview
Updated the Django backend to support multiple images and videos per post. The API now returns `images` and `videos` as arrays of objects containing both URL and file fields.

## Changes Made

### 1. **Serializers (`apps/posts/serializers.py`)** ✅

#### **PostMediaSerializer**
- No changes needed - already supports individual media items

#### **PostSerializer** - UPDATED
Added new fields:
- `images`: Array of image objects `[{image_url, image_file}, ...]`
- `videos`: Array of video objects `[{video_url, video_file}, ...]`
- `media_files`: Full PostMedia serializer array (includes all metadata)

**New Methods:**
- `get_images(obj)`: Collects all images from both legacy fields and PostMedia
- `get_videos(obj)`: Collects all videos from both legacy fields and PostMedia

**Updated Fields List:**
```python
fields = [
    'id', 'url', 'author_id', 'author_username', 'author_avatar', 'author_url',
    'post_type', 'content', 
    'image', 'video', 'image_file', 'video_file', 'image_url', 'video_url',  # Backward compatibility
    'images', 'videos', 'media_files',  # NEW: Multiple media arrays
    'original_post', 'original_post_data',
    'like_count', 'comment_count', 'share_count', 'repost_count',
    'is_liked', 'is_shared', 'can_edit',
    'likes_url', 'comments_url', 'shares_url',
    'like_toggle_url', 'share_toggle_url', 'repost_url',
    'is_public', 'created_at', 'updated_at'
]
```

#### **PostListSerializer** - UPDATED
Added the same `images` and `videos` fields for consistency in list views.

**Updated Fields List:**
```python
fields = [
    'id', 'url', 'author_username', 'author_avatar',
    'post_type', 'content', 
    'image', 'video', 'image_file', 'video_file', 'image_url', 'video_url',  # Backward compatibility
    'images', 'videos',  # NEW: Multiple media arrays
    'like_count', 'comment_count', 'is_liked',
    'is_public', 'created_at'
]
```

### 2. **Views (`apps/posts/views.py`)** ✅

**Performance Optimization:**
Added `.prefetch_related('media_files')` to all post queries to prevent N+1 database queries:

- `list_posts()` - Line 30
- `post_detail()` - Line 107
- `get_feed()` - Line 590
- `trending_posts()` - Line 627

### 3. **Models (`apps/posts/models.py`)** ✅
No changes needed - the `PostMedia` model already supports multiple images and videos.

### 4. **URLs (`apps/posts/urls.py`)** ✅
No changes needed - the `create-mixed-media/` endpoint already exists.

---

## API Response Format

### Example Response with Multiple Media:

```json
{
  "id": "123456789",
  "post_type": "MIXED",
  "content": "Check out these amazing photos and videos!",
  
  // Legacy fields (backward compatibility)
  "image": "http://example.com/media/posts/images/123_image_0.jpg",
  "video": null,
  "image_file": "http://example.com/media/posts/images/123_image_0.jpg",
  "video_file": null,
  "image_url": null,
  "video_url": null,
  
  // NEW: Multiple media arrays
  "images": [
    {
      "image_url": null,
      "image_file": "http://example.com/media/posts/images/123_image_0.jpg"
    },
    {
      "image_url": "https://external.com/image.jpg",
      "image_file": null
    },
    {
      "image_url": null,
      "image_file": "http://example.com/media/posts/images/123_image_1.jpg"
    }
  ],
  "videos": [
    {
      "video_url": null,
      "video_file": "http://example.com/media/posts/videos/123_video_0.mp4"
    },
    {
      "video_url": "https://youtube.com/watch?v=xyz",
      "video_file": null
    }
  ],
  
  // Full media metadata
  "media_files": [
    {
      "id": "987654321",
      "media_type": "IMAGE",
      "image_file": "http://example.com/media/posts/images/123_image_0.jpg",
      "video_file": null,
      "image_url": null,
      "video_url": null,
      "media_url": "http://example.com/media/posts/images/123_image_0.jpg",
      "order": 0
    },
    {
      "id": "987654322",
      "media_type": "VIDEO",
      "image_file": null,
      "video_file": "http://example.com/media/posts/videos/123_video_0.mp4",
      "image_url": null,
      "video_url": null,
      "media_url": "http://example.com/media/posts/videos/123_video_0.mp4",
      "order": 1
    }
  ],
  
  "author_id": 1,
  "author_username": "john_doe",
  "like_count": 42,
  "comment_count": 10,
  "created_at": "2025-11-25T10:30:00Z"
}
```

---

## How to Create Posts with Multiple Media

### Endpoint: `POST /api/v1/posts/create-mixed-media/`

**Request (FormData):**
```javascript
const formData = new FormData();
formData.append('content', 'Check out these photos!');
formData.append('is_public', 'true');
formData.append('media_files', imageFile1);
formData.append('media_files', imageFile2);
formData.append('media_files', videoFile1);

fetch('/api/v1/posts/create-mixed-media/', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: formData
});
```

---

## Backward Compatibility

✅ **All existing API consumers will continue to work**
- Legacy `image`, `video`, `image_file`, `video_file`, `image_url`, `video_url` fields still exist
- New clients can use the `images` and `videos` arrays
- Old clients will only see the first media item (as before)

---

## Database Schema

**No migrations needed** - The `PostMedia` model already exists with all necessary fields:

```python
class PostMedia(models.Model):
    id = BigIntegerField (Snowflake ID)
    post = ForeignKey(Post, related_name='media_files')
    media_type = CharField (IMAGE/VIDEO)
    image_file = ImageField
    video_file = FileField
    image_url = URLField
    video_url = URLField
    order = PositiveIntegerField
    created_at = DateTimeField
```

---

## Testing

### Test the API:

1. **List posts with media:**
   ```bash
   GET /api/v1/posts/
   GET /api/v1/posts/feed/
   ```

2. **Get single post:**
   ```bash
   GET /api/v1/posts/{post_id}/
   ```

3. **Create post with multiple media:**
   ```bash
   POST /api/v1/posts/create-mixed-media/
   Content-Type: multipart/form-data
   
   media_files: [file1, file2, file3]
   content: "Post caption"
   is_public: true
   ```

---

## Summary

✅ **Serializers updated** - Added `images` and `videos` array fields
✅ **Views optimized** - Added prefetch_related for better performance  
✅ **Backward compatible** - Legacy fields still work
✅ **No migrations needed** - Model already supports multiple media
✅ **API ready** - Endpoint already exists for creating multi-media posts

The backend is now fully ready to handle multiple images and videos per post!
