"use client"

import { type CSSProperties, type ReactNode, type ElementType, forwardRef } from "react"

type MotionProps = {
  children?: ReactNode
  className?: string
  style?: CSSProperties
  initial?: Record<string, unknown>
  animate?: Record<string, unknown>
  transition?: Record<string, unknown>
  exit?: Record<string, unknown>
  whileHover?: Record<string, unknown>
  whileTap?: Record<string, unknown>
  variants?: unknown
  layout?: boolean | string
  drag?: boolean | string
  dragConstraints?: unknown
  onDragEnd?: unknown
  [key: string]: unknown
}

function createMotionComponent(tag: string) {
  const Component = forwardRef<HTMLElement, MotionProps>(function Motion(
    { children, className, style, ...rest },
    _ref,
  ) {
    const Tag = tag as ElementType
    // Strip all framer-motion-only props
    const {
      initial: _i,
      animate: _a,
      transition: _t,
      exit: _e,
      whileHover: _wh,
      whileTap: _wt,
      variants: _v,
      layout: _l,
      drag: _d,
      dragConstraints: _dc,
      onDragEnd: _ode,
      ...htmlProps
    } = rest
    return (
      <Tag className={className} style={style} {...htmlProps}>
        {children}
      </Tag>
    )
  })
  Component.displayName = `motion.${tag}`
  return Component
}

export const motion = {
  div: createMotionComponent("div"),
  span: createMotionComponent("span"),
  p: createMotionComponent("p"),
  h1: createMotionComponent("h1"),
  h2: createMotionComponent("h2"),
  h3: createMotionComponent("h3"),
  button: createMotionComponent("button"),
  img: createMotionComponent("img"),
  section: createMotionComponent("section"),
  article: createMotionComponent("article"),
  li: createMotionComponent("li"),
  ul: createMotionComponent("ul"),
} as const

export type { MotionProps }
