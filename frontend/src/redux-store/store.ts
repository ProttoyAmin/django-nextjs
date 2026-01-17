import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./slices/auth";
import userReducer from "./slices/user";
import followReducer from "./slices/follow";
import postReducer from "./slices/post";
import commentReducer from "./slices/comment";
import clubReducer from "./slices/club";
import rolesReducer from "./slices/roles";
import notificationReducer from "./slices/notifications";

const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['isAuthenticated'],
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  user: userReducer,
  follow: followReducer,
  post: postReducer,
  comment: commentReducer,
  club: clubReducer,
  roles: rolesReducer,
  notifications: notificationReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NEXT_PUBLIC_NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;