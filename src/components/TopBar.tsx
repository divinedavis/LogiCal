"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function TopBar() {
  const { data } = useSession();
  const user = data?.user;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="text-lg font-bold">
          LogiCal
        </Link>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          {user && (
            <>
              <span>
                {user.name}{" "}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs uppercase tracking-wide text-slate-600">
                  {user.role}
                </span>
                {user.clerkOrgDomain && (
                  <span className="ml-2 text-xs text-slate-500">@{user.clerkOrgDomain}</span>
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
