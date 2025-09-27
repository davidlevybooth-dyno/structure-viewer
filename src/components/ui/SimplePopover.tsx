'use client'

import { Popover } from '@headlessui/react'
import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface SimplePopoverProps {
  trigger: ReactNode
  children: ReactNode
  className?: string
  align?: 'start' | 'center' | 'end'
}

export function SimplePopover({ trigger, children, className, align = 'center' }: SimplePopoverProps) {
  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0'
  }

  return (
    <Popover className="relative">
      <Popover.Button as="div">
        {trigger}
      </Popover.Button>

      <Popover.Panel 
        className={cn(
          'absolute z-50 mt-2 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg',
          alignmentClasses[align],
          className
        )}
      >
        {children}
      </Popover.Panel>
    </Popover>
  )
}
