/**
 * Virtualized List Component
 * SOLID: Single Responsibility - only handles virtual scrolling
 * DRY: Reusable virtualized list component
 * DIP: Depends on abstractions
 */

import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

export interface VirtualizedListProps<T> {
  items: T[]
  itemHeight: number | ((index: number) => number)
  renderItem: (item: T, index: number) => React.ReactNode
  containerHeight?: number
  className?: string
  overscan?: number
}

/**
 * Virtualized List Component
 * Efficiently renders large lists using virtual scrolling
 */
export default function VirtualizedList<T>({
  items,
  itemHeight,
  renderItem,
  containerHeight = 600,
  className = '',
  overscan = 5,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: typeof itemHeight === 'function' ? itemHeight : () => itemHeight,
    overscan,
  })

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  )
}
