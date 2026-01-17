# WebSocket User Activity Tracking - Implementation Plan

## Overview

Implement a scalable WebSocket-based system to track user activity and automatically change status from "Online" to "Away" when users become inactive. Only users with "Online" status will be tracked.

---

## Architecture Overview

### Technology Stack

- **Backend**: Django Channels (WebSocket support)
- **Channel Layer**: Redis (for scalability and distributed systems)
- **Frontend**: Native WebSocket API
- **Activity Detection**: Browser events (mouse, keyboard, visibility API)

---

## Backend Implementation

### 1. Dependencies & Setup

#### Install Required Packages

```bash
pip install channels channels-redis
```

#### Update `requirements.txt`

- Add `channels>=4.0.0`
- Add `channels-redis>=4.0.0`
- Add `redis>=4.5.0`

---

### 2. Django Configuration Changes

#### [MODIFY] settings.py

**Changes:**

- Add `'channels'` to `INSTALLED_APPS`
- Configure `ASGI_APPLICATION`
- Set up Redis as channel layer
- Configure WebSocket settings (timeouts, connection limits)

```python
INSTALLED_APPS = [
    # ... existing apps
    'channels',
]

ASGI_APPLICATION = 'core.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
            "capacity": 1500,
            "expiry": 10,
        },
    },
}

# Activity tracking settings
ACTIVITY_TIMEOUT = 300  # 5 minutes of inactivity = Away
HEARTBEAT_INTERVAL = 60  # Send heartbeat every 60 seconds
```

---

### 3. ASGI Configuration

#### [MODIFY] asgi.py

**Purpose**: Configure WebSocket routing alongside HTTP

**Note**: In production, use HTTPS and WSS (WebSocket Secure). The reverse proxy (Nginx/Cloudflare) handles SSL termination.

```python
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from apps.accounts.routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
```

---

### 4. WebSocket Consumer

#### [NEW] apps/accounts/consumers.py

**Purpose**: Handle WebSocket connections, activity tracking, and status updates

**Features:**

- JWT token authentication
- Track user connection/disconnection
- Receive activity heartbeats
- Store last activity timestamp in Redis
- Broadcast status changes to relevant users (followers, club members)

**Key Methods:**

- `connect()`: Authenticate user, join personal channel
- `disconnect()`: Clean up, potentially mark as away
- `receive()`: Handle heartbeat and activity signals
- `update_last_activity()`: Update Redis timestamp
- `check_and_update_status()`: Check if user should be marked away

---

### 5. WebSocket Routing

#### [NEW] apps/accounts/routing.py

**Purpose**: Define WebSocket URL patterns

```python
from django.urls import path
from .consumers import UserActivityConsumer

websocket_urlpatterns = [
    path('ws/activity/', UserActivityConsumer.as_asgi()),
]
```

---

### 6. Activity Tracking Service

#### [NEW] apps/accounts/services/activity_tracker.py

**Purpose**: Core business logic for activity tracking

**Features:**

- Redis key management (`user_activity:{user_id}`)
- Check if user should be marked as away
- Update user status in database
- Broadcast status changes via channels

**Key Functions:**

- `update_user_activity(user_id)`: Update last active timestamp
- `get_last_activity(user_id)`: Get timestamp from Redis
- `mark_user_away(user_id)`: Change status to away
- `broadcast_status_change(user_id, new_status)`: Notify connected clients

---

### 7. Periodic Task for Inactive Users

#### [NEW] apps/accounts/management/commands/check_inactive_users.py

**Purpose**: Background task to check for inactive users

**Approach**: Use Django management command + cron/Celery

**Logic:**

1. Query all users with status="online"
2. Check Redis for last activity timestamp
3. If inactive > ACTIVITY_TIMEOUT, mark as away
4. Broadcast status change

**Scheduling Options:**

- **Option A**: Cron job (run every 1-2 minutes)
- **Option B**: Celery periodic task (preferred for production)

---

### 8. User Model Updates

#### [MODIFY] apps/accounts/models.py

**Changes:**

- Ensure `status` field exists with choices
- Add method to check if user should be tracked

```python
class User(AbstractUser):
    STATUS_CHOICES = [
        ('online', 'Online'),
        ('away', 'Away'),
        ('dnd', 'Do Not Disturb'),
    ]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='online')

    def should_track_activity(self):
        """Only track users who are online"""
        return self.status == 'online'
```

---

## Frontend Implementation

### 9. WebSocket Service

#### [NEW] frontend/src/services/websocket/activityTracker.ts

**Purpose**: Manage WebSocket connection and activity detection

**Features:**

- Connect to WebSocket server with JWT token
- Detect user activity (mouse, keyboard, scroll, touch)
- Send heartbeat signals at regular intervals
- Debounce activity events to reduce traffic
- Auto-reconnect on disconnection
- Handle incoming status updates

**Key Functions:**

- `connect(token)`: Establish WebSocket connection
- `disconnect()`: Close connection gracefully
- `sendHeartbeat()`: Send activity signal
- `setupActivityListeners()`: Attach DOM event listeners
- `handleStatusUpdate(data)`: Update Redux store on status change

---

### 10. Activity Detection Hook

#### [NEW] frontend/src/hooks/useActivityTracker.ts

**Purpose**: React hook to initialize activity tracking

**Features:**

- Connect WebSocket on mount (if user is online)
- Disconnect on unmount
- Only activate for authenticated users
- Monitor user status from Redux store

```typescript
useEffect(() => {
  if (user && user.status === "online") {
    activityTracker.connect(accessToken);
  }
  return () => activityTracker.disconnect();
}, [user, accessToken]);
```

---

### 11. Layout Integration

#### [MODIFY] frontend/src/app/layout.tsx or ConditionalLayout

**Changes:**

- Import and use `useActivityTracker` hook
- Initialize once at top-level layout
- Ensure it runs only on client side

---

### 12. Redux Store Updates

#### [MODIFY] frontend/src/redux-store/slices/user.ts

**Changes:**

- Add action to update status from WebSocket
- Handle status updates without API call (already synced)

```typescript
updateStatusFromWebSocket: (state, action) => {
  if (state.user) {
    state.user.status = action.payload.status;
  }
};
```

---

## Scalability Considerations

### 1. **Redis Channel Layer**

- Allows horizontal scaling of Django app servers
- Multiple servers can share WebSocket connections
- Messages broadcast across all servers

### 2. **Connection Management**

- Use Redis to track active connections
- Set TTL on activity keys to auto-cleanup
- Limit connections per user (prevent abuse)

### 3. **Message Optimization**

- Debounce activity events (max 1 per 10 seconds)
- Use binary WebSocket frames for efficiency
- Compress large payloads

### 4. **Load Distribution**

- Use WebSocket load balancer (HAProxy, Nginx)
- Sticky sessions for WebSocket connections
- Separate WebSocket servers from API servers (optional)

### 5. **Database Optimization**

- Use Redis for real-time tracking (avoid DB writes)
- Batch status updates to database
- Index on `status` field for queries

---

## Security Considerations

1. **Authentication**: JWT token validation on WebSocket connect
2. **Rate Limiting**: Limit heartbeat frequency per user
3. **Authorization**: Users can only update their own status
4. **Input Validation**: Validate all WebSocket messages
5. **Connection Limits**: Max connections per user (e.g., 5 devices)
6. **Production Security**: Use WSS (WebSocket Secure) over TLS/SSL in production

---

## Environment Variables

### Backend (.env.local)

```bash
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
ACTIVITY_TIMEOUT=300
HEARTBEAT_INTERVAL=60
```

### Frontend (.env.local)

```bash
# Development
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/activity/

# Production (use wss:// for secure WebSocket)
# NEXT_PUBLIC_WS_URL=wss://yourdomain.com/ws/activity/
```

---

## File Structure

```
backend/
├── apps/accounts/
│   ├── consumers.py          [NEW]
│   ├── routing.py            [NEW]
│   ├── services/
│   │   └── activity_tracker.py  [NEW]
│   └── management/commands/
│       └── check_inactive_users.py  [NEW]
└── core/
    ├── settings.py           [MODIFY]
    └── asgi.py              [MODIFY]

frontend/
├── src/
│   ├── services/websocket/
│   │   └── activityTracker.ts   [NEW]
│   ├── hooks/
│   │   └── useActivityTracker.ts  [NEW]
│   └── redux-store/slices/
│       └── user.ts           [MODIFY]
```

---

## Success Criteria

- ✅ WebSocket connection established with JWT auth
- ✅ Activity detected and sent to backend
- ✅ User status automatically changes to "Away" after 5 minutes of inactivity
- ✅ Only "Online" users are tracked
- ✅ Status changes broadcast to relevant users in real-time
- ✅ System handles 1000+ concurrent WebSocket connections
- ✅ Reconnection works after network interruption
- ✅ No performance degradation on frontend

---

## Implementation Phases

### Phase 1: Backend Setup ✓

1. Install dependencies
2. Configure Django Channels + Redis
3. Create Consumer and routing
4. Test WebSocket connection

### Phase 2: Activity Tracking

1. Implement activity tracker service
2. Create periodic task for inactive users
3. Test status transitions

### Phase 3: Frontend Integration

1. Create WebSocket service
2. Implement activity detection
3. Connect to Redux store
4. Test end-to-end flow

### Phase 4: Optimization

1. Add connection pooling
2. Implement reconnection logic
3. Performance testing
4. Deploy to production with WSS
