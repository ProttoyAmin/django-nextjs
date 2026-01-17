// src/constants/navigation.ts
import {
    HomeIcon,
    ArchiveIcon,
    ProfileIcon,
    SettingsIcon,
    NotificationIcon,
    SearchIcon,
    MessageIcon,
    PlusIcon
} from '@/src/app/components/atoms/Icons';

export interface NavItem {
    href: string;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
}

export const NAV_ITEMS: NavItem[] = [
    {
        name: 'Home',
        href: '/',
        icon: HomeIcon
    },
    {
        name: 'Search',
        href: '/search',
        icon: SearchIcon
    },
    {
        name: 'Messages',
        href: '/messages',
        icon: MessageIcon,
        badge: 3 // example badge count
    },
    {
        name: 'Notifications',
        href: '/notifications',
        icon: NotificationIcon,
        badge: 5 // example badge count
    },
    {
        name: 'Profile',
        href: '/profile',
        icon: ProfileIcon
    },
    {
        name: 'Archive',
        href: '/archive',
        icon: ArchiveIcon
    },
    {
        name: 'Settings',
        href: '/settings',
        icon: SettingsIcon
    },
    {
        name: 'Create Club',
        href: '/club/create',
        icon: PlusIcon
    }
];