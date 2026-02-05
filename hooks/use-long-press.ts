/**
 * Long Press Hook
 *
 * Detects long-press gestures on touch devices.
 * Used by the Summary Card for mobile edit context menu trigger.
 */

import { useCallback, useRef, useState } from 'react'

interface UseLongPressOptions {
  /** Duration in ms before long press triggers (default: 500) */
  threshold?: number
  /** Callback when long press is detected */
  onLongPress: () => void
  /** Optional callback for regular click (if long press wasn't triggered) */
  onClick?: () => void
  /** Prevent context menu from appearing on long press (default: true) */
  preventDefault?: boolean
}

interface UseLongPressResult {
  /** Event handlers to spread on the target element */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchEnd: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onMouseDown: (e: React.MouseEvent) => void
    onMouseUp: (e: React.MouseEvent) => void
    onMouseLeave: (e: React.MouseEvent) => void
    onContextMenu: (e: React.MouseEvent) => void
  }
  /** Whether a long press is currently in progress */
  isLongPressing: boolean
}

/**
 * Hook for detecting long-press gestures
 *
 * @example
 * ```tsx
 * const { handlers, isLongPressing } = useLongPress({
 *   onLongPress: () => setContextMenuOpen(true),
 *   onClick: () => handleClick(),
 *   threshold: 500,
 * })
 *
 * return <div {...handlers}>Press and hold</div>
 * ```
 */
export function useLongPress({
  threshold = 500,
  onLongPress,
  onClick,
  preventDefault = true,
}: UseLongPressOptions): UseLongPressResult {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPressRef = useRef(false)
  const [isLongPressing, setIsLongPressing] = useState(false)

  // Track initial touch position to detect movement
  const startPosRef = useRef<{ x: number; y: number } | null>(null)

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setIsLongPressing(false)
  }, [])

  const start = useCallback(
    (clientX: number, clientY: number) => {
      clear()
      isLongPressRef.current = false
      startPosRef.current = { x: clientX, y: clientY }

      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true
        setIsLongPressing(true)
        onLongPress()
      }, threshold)
    },
    [clear, onLongPress, threshold]
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0]
      start(touch.clientX, touch.clientY)
    },
    [start]
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isLongPressRef.current && onClick) {
        onClick()
      }
      clear()
    },
    [clear, onClick]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      // Cancel long press if user moves finger more than 10px
      if (startPosRef.current) {
        const touch = e.touches[0]
        const dx = Math.abs(touch.clientX - startPosRef.current.x)
        const dy = Math.abs(touch.clientY - startPosRef.current.y)
        if (dx > 10 || dy > 10) {
          clear()
        }
      }
    },
    [clear]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only handle left click
      if (e.button === 0) {
        start(e.clientX, e.clientY)
      }
    },
    [start]
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!isLongPressRef.current && onClick) {
        onClick()
      }
      clear()
    },
    [clear, onClick]
  )

  const handleMouseLeave = useCallback(() => {
    clear()
  }, [clear])

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (preventDefault) {
        e.preventDefault()
      }
    },
    [preventDefault]
  )

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchMove: handleTouchMove,
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onContextMenu: handleContextMenu,
    },
    isLongPressing,
  }
}
