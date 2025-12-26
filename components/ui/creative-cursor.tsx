"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion"

export const CreativeCursor = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isHovering, setIsHovering] = useState(false)
    const cursorRef = useRef<HTMLDivElement>(null)

    // Smooth spring physics for main cursor
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    const springConfig = { damping: 25, stiffness: 150, mass: 0.5 }
    const springX = useSpring(mouseX, springConfig)
    const springY = useSpring(mouseY, springConfig)

    useEffect(() => {
        const updateMouse = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY })
            mouseX.set(e.clientX)
            mouseY.set(e.clientY)
        }

        const updateHoverState = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            // Check if target is clickable/interactive
            const isInteractive =
                target.tagName === 'BUTTON' ||
                target.tagName === 'A' ||
                target.closest('button') ||
                target.closest('a') ||
                target.classList.contains('cursor-pointer')

            setIsHovering(!!isInteractive)
        }

        window.addEventListener("mousemove", updateMouse)
        window.addEventListener("mouseover", updateHoverState)

        return () => {
            window.removeEventListener("mousemove", updateMouse)
            window.removeEventListener("mouseover", updateHoverState)
        }
    }, [mouseX, mouseY])

    return (
        <>
            <motion.div
                className="fixed top-0 left-0 w-8 h-8 rounded-full border border-fatsoma-primary pointer-events-none z-[9999] mix-blend-difference"
                style={{
                    x: springX,
                    y: springY,
                    translateX: "-50%",
                    translateY: "-50%",
                    scale: isHovering ? 2.5 : 1,
                    backgroundColor: isHovering ? "rgba(255, 255, 255, 0.1)" : "transparent",
                }}
            >
                <AnimatePresence>
                    {isHovering && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            className="absolute inset-0 rounded-full bg-fatsoma-primary/20 blur-md"
                        />
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Particle Trail - simplified for performance */}
            <motion.div
                className="fixed top-0 left-0 w-2 h-2 rounded-full bg-fatsoma-secondary pointer-events-none z-[9999]"
                style={{
                    x: mouseX,
                    y: mouseY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
                transition={{ type: "tween", ease: "backOut", duration: 0.1 }}
            />
        </>
    )
}
