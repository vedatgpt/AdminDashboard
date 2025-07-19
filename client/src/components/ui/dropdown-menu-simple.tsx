import * as React from "react"

import { cn } from "@/lib/utils"

// Simple dropdown menu components
const DropdownMenu = ({ children }: React.PropsWithChildren) => <div>{children}</div>
const DropdownMenuTrigger = ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
  <div {...props}>{children}</div>
)
const DropdownMenuContent = ({ children, className, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
  <div className={cn("bg-white border rounded-md shadow-lg p-1", className)} {...props}>
    {children}
  </div>
)
const DropdownMenuItem = ({ children, className, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
  <div className={cn("px-2 py-1 hover:bg-gray-100 cursor-pointer", className)} {...props}>
    {children}
  </div>
)
const DropdownMenuSeparator = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("border-t my-1", className)} {...props} />
)

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator }