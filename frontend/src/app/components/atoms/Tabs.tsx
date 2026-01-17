'use client'

import React, { useState, useCallback, memo, ReactNode, useMemo, useEffect } from 'react'
import { cn } from '@/lib/utils' // Utility for className merging

export interface TabItem {
    id: string
    label: string | ReactNode
    content: ReactNode
    icon?: ReactNode
    disabled?: boolean
    count?: number
    className?: string
    tooltip?: string
}

interface TabsProps {
    items: TabItem[]
    defaultActiveTab?: string
    onTabChange?: (tabId: string, index: number) => void
    renderTab?: (item: TabItem, isActive: boolean, onClick: () => void) => ReactNode
    className?: string
    tabsListClassName?: string
    contentClassName?: string
    variant?: 'default' | 'pills' | 'underline' | 'segmented' | 'rounded'
    size?: 'sm' | 'md' | 'lg'
    lazyLoad?: boolean
    keepMounted?: boolean
    orientation?: 'horizontal' | 'vertical'
    fullWidth?: boolean
    bordered?: boolean
    activeTab?: string
}

// Memoized tab content component to prevent unnecessary re-renders
const TabContent = memo(({
    isActive,
    content,
    lazyLoad,
    keepMounted,
    className
}: {
    isActive: boolean
    content: ReactNode
    lazyLoad?: boolean
    keepMounted?: boolean
    className?: string
}) => {
    const [hasBeenActive, setHasBeenActive] = useState(isActive)

    useEffect(() => {
        if (isActive) {
            setHasBeenActive(true)
        }
    }, [isActive])

    // If lazy loading and never been active, don't render
    if (lazyLoad && !hasBeenActive) {
        return null
    }

    // If not active and we don't want to keep it mounted, don't render
    if (!isActive && !keepMounted && !lazyLoad) {
        return null
    }

    return (
        <div
            className={cn(
                'tab-content transition-all duration-200 ease-in-out',
                isActive ? 'opacity-100 visible' : 'opacity-0 invisible',
                !keepMounted && !isActive && 'hidden',
                className
            )}
            role="tabpanel"
            aria-labelledby={`tab-${(content as any)?.props?.id || 'content'}`}
            hidden={!isActive && !keepMounted}
        >
            {isActive || keepMounted ? content : null}
        </div>
    )
})

TabContent.displayName = 'TabContent'

// Memoized individual tab button to prevent re-renders
const TabButton = memo(({
    item,
    isActive,
    onClick,
    variant = 'default',
    size = 'md',
    fullWidth = false
}: {
    item: TabItem
    isActive: boolean
    onClick: () => void
    variant?: TabsProps['variant']
    size?: TabsProps['size']
    fullWidth?: boolean
}) => {
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-5 py-2.5 text-base'
    }

    const variantClasses = {
        default: cn(
            'border-b-2 transition-colors duration-200',
            isActive
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20'
        ),
        underline: cn(
            'border-b transition-colors duration-200',
            isActive
                ? 'border-primary-500 text-primary-600 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        ),
        pills: cn(
            'rounded-lg transition-colors duration-200',
            isActive
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
        ),
        segmented: cn(
            'border transition-colors duration-200',
            isActive
                ? 'bg-white border-gray-300 text-gray-900 shadow-sm'
                : 'bg-transparent border-transparent text-gray-500 hover:text-gray-700',
            'first:rounded-l-lg last:rounded-r-lg'
        ),
        rounded: cn(
            'rounded-full transition-colors duration-200',
            isActive
                ? 'bg-primary-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
        )
    }

    const buttonClasses = cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 whitespace-nowrap',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && 'flex-1',
        item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        item.className
    )

    return (
        <button
            id={`tab-${item.id}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${item.id}`}
            disabled={item.disabled}
            onClick={onClick}
            className={buttonClasses}
            title={item.tooltip}
            type="button"
        >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
            {item.count !== undefined && (
                <span className={cn(
                    "ml-2 px-1.5 py-0.5 text-xs font-medium rounded-full",
                    isActive && variant !== 'pills' && variant !== 'rounded'
                        ? "bg-primary-100 text-primary-700"
                        : "bg-gray-100 text-gray-700"
                )}>
                    {item.count}
                </span>
            )}
        </button>
    )
})

TabButton.displayName = 'TabButton'

function Tabs({
    items,
    defaultActiveTab,
    onTabChange,
    renderTab,
    className,
    tabsListClassName,
    contentClassName,
    variant = 'default',
    size = 'md',
    lazyLoad = true,
    keepMounted = false,
    orientation = 'horizontal',
    fullWidth = false,
    bordered = false,
    activeTab: controlledActiveTab
}: TabsProps) {
    // Validate that we have at least one tab
    if (!items || items.length === 0) {
        throw new Error('Tabs component must have at least one tab item')
    }

    // Get initial active tab
    const initialActiveTab = useMemo(() => {
        return controlledActiveTab || defaultActiveTab || items[0].id
    }, [controlledActiveTab, defaultActiveTab, items])

    const [internalActiveTab, setInternalActiveTab] = useState<string>(initialActiveTab)

    // Sync with controlled activeTab prop
    useEffect(() => {
        if (controlledActiveTab !== undefined) {
            setInternalActiveTab(controlledActiveTab)
        }
    }, [controlledActiveTab])

    // Determine which tab is active (controlled or internal state)
    const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab

    // Find active tab index
    const activeTabIndex = useMemo(() => {
        return items.findIndex(item => item.id === activeTab)
    }, [items, activeTab])

    // Handle tab click
    const handleTabClick = useCallback((tabId: string, index: number) => {
        const tab = items[index]
        if (tab.disabled) return

        if (controlledActiveTab === undefined) {
            setInternalActiveTab(tabId)
        }
        onTabChange?.(tabId, index)
    }, [items, controlledActiveTab, onTabChange])

    // Orientation styles
    const orientationClasses = orientation === 'vertical'
        ? 'flex flex-col space-y-2'
        : 'flex space-x-2'

    const containerClasses = cn(
        'tabs-container',
        orientation === 'vertical' ? 'flex' : 'block',
        bordered && 'border rounded-lg p-4',
        className
    )

    // Get active content
    const activeContent = useMemo(() => {
        const activeItem = items.find(item => item.id === activeTab)
        return activeItem?.content || items[0].content
    }, [items, activeTab])

    return (
        <div className={containerClasses}>
            {/* Tabs Header */}
            <div
                className={cn(
                    'tabs-list',
                    orientationClasses,
                    fullWidth && orientation === 'horizontal' && 'w-full',
                    orientation === 'vertical' && 'w-48 shrink-0',
                    tabsListClassName
                )}
                role="tablist"
                aria-orientation={orientation}
            >
                {items.map((item, index) => {
                    const isActive = item.id === activeTab

                    if (renderTab) {
                        return renderTab(item, isActive, () => handleTabClick(item.id, index))
                    }

                    return (
                        <TabButton
                            key={item.id}
                            item={item}
                            isActive={isActive}
                            onClick={() => handleTabClick(item.id, index)}
                            variant={variant}
                            size={size}
                            fullWidth={fullWidth && orientation === 'horizontal'}
                        />
                    )
                })}
            </div>

            {/* Tab Content */}
            <div className={cn(
                'tab-content-container mt-4',
                orientation === 'vertical' && 'flex-1 ml-4',
                contentClassName
            )}>
                {items.map((item, index) => (
                    <TabContent
                        key={item.id}
                        isActive={item.id === activeTab}
                        content={item.content}
                        lazyLoad={lazyLoad}
                        keepMounted={keepMounted}
                    />
                ))}
            </div>
        </div>
    )
}

export default Tabs;


// Usage:

// Basic

{/* <Tabs
        items={tabItems}
        defaultActiveTab="profile"
        onTabChange={(tabId, index) => {
          console.log(`Tab changed to ${tabId} at index ${index}`)
          setActiveTab(tabId)
        }}
        variant="underline"
        size="md"
        lazyLoad={true}
        keepMounted={false}
      />


Different Variants:

{/* <Tabs
  items={tabItems}
  variant="pills" // Options: default, underline, pills, segmented, rounded
  size="lg"
  fullWidth={true}
/> */}

{/* <Tabs
  items={tabItems}
  variant="segmented"
  size="sm"
  bordered={true}
/> */}

{/* <Tabs
  items={tabItems}
  variant="rounded"
  size="md"
/> */}

// Vertical:

{/* <Tabs
  items={tabItems}
  orientation="vertical"
  variant="pills"
  lazyLoad={false}
  keepMounted={true} // Keep all tab content mounted (good for form state preservation)
/>


Custom Tab Rendering

<Tabs
  items={tabItems}
  renderTab={(item, isActive, onClick) => (
    <button
      key={item.id}
      onClick={onClick}
      className={cn(
        'custom-tab-button',
        isActive && 'custom-active'
      )}
    >
      {item.icon}
      <span>{item.label}</span>
      {item.count && <span className="badge">{item.count}</span>}
    </button>
  )}
/>


Controlled from parent:

'use client'

import React, { useState } from 'react'
import Tabs from '@/components/ui/Tabs'

export default function ControlledTabsExample() {
  const [activeTab, setActiveTab] = useState('tab1')

  const tabItems = [
    {
      id: 'tab1',
      label: 'Tab 1',
      content: <div>Content 1</div>
    },
    {
      id: 'tab2',
      label: 'Tab 2',
      content: <div>Content 2</div>
    }
  ]

  return (
    <div>
      <div className="mb-4">
        <button onClick={() => setActiveTab('tab1')}>Go to Tab 1</button>
        <button onClick={() => setActiveTab('tab2')}>Go to Tab 2</button>
      </div>
      
      <Tabs
        items={tabItems}
        activeTab={activeTab} // Controlled from parent
        onTabChange={(tabId) => setActiveTab(tabId)}
      />
    </div>
  )
}


Complex content:

const dashboardTabs = [
  {
    id: 'overview',
    label: 'Overview',
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Dashboard Overview</h3>
        <p>Your dashboard statistics and summary...</p>
        {/* Complex components can go here */}
//       </div>
//     ),
//   },
//   {
//     id: 'analytics',
//     label: 'Analytics',
//     content: <AnalyticsChartComponent />, // Heavy component
//     disabled: false,
//     tooltip: 'View analytics and reports'
//   },
//   {
//     id: 'users',
//     label: 'Users',
//     content: <UsersTableComponent />, // Another heavy component
//     count: 42,
//   },
// ]

// Usage with lazy loading for heavy components
{/* <Tabs
  items={dashboardTabs}
  lazyLoad={true} // Heavy components only load when their tab is activated
  keepMounted={false} // Unmount when tab is not active (saves memory)
  variant="default"
/> */}