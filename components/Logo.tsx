import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-700 font-black tracking-tight text-white shadow-sm",
        className
      )}
    >
      <span className="leading-none">SC</span>
    </div>
  );
}

export function LogoBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-emerald-700",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-900" />
      <div className="absolute -left-12 top-1/3 h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="absolute -right-12 -bottom-12 h-56 w-56 rounded-full bg-emerald-300/30 blur-3xl" />
      <div className="absolute right-1/3 top-1/4 h-32 w-32 rounded-full bg-emerald-100/20 blur-2xl" />
      <div className="relative flex items-center justify-center gap-4 px-8 py-10 text-white">
        <span className="text-5xl font-black tracking-tighter">SC</span>
        <span className="text-3xl font-bold tracking-tight">LogiCal</span>
      </div>
    </div>
  );
}
