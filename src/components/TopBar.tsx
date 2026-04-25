"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function TopBar() {
  const { data } = useSession();
  const user = data?.user;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-bold">
          LogiCal
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-600">
          {user && (
            <>
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>{user.name}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs uppercase tracking-wide text-slate-600">
                  {user.role}
                </span>
                {user.clerkOrgDomain && (
                  <span className="hidden text-xs text-slate-500 sm:inline">
                    @{user.clerkOrgDomain}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-lg border border-slate-300 px-3 py-1 hover:bg-slate-50"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
