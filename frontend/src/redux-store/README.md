# Redux Store Documentation

## Overview

This Redux store is designed to be **scalable** and **performant** by following these principles:

1. **Minimal localStorage persistence**: Only `isAuthenticated` is persisted to localStorage
2. **Separation of concerns**: Auth, User, and Follow states are managed in separate slices
3. **Type-safe**: Full TypeScript support with proper typing
4. **Optimistic updates**: Support for immediate UI updates with rollback on error

## Store Structure

```
redux-store/
├── store.ts                 # Main store configuration
├── hooks/
│   └── index.ts            # Typed Redux hooks
└── slices/
    ├── auth/
    │   ├── index.ts        # Auth slice (persisted to localStorage)
    │   └── selectors.ts    # Auth selectors
    ├── user/
    │   ├── index.ts        # User slice (in-memory only)
    │   └── selectors.ts    # User selectors
    └── follow/
        ├── index.ts        # Follow slice (in-memory only)
        └── selectors.ts    # Follow selectors
```

## Slices

### 1. Auth Slice (`auth`)

**Purpose**: Manages authentication state  
**Persisted**: ✅ Yes (only `isAuthenticated`)

**State**:

```typescript
{
  isAuthenticated: boolean;
}
```

**Actions**:

- `setAuthenticated(boolean)` - Set authentication status
- `login()` - Set authenticated to true
- `logout()` - Set authenticated to false

**Usage**:

```typescript
import { useAppDispatch, useAppSelector } from "@/src/redux-store/hooks";
import { login, logout } from "@/src/redux-store/slices/auth";
import { selectIsAuthenticated } from "@/src/redux-store/slices/auth/selectors";

function MyComponent() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const handleLogin = () => {
    dispatch(login());
  };

  const handleLogout = () => {
    dispatch(logout());
  };
}
```

---

### 2. User Slice (`user`)

**Purpose**: Manages current user data  
**Persisted**: ❌ No (fetched on app load)

**State**:

```typescript
{
  currentUser: UserType | null,
  isLoading: boolean,
  error: string | null
}
```

**Actions**:

- `setUser(UserType | null)` - Set the current user
- `updateUser(Partial<UserType>)` - Update specific user fields
- `clearUser()` - Clear user data (on logout)
- `setUserLoading(boolean)` - Set loading state
- `setUserError(string | null)` - Set error state
- `updateUserCounts({ follower_count?, following_count?, ... })` - Update user counts

**Usage**:

```typescript
import { useAppDispatch, useAppSelector } from "@/src/redux-store/hooks";
import { setUser, updateUser, clearUser } from "@/src/redux-store/slices/user";
import {
  selectCurrentUser,
  selectUserCounts,
} from "@/src/redux-store/slices/user/selectors";

function MyComponent() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const userCounts = useAppSelector(selectUserCounts);

  // Set user after login
  const handleSetUser = (userData: UserType) => {
    dispatch(setUser(userData));
  };

  // Update specific fields
  const handleUpdateProfile = (updates: Partial<UserType>) => {
    dispatch(updateUser(updates));
  };

  // Clear on logout
  const handleLogout = () => {
    dispatch(clearUser());
  };
}
```

---

### 3. Follow Slice (`follow`)

**Purpose**: Manages follow relationships with other users  
**Persisted**: ❌ No (fetched as needed)

**State**:

```typescript
{
  relationships: Record<number, FollowRelationship>,
  isLoadingFollowers: boolean,
  isLoadingFollowing: boolean,
  error: string | null
}

// FollowRelationship structure
{
  userId: number,
  isFollowing: boolean,
  isFollowedBy: boolean,
  isMutual: boolean,
  followStatus: 'pending' | 'accepted' | 'blocked' | null,
  isLoading: boolean
}
```

**Actions**:

- `setFollowRelationship({ userId, data })` - Set/update a follow relationship
- `updateFollowStatus({ userId, isFollowing, followStatus })` - Update follow status (optimistic)
- `setFollowLoading({ userId, isLoading })` - Set loading for specific user
- `clearFollowRelationship(userId)` - Clear a specific relationship
- `clearAllFollowRelationships()` - Clear all relationships
- `setFollowersLoading(boolean)` - Set bulk followers loading
- `setFollowingLoading(boolean)` - Set bulk following loading
- `setFollowError(string | null)` - Set error state

**Usage**:

```typescript
import { useAppDispatch, useAppSelector } from "@/src/redux-store/hooks";
import {
  setFollowRelationship,
  updateFollowStatus,
  setFollowLoading,
} from "@/src/redux-store/slices/follow";
import {
  selectIsFollowing,
  selectFollowStatus,
  selectFollowLoadingByUserId,
} from "@/src/redux-store/slices/follow/selectors";

function FollowButton({ targetUserId }: { targetUserId: number }) {
  const dispatch = useAppDispatch();
  const isFollowing = useAppSelector(selectIsFollowing(targetUserId));
  const followStatus = useAppSelector(selectFollowStatus(targetUserId));
  const isLoading = useAppSelector(selectFollowLoadingByUserId(targetUserId));

  const handleToggleFollow = async () => {
    // Optimistic update
    dispatch(
      updateFollowStatus({
        userId: targetUserId,
        isFollowing: !isFollowing,
        followStatus: !isFollowing ? "pending" : null,
      })
    );

    try {
      const result = await toggleFollowAPI(targetUserId);

      // Update with server response
      dispatch(
        setFollowRelationship({
          userId: targetUserId,
          data: {
            isFollowing: result.is_following,
            followStatus: result.status,
          },
        })
      );
    } catch (error) {
      // Rollback on error
      dispatch(
        updateFollowStatus({
          userId: targetUserId,
          isFollowing: isFollowing,
          followStatus: followStatus,
        })
      );
    }
  };
}
```

---

## Migration Guide

### From Old Store

**Old way** (everything persisted):

```typescript
const { isAuthenticated } = useAppSelector((state) => state.userAuth);
```

**New way** (only auth persisted):

```typescript
// For authentication
import { selectIsAuthenticated } from "@/src/redux-store/slices/auth/selectors";
const isAuthenticated = useAppSelector(selectIsAuthenticated);

// For user data
import { selectCurrentUser } from "@/src/redux-store/slices/user/selectors";
const currentUser = useAppSelector(selectCurrentUser);
```

### Updating Existing Components

1. **Replace old imports**:

```typescript
// Old
import { loginUser, logoutUser } from "@/src/redux-store/slices/user";

// New
import { login, logout } from "@/src/redux-store/slices/auth";
import { setUser, clearUser } from "@/src/redux-store/slices/user";
```

2. **Update login flow**:

```typescript
// Old
dispatch(loginUser());

// New
dispatch(login());
dispatch(setUser(userData)); // Set user data separately
```

3. **Update logout flow**:

```typescript
// Old
dispatch(logoutUser());

// New
dispatch(logout());
dispatch(clearUser());
dispatch(clearAllFollowRelationships()); // Optional: clear follow data
```

---

## Best Practices

### 1. Use Selectors

Always use selectors instead of accessing state directly:

```typescript
// ✅ Good
const user = useAppSelector(selectCurrentUser);

// ❌ Bad
const user = useAppSelector((state) => state.user.currentUser);
```

### 2. Optimistic Updates

For better UX, update UI immediately and rollback on error:

```typescript
const handleFollow = async () => {
  const previousState = { isFollowing, followStatus };

  // Optimistic update
  dispatch(
    updateFollowStatus({ userId, isFollowing: true, followStatus: "pending" })
  );

  try {
    await followAPI(userId);
  } catch (error) {
    // Rollback
    dispatch(updateFollowStatus({ userId, ...previousState }));
  }
};
```

### 3. Clear State on Logout

Always clear user and follow data on logout:

```typescript
const handleLogout = () => {
  dispatch(logout());
  dispatch(clearUser());
  dispatch(clearAllFollowRelationships());
};
```

### 4. Fetch User Data on App Load

Since user data is not persisted, fetch it when the app loads:

```typescript
useEffect(() => {
  if (isAuthenticated && !currentUser) {
    fetchCurrentUser().then((user) => {
      dispatch(setUser(user));
    });
  }
}, [isAuthenticated, currentUser]);
```

---

## Scalability Features

### 1. Easy to Add New Slices

Follow the same pattern to add new slices (e.g., posts, notifications):

```typescript
// slices/posts/index.ts
export const postsSlice = createSlice({
  name: "posts",
  initialState: { items: [], isLoading: false },
  reducers: {
    /* ... */
  },
});

// store.ts
import postsReducer from "./slices/posts";

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  user: userReducer,
  follow: followReducer,
  posts: postsReducer, // Add new slice
});
```

### 2. Selective Persistence

Only persist what's necessary. To persist additional data:

```typescript
const userPersistConfig = {
  key: "user",
  storage,
  whitelist: ["preferences"], // Only persist user preferences
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  user: persistReducer(userPersistConfig, userReducer),
  // ...
});
```

### 3. Normalized State

For large datasets, consider normalizing state:

```typescript
// Instead of
{ users: UserType[] }

// Use
{
  users: {
    byId: Record<number, UserType>,
    allIds: number[]
  }
}
```

---

## Testing

### Testing Selectors

```typescript
import { selectCurrentUser } from "./selectors";

test("selectCurrentUser returns current user", () => {
  const state = {
    user: { currentUser: mockUser, isLoading: false, error: null },
  };
  expect(selectCurrentUser(state)).toEqual(mockUser);
});
```

### Testing Reducers

```typescript
import userReducer, { setUser } from "./index";

test("setUser updates current user", () => {
  const state = userReducer(undefined, setUser(mockUser));
  expect(state.currentUser).toEqual(mockUser);
});
```

---

## Performance Tips

1. **Use `useAppSelector` with care**: Avoid selecting large objects if you only need a small part
2. **Memoize selectors**: Use `createSelector` from `@reduxjs/toolkit` for derived data
3. **Batch updates**: Use `batch` from `react-redux` for multiple dispatches
4. **Clean up**: Clear unused data from state to prevent memory leaks

---

## Troubleshooting

### Issue: State not persisting

- Check that the slice is in the `whitelist` of the persist config
- Verify localStorage is enabled in the browser

### Issue: State not updating

- Ensure you're using the correct action
- Check that the reducer is handling the action
- Use Redux DevTools to inspect state changes

### Issue: Type errors

- Make sure to use `useAppDispatch` and `useAppSelector` instead of plain `useDispatch` and `useSelector`
- Import types from the correct location

---

## Additional Resources

- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [Redux Persist Documentation](https://github.com/rt2zz/redux-persist)
- [React Redux Hooks](https://react-redux.js.org/api/hooks)
