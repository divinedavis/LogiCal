"use client";

import { Calendar, LayoutGrid, Search, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { icon: Calendar, label: "Calendar", active: true },
  { icon: LayoutGrid, label: "Slots" },
  { icon: Search, label: "Find" },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full border-r border-border bg-card transition-transform duration-300",
          "w-64 lg:w-20",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col p-4">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">L</span>
              </div>
              <span className="font-semibold text-foreground lg:hidden">LogiCal</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-colors",
                  "hover:bg-muted",
                  item.active && "bg-muted text-primary"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="lg:hidden">{item.label}</span>
              </button>
            ))}
          </nav>

          <button className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted">
            <Settings className="h-5 w-5 shrink-0" />
            <span className="lg:hidden">Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}
