import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Dna, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Dna className="h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight">Frontend DNA</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> New Project
            </Button>
          </Link>
          <UserButton />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
