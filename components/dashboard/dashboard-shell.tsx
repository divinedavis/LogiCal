"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface Props {
  children: React.ReactNode;
  onSearchClick?: () => void;
}

export function DashboardShell({ children, onSearchClick }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSearchClick={onSearchClick}
      />
      <div className="lg:pl-20">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        {children}
      </div>
    </div>
  );
}
