// libs/auth/api.ts
'use server'
import axios from 'axios';

const NEXT_PUBLIC_ACCOUNTS_API = process.env.NEXT_PUBLIC_ACCOUNTS_API
const NEXT_PUBLIC_CONNECTIONS_API = process.env.NEXT_PUBLIC_CONNECTIONS_API
const NEXT_PUBLIC_CLUBS_API = process.env.NEXT_PUBLIC_CLUBS_API
const NEXT_PUBLIC_POSTS_API = process.env.NEXT_PUBLIC_POSTS_API
const NEXT_PUBLIC_ACTIVITIES_API = process.env.NEXT_PUBLIC_ACTIVITIES_API

export const api = axios.create({
    baseURL: NEXT_PUBLIC_ACCOUNTS_API,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});


export const apiBaseless = axios.create({
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
})

export const connApi = axios.create({
    baseURL: NEXT_PUBLIC_CONNECTIONS_API,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
})


export const clubApi = axios.create({
    baseURL: NEXT_PUBLIC_CLUBS_API,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
})

export const postApi = axios.create({
    baseURL: NEXT_PUBLIC_POSTS_API,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
})

export const activityApi = axios.create({
    baseURL: NEXT_PUBLIC_ACTIVITIES_API,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
})