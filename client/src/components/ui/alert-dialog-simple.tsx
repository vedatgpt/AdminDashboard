import * as React from "react"

import { cn } from "@/lib/utils"

// Simple alert dialog components
const AlertDialog = ({ children }: React.PropsWithChildren) => <div>{children}</div>

const AlertDialogTrigger = ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
  <div {...props}>{children}</div>
)

const AlertDialogContent = ({ children, className, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
  <div className={cn("fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", className)} {...props}>
    <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
      {children}
    </div>
  </div>
)

const AlertDialogHeader = ({ children, className, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
  <div className={cn("mb-4", className)} {...props}>{children}</div>
)

const AlertDialogTitle = ({ children, className, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLHeadingElement>>) => (
  <h2 className={cn("text-lg font-semibold", className)} {...props}>{children}</h2>
)

const AlertDialogDescription = ({ children, className, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLParagraphElement>>) => (
  <p className={cn("text-sm text-gray-600", className)} {...props}>{children}</p>
)

const AlertDialogFooter = ({ children, className, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
  <div className={cn("flex justify-end space-x-2 mt-4", className)} {...props}>{children}</div>
)

const AlertDialogAction = ({ children, className, ...props }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
  <button className={cn("px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700", className)} {...props}>
    {children}
  </button>
)

const AlertDialogCancel = ({ children, className, ...props }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
  <button className={cn("px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400", className)} {...props}>
    {children}
  </button>
)

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
}