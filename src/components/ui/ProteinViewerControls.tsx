"use client"

import React, { useState } from "react"
import { ChevronDown, Settings } from "lucide-react"
import { cls } from "./utils"

function DropdownMenu({ trigger, children, isOpen, onToggle }) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {trigger}
        <ChevronDown className={cls("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 min-w-[180px] rounded-md border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          {children}
        </div>
      )}
    </div>
  )
}

function DropdownItem({ children, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cls(
        "w-full rounded-sm px-2.5 py-1.5 text-left text-sm transition-colors",
        disabled
          ? "text-zinc-400 dark:text-zinc-600"
          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
      )}
    >
      {children}
    </button>
  )
}

export default function ProteinViewerControls() {
  const [openDropdown, setOpenDropdown] = useState(null)
  const [viewMode, setViewMode] = useState("Cartoon")
  const [colorScheme, setColorScheme] = useState("By Chain")
  const [representation, setRepresentation] = useState("Ribbon")

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name)
  }

  const closeDropdowns = () => setOpenDropdown(null)

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest("[data-dropdown]")) {
        closeDropdowns()
      }
    }
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  return (
    <div className="border-b border-zinc-200/60 bg-white px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <option>GPT-5</option>
            <option>GPT-4</option>
            <option>Claude-3</option>
          </select>
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Protein Structure Controls</span>
        </div>

        <div className="flex items-center gap-1" data-dropdown>
          {/* View Mode Dropdown */}
          <DropdownMenu
            trigger={<>View: {viewMode}</>}
            isOpen={openDropdown === "view"}
            onToggle={() => toggleDropdown("view")}
          >
            <DropdownItem
              onClick={() => {
                setViewMode("Cartoon")
                closeDropdowns()
              }}
            >
              Cartoon
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                setViewMode("Surface")
                closeDropdowns()
              }}
            >
              Surface
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                setViewMode("Ball & Stick")
                closeDropdowns()
              }}
            >
              Ball & Stick
            </DropdownItem>
          </DropdownMenu>

          {/* Color Scheme Dropdown */}
          <DropdownMenu
            trigger={<>Color: {colorScheme}</>}
            isOpen={openDropdown === "color"}
            onToggle={() => toggleDropdown("color")}
          >
            <DropdownItem
              onClick={() => {
                setColorScheme("By Chain")
                closeDropdowns()
              }}
            >
              By Chain
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                setColorScheme("By Element")
                closeDropdowns()
              }}
            >
              By Element
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                setColorScheme("By Secondary Structure")
                closeDropdowns()
              }}
            >
              By Secondary Structure
            </DropdownItem>
          </DropdownMenu>

          {/* Representation Dropdown */}
          <DropdownMenu
            trigger={<>Style: {representation}</>}
            isOpen={openDropdown === "representation"}
            onToggle={() => toggleDropdown("representation")}
          >
            <DropdownItem
              onClick={() => {
                setRepresentation("Ribbon")
                closeDropdowns()
              }}
            >
              Ribbon
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                setRepresentation("Tube")
                closeDropdowns()
              }}
            >
              Tube
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                setRepresentation("Trace")
                closeDropdowns()
              }}
            >
              Trace
            </DropdownItem>
          </DropdownMenu>

          {/* Settings Dropdown */}
          <DropdownMenu
            trigger={
              <>
                <Settings className="h-4 w-4" />
                Settings
              </>
            }
            isOpen={openDropdown === "settings"}
            onToggle={() => toggleDropdown("settings")}
          >
            <DropdownItem onClick={closeDropdowns}>Show Hydrogen Bonds</DropdownItem>
            <DropdownItem onClick={closeDropdowns}>Show Water Molecules</DropdownItem>
            <DropdownItem onClick={closeDropdowns}>Show Ligands</DropdownItem>
            <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />
            <DropdownItem onClick={closeDropdowns}>Animation Settings</DropdownItem>
            <DropdownItem onClick={closeDropdowns}>Quality Settings</DropdownItem>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
