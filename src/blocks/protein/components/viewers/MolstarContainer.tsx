import { forwardRef } from "react";

interface MolstarContainerProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Container component for Molstar plugin
 * Provides the DOM element where Molstar will mount
 */
export const MolstarContainer = forwardRef<
  HTMLDivElement,
  MolstarContainerProps
>(({ className = "", style }, ref) => {
  const defaultStyle: React.CSSProperties = {
    minHeight: "400px",
    width: "100%",
    height: "100%",
    ...style,
  };

  return (
    <div
      ref={ref}
      className={`molstar-container ${className}`}
      style={defaultStyle}
      role="application"
      aria-label="Molecular structure viewer"
    />
  );
});

MolstarContainer.displayName = "MolstarContainer";
