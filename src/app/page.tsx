import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dna, Pipette, Code, Download, ArrowRight } from "lucide-react";

export default function LandingPage() {

  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Dna className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg tracking-tight">Frontend DNA</span>
        </div>
        <div>
          <Link href="/dashboard">
            <Button>Dashboard <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
          </div>

          <div className="max-w-4xl mx-auto px-6 py-24 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-muted/50 text-sm text-muted-foreground mb-8">
              <Dna className="h-3.5 w-3.5" />
              Extract. Generate. Build.
            </div>

            <h1 className="text-5xl font-bold tracking-tight leading-tight mb-6">
              Extract the DNA of any website&apos;s design system
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Scrape live websites to extract typography, colors, spacing, shadows, and
              motion tokens. Generate a structured prompt that makes Claude Code
              replicate the design with pixel-perfect fidelity.
            </p>

            <div className="flex gap-4 justify-center">
              <Link href="/dashboard/new">
                <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20">
                  Start Extracting <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Pipette className="h-5 w-5" />}
              title="Deep Extraction"
              description="Headless browser renders the page fully, then extracts computed styles — not just CSS files. Gets the real values the browser uses."
            />
            <FeatureCard
              icon={<Code className="h-5 w-5" />}
              title="Ground Truth Prompt"
              description="Generated markdown establishes scraped tokens as the absolute design authority. No more AI-generated purple gradients or default Inter font."
            />
            <FeatureCard
              icon={<Download className="h-5 w-5" />}
              title="Multi-URL Aggregation"
              description="Scrape a homepage, dashboard, and pricing page. Tokens are merged into a single unified design system with conflict resolution."
            />
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border/50 bg-muted/30">
          <div className="max-w-4xl mx-auto px-6 py-20">
            <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
            <div className="grid md:grid-cols-3 gap-10">
              <Step number={1} title="Paste URLs" description="Add one or more website URLs you want to extract design tokens from." />
              <Step number={2} title="Extract Tokens" description="A headless browser scrapes CSS variables, computed styles, typography, colors, spacing, shadows, and more." />
              <Step number={3} title="Get Your Prompt" description="Download a structured Markdown file optimized for Claude Code that enforces your scraped design as ground truth." />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Dna className="h-4 w-4" />
            Frontend DNA
          </div>
          <p>Built for developers who refuse generic AI aesthetics.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
        {number}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}
