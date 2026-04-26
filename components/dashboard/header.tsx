"use client";

import { Menu } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data } = useSession();
  const user = data?.user;
  const initials =
    user?.name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "L";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 p-4">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <h1 className="font-semibold text-foreground md:hidden">LogiCal</h1>

        <div className="hidden items-center gap-3 md:flex">
          <h1 className="text-lg font-semibold text-foreground">Calendar</h1>
          {user?.clerkOrgDomain && (
            <Badge variant="secondary" className="font-mono text-xs">
              {user.clerkOrgDomain}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden text-right text-sm leading-tight sm:block">
              <div className="font-medium text-foreground">{user.name}</div>
              <div className="text-xs text-muted-foreground">
                {user.role}
              </div>
            </div>
          )}
          <Avatar className="h-9 w-9 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign out
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
