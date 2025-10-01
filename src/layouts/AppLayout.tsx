"use client";

import React from "react";

interface AppLayoutProps {
  children: React.ReactNode;
  maxWidth?: string;
}

export function AppLayout({ children, maxWidth = "1400px" }: AppLayoutProps) {
  return (
    <div className="h-screen w-full bg-zinc-50 text-zinc-900">
      <div className="mx-auto h-full" style={{ maxWidth }}>
        {children}
      </div>
    </div>
  );
}
