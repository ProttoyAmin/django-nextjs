// components/atoms/DropdownMenu/index.tsx
'use client'

import React, { useState, useRef, ReactNode, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { MoreVertical } from 'lucide-react'
import useClickOutside from '@/src/hooks/handleClickOutside'

export interface DropdownMenuItem {
    /** Unique identifier for the menu item */
    id: string | number
    /** Display label for the item */
    label: string | ReactNode
    /** Optional icon to display before the label */
    icon?: ReactNode
    /** Whether the item is disabled */
    disabled?: boolean
    /** Additional CSS class */
    className?: string
    /** Optional divider before this item */
    divider?: boolean
    /** Optional destructive/red style */
    destructive?: boolean
    /** Optional handler for click */
    onClick?: () => void
}

export interface DropdownMenuProps {
    /** Array of menu items */
    items: DropdownMenuItem[]
    /** Callback when an item is clicked */
    onItemClick?: (item: DropdownMenuItem) => void
    /** Additional CSS class for the dropdown container */
    className?: string
    /** Additional CSS class for the button */
    buttonClassName?: string
    /** Additional CSS class for the menu */
    menuClassName?: string
    /** Whether the dropdown is disabled */
    disabled?: boolean
    /** Position of dropdown menu */
    position?: 'bottom' | 'top' | 'left' | 'right'
    /** Alignment of dropdown menu */
    alignment?: 'start' | 'center' | 'end'
    /** Custom trigger button */
    trigger?: ReactNode
    /** Callback when menu opens */
    onOpen?: () => void
    /** Callback when menu closes */
    onClose?: () => void
}

function DropdownMenu({
    items,
    onItemClick,
    className,
    buttonClassName,
    menuClassName,
    disabled = false,
    position = 'bottom',
    alignment = 'end',
    trigger,
    onOpen,
    onClose
}: DropdownMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Handle click outside to close menu
    const handleClickOutside = useCallback(() => {
        if (isOpen) {
            setIsOpen(false)
            onClose?.()
        }
    }, [isOpen, onClose])

    useClickOutside<HTMLDivElement>(dropdownRef, handleClickOutside, isOpen)

    // Toggle menu
    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (disabled) return

        const newIsOpen = !isOpen
        setIsOpen(newIsOpen)

        if (newIsOpen) {
            onOpen?.()
        } else {
            onClose?.()
        }
    }

    // Handle item click
    const handleItemClick = (item: DropdownMenuItem, e: React.MouseEvent) => {
        e.stopPropagation()
        if (item.disabled) return

        setIsOpen(false)
        onClose?.()

        // Call item's onClick if provided
        if (item.onClick) {
            item.onClick()
        }

        // Call the onItemClick prop
        if (onItemClick) {
            onItemClick(item)
        }
    }

    // Position classes
    const positionClasses = {
        bottom: 'top-full mt-1',
        top: 'bottom-full mb-1',
        left: 'right-full mr-1 top-0',
        right: 'left-full ml-1 top-0'
    }

    // Alignment classes
    const alignmentClasses = {
        start: 'left-0',
        center: 'left-1/2 transform -translate-x-1/2',
        end: 'right-0'
    }

    return (
        <div
            ref={dropdownRef}
            className={cn('relative inline-block', className)}
        >
            {/* Trigger Button */}
            {trigger ? (
                <div onClick={toggleMenu} className="cursor-pointer">
                    {trigger}
                </div>
            ) : (
                <button
                    type="button"
                    onClick={toggleMenu}
                    disabled={disabled}
                    className={cn(
                        'p-1.5 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50',
                        disabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700',
                        buttonClassName
                    )}
                    aria-label="More options"
                >
                    <MoreVertical className="h-4 w-4" />
                </button>
            )}

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className={cn(
                        'absolute z-50 min-w-[160px] rounded-md shadow-lg bg-black border border-gray-200 py-1 overflow-hidden',
                        positionClasses[position],
                        alignmentClasses[alignment],
                        menuClassName
                    )}
                >
                    {items.map((item) => {
                        if (item.divider) {
                            return (
                                <div
                                    key={`divider-${item.id}`}
                                    className="border-t border-gray-100 my-1"
                                />
                            )
                        }

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={(e) => handleItemClick(item, e)}
                                disabled={item.disabled}
                                className={cn(
                                    'flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-colors duration-150',
                                    item.disabled
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-gray-900 cursor-pointer',
                                    item.destructive && 'text-red-600 hover:bg-red-50',
                                    item.className
                                )}
                            >
                                {item.icon && (
                                    <span className="text-gray-500 shrink-0">
                                        {item.icon}
                                    </span>
                                )}
                                <span className="flex-1">{item.label}</span>
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default DropdownMenu