// serverCookieUtils.ts
'use server'
import { cookies } from 'next/headers';


export async function setServerCookie(
  name: string,
  value: string,
  options?: {
    maxAge?: number; // in seconds
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  }
) {
  const cookieStore = await cookies();
  cookieStore.set(name, value, {
    path: options?.path || '/',
    maxAge: options?.maxAge,
    secure: options?.secure ?? process.env.NODE_ENV === 'production',
    httpOnly: options?.httpOnly ?? false,
    sameSite: options?.sameSite || 'lax',
  });
}


export async function getServerCookie(name: string): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(name);
  return cookie?.value || null;
}


export async function deleteServerCookie(name: string, path: string = '/') {
  const cookieStore = await cookies();
  cookieStore.delete(name);
}


export async function hasServerCookie(name: string): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.has(name);
}