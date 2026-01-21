"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, MotionProps } from "motion/react"

import { cn } from "@/lib/utils"

type CharacterSet = string[] | readonly string[]

interface HyperTextProps extends MotionProps {
  /** The text content to be animated */
  children: string
  /** Optional className for styling */
  className?: string
  /** Duration of the animation in milliseconds */
  duration?: number
  /** Delay before animation starts in milliseconds */
  delay?: number
  /** Component to render as - defaults to div */
  as?: React.ElementType
  /** Whether to start animation when element comes into view */
  startOnView?: boolean
  /** Whether to trigger animation on hover */
  animateOnHover?: boolean
  /** If true, only animate once (first trigger) */
  animateOnce?: boolean
  /** Custom character set for scramble effect. Defaults to uppercase alphabet */
  characterSet?: CharacterSet
}

const DEFAULT_CHARACTER_SET = Object.freeze(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
) as readonly string[]

const getRandomInt = (max: number): number => Math.floor(Math.random() * max)

export function HyperText({
  children,
  className,
  duration = 800,
  delay = 0,
  as: Component = "div",
  startOnView = false,
  animateOnHover = true,
  animateOnce = false,
  characterSet = DEFAULT_CHARACTER_SET,
  ...props
}: HyperTextProps) {
  const MotionComponent = motion.create(Component, {
    forwardMotionProps: true,
  })

  const [displayText, setDisplayText] = useState<string[]>(() =>
    children.split("")
  )
  const [isAnimating, setIsAnimating] = useState(false)
  const hasAnimated = useRef(false)
  const isHovering = useRef(false)
  const hasTriggeredThisHover = useRef(false)
  const iterationCount = useRef(0)
  const elementRef = useRef<HTMLElement>(null)

  const trigger = () => {
    if (animateOnce && hasAnimated.current) return
    if (!isAnimating) {
      iterationCount.current = 0
      setIsAnimating(true)
    }
  }

  // Handle animation start based on view or delay
  useEffect(() => {
    if (!startOnView) {
      // If we're animating on hover, don't auto-start on mount.
      if (animateOnHover) return

      const startTimeout = setTimeout(() => {
        setIsAnimating(true)
      }, delay)
      return () => clearTimeout(startTimeout)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsAnimating(true)
          }, delay)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: "-30% 0px -30% 0px" }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [delay, startOnView])

  // Handle scramble animation
  useEffect(() => {
    if (!isAnimating) return

    const maxIterations = children.length
    const startTime = performance.now()
    let animationFrameId: number

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      iterationCount.current = progress * maxIterations

      setDisplayText((currentText) =>
        currentText.map((letter, index) =>
          letter === " "
            ? letter
            : index <= iterationCount.current
              ? children[index]
              : characterSet[getRandomInt(characterSet.length)]
        )
      )

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate)
      } else {
        hasAnimated.current = true
        setIsAnimating(false)
      }
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrameId)
  }, [children, duration, isAnimating, characterSet])

  return (
    <MotionComponent
      ref={elementRef}
      {...props}
      // Keep this clickable/selectable within links while animating.
      // (No pointer-events disabling; no preventDefault/stopPropagation anywhere.)
      className={cn("inline-block overflow-hidden", className)}
      onPointerEnter={(e: React.PointerEvent) => {
        if (!animateOnHover) return
        // Avoid retriggers caused by layout/scroll-driven header motion:
        // only animate after a real pointer movement while hovering.
        isHovering.current = true
        hasTriggeredThisHover.current = false
      }}
      onPointerMove={(e: React.PointerEvent) => {
        if (!animateOnHover) return
        if (!isHovering.current) return
        if (hasTriggeredThisHover.current) return
        hasTriggeredThisHover.current = true
        trigger()
      }}
      onPointerLeave={(e: React.PointerEvent) => {
        if (!animateOnHover) return
        isHovering.current = false
        hasTriggeredThisHover.current = false
      }}
    >
      <AnimatePresence>
        {displayText.map((letter, index) => (
          <motion.span
            key={index}
            className={cn("font-mono", letter === " " ? "w-3" : "")}
          >
            {letter.toUpperCase()}
          </motion.span>
        ))}
      </AnimatePresence>
    </MotionComponent>
  )
}
