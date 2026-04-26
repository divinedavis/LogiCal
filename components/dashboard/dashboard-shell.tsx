"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface Props {
  children: React.ReactNode;
  onSearchClick?: () => void;
  onExportClick?: () => void;
  onSlotsClick?: () => void;
}

export function DashboardShell({
  children,
  onSearchClick,
  onExportClick,
  onSlotsClick,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background lg:h-screen lg:min-h-0 lg:overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSearchClick={onSearchClick}
        onExportClick={onExportClick}
        onSlotsClick={onSlotsClick}
      />
      <div className="flex min-h-screen flex-col lg:h-full lg:min-h-0 lg:pl-20">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        {children}
      </div>
    </div>
  );
}
