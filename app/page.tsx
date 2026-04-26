import Link from "next/link";
import { ArrowRight, Calendar, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoBanner } from "@/components/Logo";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16">
      <LogoBanner className="w-full max-w-2xl" />
      <p className="mt-6 text-lg text-muted-foreground">
        Slotting calendar for warehouse and storage clerks.
      </p>

      <div className="mt-12 grid w-full gap-6 sm:grid-cols-2">
        <Card className="transition hover:border-primary hover:shadow-md">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>I'm a clerk</CardTitle>
            <CardDescription>
              Manage your org's slotting calendar. Create, edit, and search slots across day,
              week, and month views.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button asChild>
              <Link href="/clerk/signin">
                Sign in <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/clerk/signup">Sign up</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="transition hover:border-primary hover:shadow-md">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>I'm a customer</CardTitle>
            <CardDescription>
              Browse open dates, place a hold on a storage slot, and chat with the clerk.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button asChild>
              <Link href="/customer/signin">
                Sign in <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/customer/signup">Sign up</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
