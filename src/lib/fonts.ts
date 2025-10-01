import { Geist, Geist_Mono } from "next/font/google";

/**
 * Font configurations for the application
 * Centralized font setup for consistency and reusability
 */

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Optimize font loading
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // Optimize font loading
});

/**
 * Combined font class names for easy application
 * Usage: <body className={fontVariables}>
 */
export const fontVariables = `${geistSans.variable} ${geistMono.variable}`;
