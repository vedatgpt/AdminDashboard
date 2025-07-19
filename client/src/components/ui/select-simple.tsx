import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

// Simple Select for basic dropdown functionality
const Select = ({ children, ...props }: React.PropsWithChildren<React.SelectHTMLAttributes<HTMLSelectElement>>) => (
  <div className="relative">
    <select
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
        props.className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
  </div>
)

const SelectContent = ({ children }: React.PropsWithChildren) => <>{children}</>
const SelectItem = ({ children, ...props }: React.PropsWithChildren<React.OptionHTMLAttributes<HTMLOptionElement>>) => (
  <option {...props}>{children}</option>
)
const SelectTrigger = Select
const SelectValue = ({ placeholder, ...props }: { placeholder?: string } & React.HTMLAttributes<HTMLDivElement>) => (
  <div {...props}>{placeholder}</div>
)

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }