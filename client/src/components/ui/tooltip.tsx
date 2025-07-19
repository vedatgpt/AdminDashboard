import * as React from "react"

import { cn } from "@/lib/utils"

// Simple Tooltip Provider - just returns children
const TooltipProvider = ({ children, ...props }: React.PropsWithChildren) => (
  <div {...props}>{children}</div>
)

// Simple Tooltip - just returns children for now
const Tooltip = ({ children, ...props }: React.PropsWithChildren) => (
  <div {...props}>{children}</div>
)

// Tooltip Trigger - the element that triggers the tooltip
const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>
    {children}
  </div>
))
TooltipTrigger.displayName = "TooltipTrigger"

// Tooltip Content - the tooltip content (simplified version)
const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-gray-900 px-3 py-1.5 text-sm text-white shadow-md",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
