import { Navbar } from "@/components/layout/navbar";
import { version } from "../../../package.json";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">{children}</main>
      <footer className="max-w-6xl w-full mx-auto px-4 py-4 text-center">
        <p className="text-xs text-muted-foreground/50">v{version}</p>
      </footer>
    </div>
  );
}
