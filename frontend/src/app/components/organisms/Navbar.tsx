'use client';

import { useParams, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/src/redux-store';
import { RootState } from '@/src/redux-store/store';
import Link from 'next/link';
import { Club, Home, User } from 'lucide-react';
import { fetchUser } from '@/src/redux-store/slices/user';
import React, { useEffect } from 'react';

interface NavProps {
  type?: 'club' | 'user';
}

function Navbar({ type }: NavProps) {
  const params = useParams();
  const pathname = usePathname();
  const currentUser = useAppSelector((state: RootState) => state.user.currentUser);

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!currentUser) {
      console.log('fetching user');
      dispatch(fetchUser());
    }
  }, [dispatch, currentUser]);


  const getTitle = () => {
    if (pathname?.includes('/settings')) {
      return 'Club Settings';
    }
    if (params?.id && pathname?.includes(`/clubs/${params.id}`)) {
      return 'Club Dashboard';
    }
    if (pathname === '/') {
      return 'Home';
    }
    if (params?.username && pathname?.includes(`/${params.username}`)) {
      return 'Profile';
    }
    return 'Navbar';
  };

  const items = [
    {
      label: 'Home',
      href: `/`,
      icon: <Home />
    },
    {
      label: 'Profile',
      href: `/${currentUser?.username}`,
      icon: <User />
    },
    {
      label: 'Clubs',
      href: `/clubs`,
      icon: <Club />
    },
  ]

  if (type === 'club') {
    return (
      <>
        <div className="flex items-center gap-10 justify-center h-full">
          {items?.map((item) => (
            <React.Fragment key={item.href}>
              <Link
                href={item.href}
                className={`block text-sm font-medium border-b-2 border-transparent`}
              >
                <div className="flex items-center gap-2 hover:scale-110 transition-all">
                  {item.icon}
                  {/* {item.label} */}
                </div>
              </Link>
            </React.Fragment>
          ))}
        </div>
      </>
    )
  }

  return (
    <nav className="w-full bg-black">
      <div className="text-white flex items-center justify-between">
        <h1 className="text-xl font-bold capitalize">
          {getTitle()}
        </h1>
      </div>
    </nav>
  );
}

export default Navbar;