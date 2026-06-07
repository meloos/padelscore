import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Trophy, Users } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <header className="glass border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-2 text-primary font-bold shrink-0">
            <ShieldCheck className="w-5 h-5" />
            Admin
          </div>
          <nav className="flex gap-1">
            {[
              { href: "/admin", label: "Tournaments", icon: Trophy },
              { href: "/admin/users", label: "Users", icon: Users },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                title={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>
          <Link
            href="/dashboard"
            className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            ← Back to app
          </Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
