import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chaperone",
  description: "Protein structure viewer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Molstar CSS */}
        <link
          rel="stylesheet"
          type="text/css"
          href="https://cdn.jsdelivr.net/npm/molstar@latest/build/viewer/molstar.css"
        />
      </head>
      <body className={`${fontVariables} antialiased`}>{children}</body>
    </html>
  );
}
