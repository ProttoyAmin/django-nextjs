import React from "react";

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'share';
  message: string;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  time: string;
  isRead: boolean;
  postId?: string;
}

function NotificationDrawer() {
  const items: Notification[] = [
    {
      id: '1',
      type: 'like',
      message: 'liked your post',
      user: {
        id: 'user1',
        username: 'john_doe',
        avatar: 'https://via.placeholder.com/40',
      },
      time: '2 hours ago',
      isRead: false,
      postId: 'post1'
    },
    {
      id: '2',
      type: 'comment',
      message: 'commented on your post',
      user: {
        id: 'user2',
        username: 'jane_smith',
        avatar: 'https://via.placeholder.com/40',
      },
      time: '4 hours ago',
      isRead: true,
      postId: 'post2'
    },
    {
      id: '3',
      type: 'follow',
      message: 'started following you',
      user: {
        id: 'user3',
        username: 'bob_johnson',
        avatar: 'https://via.placeholder.com/40',
      },
      time: '1 day ago',
      isRead: false,
    },
    {
      id: '4',
      type: 'mention',
      message: 'mentioned you in a comment',
      user: {
        id: 'user4',
        username: 'alice_williams',
        avatar: 'https://via.placeholder.com/40',
      },
      time: '1 day ago',
      isRead: true,
      postId: 'post3'
    },
    {
      id: '5',
      type: 'share',
      message: 'shared your post',
      user: {
        id: 'user5',
        username: 'charlie_brown',
        avatar: 'https://via.placeholder.com/40',
      },
      time: '2 days ago',
      isRead: false,
      postId: 'post4'
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'follow':
        return '👤';
      case 'mention':
        return '📢';
      case 'share':
        return '🔄';
      default:
        return '🔔';
    }
  };

  return (
    <div className="w-full max-w-sm p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-3 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-lg font-bold leading-none text-gray-900 dark:text-white">Notifications</h5>
        <a href="#" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-500">
          Mark all as read
        </a>
      </div>
      <div className="flow-root">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {items.map((item) => (
            <li key={item.id} className={`py-3 ${!item.isRead ? 'bg-gray-50 dark:bg-gray-700' : ''}`}>
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <img className="w-8 h-8 rounded-full" src={item.user.avatar} alt={item.user.username} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                    {item.user.username}
                  </p>
                  <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                    {getNotificationIcon(item.type)} {item.message}
                  </p>
                </div>
                <div className="inline-flex items-center text-xs font-normal text-gray-500 dark:text-gray-400">
                  {item.time}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default NotificationDrawer;
