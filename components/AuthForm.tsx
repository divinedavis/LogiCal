"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Mode = "signin" | "signup";
type Role = "CUSTOMER" | "CLERK";

interface Props {
  mode: Mode;
  role: Role;
}

const roleConfig = {
  CUSTOMER: {
    title: "Customer",
    dashboard: "/customer/dashboard",
    altRoleHref: "/clerk",
    altRoleLabel: "Are you a clerk?",
  },
  CLERK: {
    title: "Clerk",
    dashboard: "/clerk/dashboard",
    altRoleHref: "/customer",
    altRoleLabel: "Are you a customer?",
  },
} as const;

export default function AuthForm({ mode, role }: Props) {
  const router = useRouter();
  const cfg = roleConfig[role];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [orgName, setOrgName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            firstName,
            lastName,
            phone,
            role,
            orgName: role === "CLERK" ? orgName : undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(formatError(data.error) || "Sign up failed");
        }
      }
      const signInRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
        expectedRole: role,
      });
      if (signInRes?.error) {
        throw new Error("Invalid credentials for this role");
      }
      router.push(cfg.dashboard);
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <Card>
        <CardHeader className="space-y-2">
          <Badge variant="secondary" className="w-fit">
            {cfg.title}
          </Badge>
          <CardTitle className="text-2xl">
            {mode === "signup"
              ? `Create ${cfg.title.toLowerCase()} account`
              : `${cfg.title} sign in`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name" value={firstName} onChange={setFirstName} required />
                  <Field label="Last name" value={lastName} onChange={setLastName} required />
                </div>
                <Field label="Phone (optional)" value={phone} onChange={setPhone} type="tel" />
                {role === "CLERK" && (
                  <Field
                    label="Organization name (optional)"
                    value={orgName}
                    onChange={setOrgName}
                    hint="Clerks sharing an email domain are grouped into one org."
                  />
                )}
              </>
            )}
            <Field label="Email" value={email} onChange={setEmail} type="email" required />
            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              type="password"
              required
            />

            {err && <p className="text-sm text-destructive">{err}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "…" : mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 flex justify-between text-sm text-muted-foreground">
            {mode === "signin" ? (
              <Link
                href={`/${role.toLowerCase()}/signup`}
                className="hover:text-foreground"
              >
                Need an account? Sign up
              </Link>
            ) : (
              <Link
                href={`/${role.toLowerCase()}/signin`}
                className="hover:text-foreground"
              >
                Have an account? Sign in
              </Link>
            )}
            <Link
              href={cfg.altRoleHref + "/signin"}
              className="hover:text-foreground"
            >
              {cfg.altRoleLabel}
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function formatError(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null) {
    const e = err as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
    const parts: string[] = [];
    if (e.formErrors?.length) parts.push(...e.formErrors);
    if (e.fieldErrors) {
      for (const [k, v] of Object.entries(e.fieldErrors)) {
        if (v?.length) parts.push(`${k}: ${v.join(", ")}`);
      }
    }
    if (parts.length) return parts.join("; ");
  }
  return String(err);
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
