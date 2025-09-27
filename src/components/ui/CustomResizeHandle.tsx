'use client'

import { PanelResizeHandle } from "react-resizable-panels"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "../../lib/utils"

interface CustomResizeHandleProps {
  className?: string
}

export function CustomResizeHandle({ className }: CustomResizeHandleProps) {
  return (
    <PanelResizeHandle 
      className={cn(
        "group relative w-5 cursor-col-resize transition-all duration-300", // 20px width (w-5 = 20px)
        // Clean solid background with hover effects
        "bg-zinc-100/50",
        "hover:bg-blue-50",
        "active:bg-blue-100",
        className
      )}
    >
      {/* Chevron icons indicating sliding direction */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center opacity-0 group-hover:opacity-70 transition-all duration-300">
        <ChevronLeft className="h-3 w-3 text-zinc-400 -mr-1" />
        <ChevronRight className="h-3 w-3 text-zinc-400" />
      </div>
      
      {/* Subtle center line that appears on hover */}
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-zinc-300/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </PanelResizeHandle>
  )
}
