'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Button from '@/src/app/components/atoms/Button'
import { activateUser } from '@/src/libs/auth/actions/user.actions'

export default function ActivatePage() {
    const params = useParams()
    const { uid, token } = params
    const router = useRouter()

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [timeLeft, setTimeLeft] = useState(3)
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(() => {
        if (uid && token) {
            console.log('Activation Params - UID:', uid, 'Token:', token)
        }
    }, [uid, token])

    useEffect(() => {
        let interval: NodeJS.Timeout

        // Only run timer if we are in success state
        if (status === 'success' && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1)
            }, 1000)
        } else if (status === 'success' && timeLeft === 0) {
            router.push('/login')
        }

        return () => clearInterval(interval)
    }, [status, timeLeft, router])

    const handleActivate = async () => {
        if (!uid || !token) {
            setStatus('error')
            setErrorMsg('Invalid activation link.')
            return
        }

        setStatus('loading')

        try {
            const result = await activateUser(uid as string, token as string)

            if (result.success) {
                setStatus('success')
            } else {
                setStatus('error')
                const detail = result.errors?.detail || result.errors?.uid || result.errors?.token
                setErrorMsg(Array.isArray(detail) ? detail[0] : (detail || 'Activation failed'))
            }
        } catch (err) {
            setStatus('error')
            setErrorMsg('Something went wrong. Please try again.')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-black transition-colors duration-300">
            <div className="max-w-md w-full space-y-8 p-8 rounded-2xl shadow-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <div className="text-center">
                    <div className={`mx-auto h-20 w-20 flex items-center justify-center rounded-full mb-6 group transition-all duration-300 ${status === 'error' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30 hover:scale-110'
                        }`}>
                        {status === 'success' ? (
                            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 animate-pulse">{timeLeft}s</span>
                        ) : status === 'error' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-10 w-10 text-blue-600 dark:text-blue-400 transition-transform duration-500 ${status === 'loading' ? 'animate-spin' : 'group-hover:rotate-12'}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                {status === 'loading' ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                )}
                            </svg>
                        )}
                    </div>

                    <h2 className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        {status === 'success' ? 'Account Activated!' : status === 'error' ? 'Activation Failed' : 'Activate Account'}
                    </h2>
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        {status === 'success'
                            ? 'Redirecting to login page...'
                            : status === 'error'
                                ? errorMsg
                                : 'Welcome! Please click the button below to verify your account and proceed to login.'}
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    {status !== 'success' && (
                        <Button
                            name={status === 'loading' ? "Activating..." : "Activate Security Token"}
                            onClick={handleActivate}
                            loading={status === 'loading'}
                            disabled={status === 'loading'}
                            variant={status === 'error' ? 'danger' : 'primary'}
                            fullWidth={true}
                            size="squared"
                            className="w-full"
                            icon={!['loading', 'success', 'error'].includes(status) ? (
                                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            ) : null}
                        />
                    )}

                    {status === 'idle' && (
                        <div className="text-center">
                            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                                Secure Verification System
                            </p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center">
                            <button onClick={() => router.push('/signup')} className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                                Back to Sign Up
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}