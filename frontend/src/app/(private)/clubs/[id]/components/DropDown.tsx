// components/atoms/Dropdown/index.tsx
'use client'

import React, { useState, useRef, useEffect, ReactNode, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, Check, Search } from 'lucide-react'
import useClickOutside from '@/src/hooks/handleClickOutside'

export interface DropdownItem {
    /** Unique identifier for the dropdown item */
    id: string | number
    /** Display label for the item */
    label: string | ReactNode
    /** Optional value (if different from label) */
    value?: any
    /** Optional icon to display before the label */
    icon?: ReactNode
    /** Whether the item is disabled */
    disabled?: boolean
    /** Additional CSS class */
    className?: string
    /** Optional divider before this item */
    divider?: boolean
    /** Optional subtext for the item */
    subtext?: string
    /** Optional badge/count */
    badge?: number | string
    /** Optional color for the item */
    color?: string
}

export interface DropdownProps {
    /** Array of dropdown items */
    items: DropdownItem[]
    /** Selected value(s) */
    value?: string | number | Array<string | number>
    /** Callback when selection changes */
    onChange?: (value: any, item: DropdownItem) => void
    /** Placeholder text when nothing is selected */
    placeholder?: string
    /** Whether multiple selection is allowed */
    multiple?: boolean
    /** Additional CSS class for the dropdown container */
    className?: string
    /** Additional CSS class for the button */
    buttonClassName?: string
    /** Additional CSS class for the dropdown menu */
    menuClassName?: string
    /** Additional CSS class for dropdown items */
    itemClassName?: string
    /** Whether the dropdown is disabled */
    disabled?: boolean
    /** Dropdown size */
    size?: 'sm' | 'md' | 'lg'
    /** Dropdown variant */
    variant?: 'default' | 'outline' | 'ghost' | 'filled'
    /** Whether to show search input */
    searchable?: boolean
    /** Search placeholder text */
    searchPlaceholder?: string
    /** Maximum height of dropdown menu */
    maxHeight?: number
    /** Position of dropdown menu */
    position?: 'bottom' | 'top' | 'left' | 'right'
    /** Alignment of dropdown menu */
    alignment?: 'start' | 'center' | 'end'
    /** Whether to close on select (for single select) */
    closeOnSelect?: boolean
    /** Custom render function for selected value */
    renderSelected?: (selected: DropdownItem | DropdownItem[]) => ReactNode
    /** Custom render function for dropdown item */
    renderItem?: (item: DropdownItem, isSelected: boolean) => ReactNode
    /** Whether to show checkmark for selected items */
    showCheckmark?: boolean
    /** Trigger element (custom button) */
    trigger?: ReactNode
    /** Callback when dropdown opens */
    onOpen?: () => void
    /** Callback when dropdown closes */
    onClose?: () => void
}

function Dropdown({
    items,
    value,
    onChange,
    placeholder = 'Select an option',
    multiple = false,
    className,
    buttonClassName,
    menuClassName,
    itemClassName,
    disabled = false,
    size = 'md',
    variant = 'default',
    searchable = false,
    searchPlaceholder = 'Search...',
    maxHeight = 300,
    position = 'bottom',
    alignment = 'start',
    closeOnSelect = true,
    renderSelected,
    renderItem,
    showCheckmark = true,
    trigger,
    onOpen,
    onClose
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedItems, setSelectedItems] = useState<DropdownItem[]>([])
    const dropdownRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

    // Initialize selected items based on value prop
    useEffect(() => {
        if (value === undefined || value === null) {
            setSelectedItems([])
            return
        }

        const selectedIds = Array.isArray(value) ? value : [value]
        const selected = items.filter(item => selectedIds.includes(item.id))
        setSelectedItems(selected)
    }, [value, items])

    // Filter items based on search query
    const filteredItems = searchable
        ? items.filter(item => {
            const label = typeof item.label === 'string'
                ? item.label.toLowerCase()
                : ''
            return label.includes(searchQuery.toLowerCase())
        })
        : items

    // Handle click outside to close dropdown
    const handleClickOutside = useCallback(() => {
        if (isOpen) {
            setIsOpen(false)
            setSearchQuery('')
            onClose?.()
        }
    }, [isOpen, onClose])

    //   useClickOutside(dropdownRef, handleClickOutside, isOpen)

    // Toggle dropdown
    const toggleDropdown = () => {
        if (disabled) return

        const newIsOpen = !isOpen
        setIsOpen(newIsOpen)

        if (newIsOpen) {
            onOpen?.()
            // Focus search input if searchable
            if (searchable && searchInputRef.current) {
                setTimeout(() => searchInputRef.current?.focus(), 0)
            }
        } else {
            onClose?.()
            setSearchQuery('')
        }
    }

    // Handle item selection
    const handleSelect = (item: DropdownItem) => {
        if (item.disabled) return

        let newSelectedItems: DropdownItem[]

        if (multiple) {
            const isSelected = selectedItems.some(selected => selected.id === item.id)

            if (isSelected) {
                // Deselect
                newSelectedItems = selectedItems.filter(selected => selected.id !== item.id)
            } else {
                // Select
                newSelectedItems = [...selectedItems, item]
            }
        } else {
            newSelectedItems = [item]
            if (closeOnSelect) {
                setIsOpen(false)
                setSearchQuery('')
                onClose?.()
            }
        }

        setSelectedItems(newSelectedItems)

        // Call onChange callback
        if (onChange) {
            if (multiple) {
                onChange(
                    newSelectedItems.map(item => item.value || item.id),
                    item
                )
            } else {
                onChange(item.value || item.id, item)
            }
        }
    }

    // Check if item is selected
    const isSelected = (item: DropdownItem) => {
        return selectedItems.some(selected => selected.id === item.id)
    }

    // Get selected display text
    const getSelectedDisplay = () => {
        if (renderSelected) {
            return renderSelected(multiple ? selectedItems : selectedItems[0])
        }

        if (selectedItems.length === 0) {
            return placeholder
        }

        if (multiple) {
            if (selectedItems.length === 1) {
                return selectedItems[0].label
            }
            return `${selectedItems.length} selected`
        }

        return selectedItems[0]?.label || placeholder
    }

    // Size classes
    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-2.5 text-base'
    }

    // Variant classes
    const variantClasses = {
        default: 'bg-white border border-gray-300 hover:border-gray-400',
        outline: 'bg-transparent border border-gray-300 hover:border-gray-500',
        ghost: 'bg-transparent border border-transparent hover:bg-gray-100',
        filled: 'bg-gray-100 border border-transparent hover:bg-gray-200'
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
            className={cn('relative inline-block w-full', className)}
        >
            {/* Trigger Button */}
            {trigger ? (
                <div onClick={toggleDropdown} className="cursor-pointer">
                    {trigger}
                </div>
            ) : (
                <button
                    type="button"
                    onClick={toggleDropdown}
                    disabled={disabled}
                    className={cn(
                        'flex items-center justify-between w-full rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50',
                        sizeClasses[size],
                        variantClasses[variant],
                        disabled && 'opacity-50 cursor-not-allowed',
                        buttonClassName
                    )}
                >
                    <span className="truncate">{getSelectedDisplay()}</span>
                    <ChevronDown className={cn(
                        "ml-2 h-4 w-4 transition-transform duration-200",
                        isOpen && "rotate-180"
                    )} />
                </button>
            )}

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className={cn(
                        'absolute z-50 min-w-[200px] rounded-md shadow-lg bg-white border border-gray-200 overflow-hidden',
                        positionClasses[position],
                        alignmentClasses[alignment],
                        menuClassName
                    )}
                    style={{ maxHeight }}
                >
                    {/* Search Input */}
                    {searchable && (
                        <div className="p-2 border-b border-gray-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder={searchPlaceholder}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    )}

                    {/* Dropdown Items */}
                    <div className="overflow-y-auto" style={{ maxHeight: maxHeight - (searchable ? 56 : 0) }}>
                        {filteredItems.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                No options found
                            </div>
                        ) : (
                            filteredItems.map((item) => {
                                const selected = isSelected(item)

                                if (renderItem) {
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => handleSelect(item)}
                                            className={cn(
                                                'cursor-pointer',
                                                item.divider && 'border-t border-gray-100 mt-1 pt-1',
                                                itemClassName
                                            )}
                                        >
                                            {renderItem(item, selected)}
                                        </div>
                                    )
                                }

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleSelect(item)}
                                        className={cn(
                                            'flex items-center justify-between px-4 py-2.5 text-sm transition-colors duration-150 cursor-pointer hover:bg-gray-50',
                                            selected && 'bg-primary-50 text-primary-700',
                                            item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
                                            item.divider && 'border-t border-gray-100 mt-1 pt-1',
                                            item.className,
                                            itemClassName
                                        )}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {item.icon && (
                                                <span className="text-gray-500 shrink-0">
                                                    {item.icon}
                                                </span>
                                            )}

                                            {item.color && (
                                                <div
                                                    className="w-3 h-3 rounded-full shrink-0"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate">{item.label}</span>
                                                    {item.badge !== undefined && (
                                                        <span className={cn(
                                                            "px-1.5 py-0.5 text-xs rounded-full",
                                                            selected
                                                                ? "bg-primary-100 text-primary-800"
                                                                : "bg-gray-100 text-gray-700"
                                                        )}>
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                {item.subtext && (
                                                    <p className="text-xs text-gray-500 truncate mt-0.5">
                                                        {item.subtext}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {showCheckmark && selected && (
                                            <Check className="h-4 w-4 text-primary-600 ml-2 shrink-0" />
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Dropdown