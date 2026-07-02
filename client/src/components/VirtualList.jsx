import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const VirtualList = ({
  items,
  itemHeight,
  renderItem,
  height = '100%',
  overscan = 5,
  className = '',
  onScroll
}) => {
  const containerRef = useRef(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const updateHeight = () => {
      setContainerHeight(node.clientHeight)
    }

    updateHeight()

    const resizeObserver = new ResizeObserver(updateHeight)
    resizeObserver.observe(node)

    return () => resizeObserver.disconnect()
  }, [])

  const handleScroll = useCallback((event) => {
    setScrollTop(event.currentTarget.scrollTop)
    if (typeof onScroll === 'function') {
      onScroll(event)
    }
  }, [onScroll])

  const totalHeight = items.length * itemHeight
  const startIndex = useMemo(
    () => Math.max(0, Math.floor(scrollTop / itemHeight) - overscan),
    [itemHeight, overscan, scrollTop]
  )
  const endIndex = useMemo(
    () => Math.min(items.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan),
    [containerHeight, itemHeight, items.length, overscan, scrollTop]
  )

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  )

  const formattedHeight = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{ height: formattedHeight, position: 'relative' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: startIndex * itemHeight, left: 0, right: 0 }}>
          {visibleItems.map((item, index) => renderItem(item, startIndex + index))}
        </div>
      </div>
    </div>
  )
}

export default React.memo(VirtualList)
