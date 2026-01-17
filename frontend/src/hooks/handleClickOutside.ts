// hooks/handleClickOutside.ts
'use client'

import { RefObject, useEffect } from 'react'

type Handler = (event: MouseEvent | TouchEvent) => void

function useClickOutside<T extends HTMLElement = HTMLElement>(
    ref: RefObject<T | null>,  // Accept nullable refs
    handler: Handler,
    enabled: boolean = true
): void {
    useEffect(() => {
        if (!enabled) return

        const listener = (event: MouseEvent | TouchEvent) => {
            const el = ref?.current

            // Do nothing if clicking ref's element or descendent elements
            if (!el || el.contains(event.target as Node)) {
                return
            }

            handler(event)
        }

        document.addEventListener('mousedown', listener)
        document.addEventListener('touchstart', listener)

        return () => {
            document.removeEventListener('mousedown', listener)
            document.removeEventListener('touchstart', listener)
        }
    }, [ref, handler, enabled])
}

export default useClickOutside