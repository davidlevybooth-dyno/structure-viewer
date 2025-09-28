/**
 * Custom hook for managing keyboard shortcuts
 */

import { useEffect } from "react";
import { KeyboardShortcut } from "../types/ui";

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const metaMatch = shortcut.metaKey
          ? event.metaKey || event.ctrlKey
          : !event.metaKey && !event.ctrlKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (metaMatch && keyMatch) {
          // Special handling for search shortcut
          if (shortcut.key === "/") {
            const activeElement =
              document.activeElement?.tagName?.toLowerCase();
            if (activeElement === "input" || activeElement === "textarea") {
              continue;
            }
          }

          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
