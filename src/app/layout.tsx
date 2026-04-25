import "./globals.css";
import type { Metadata } from "next";
import SessionProvider from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "LogiCal",
  description: "Storage slot booking — customer and clerk workflows",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
