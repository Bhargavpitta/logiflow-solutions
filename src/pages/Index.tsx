import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  FileSpreadsheet,
  Gauge,
  Lock,
  MapPin,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/TopNav";
import { HeroScene } from "@/components/HeroScene";

const features = [
  {
    icon: MapPin,
    title: "Trip capture without manual cleanup",
    desc: "Store route, meter, time, and vehicle details in a structured flow that finance and ops can both trust.",
  },
  {
    icon: Gauge,
    title: "Instant Innova Crysta billing",
    desc: "Base package, extra hour, and extra kilometer pricing are calculated automatically as drivers submit trips.",
  },
  {
    icon: Receipt,
    title: "Faster invoice generation",
    desc: "Create polished invoice exports for a single trip or a full date range without retyping totals.",
  },
  {
    icon: FileSpreadsheet,
    title: "Finance-friendly exports",
    desc: "Send clean Excel files to billing and accounts teams with the fields they already work with.",
  },
  {
    icon: BarChart3,
    title: "Operational visibility",
    desc: "Track volume, revenue, overtime, and driver movement from a dashboard built for daily review.",
  },
  {
    icon: Lock,
    title: "Controlled access by role",
    desc: "Users see and manage their own entries, while administrators retain full operational oversight.",
  },
];

const pricing = [
  { label: "8 hrs / 80 km", amount: "₹3,500", note: "Short city movements and airport runs" },
  { label: "12 hrs / 120 km", amount: "₹5,000", note: "Most common corporate booking slab" },
  { label: "16 hrs / 160 km", amount: "₹6,500", note: "Longer duty windows with built-in flexibility" },
];

const Index = () => {
  return (
    <div className="min-h-screen">
      <TopNav />

      <section className="relative overflow-hidden">
        <div className="relative min-h-[640px] sm:min-h-[680px] lg:min-h-[720px]">
          <HeroScene />
          <div className="relative z-10 flex min-h-[640px] items-center sm:min-h-[680px] lg:min-h-[720px]">
            <div className="container py-10 sm:py-14 lg:py-16">
              <div className="max-w-[340px] px-1 text-white sm:max-w-[420px] lg:max-w-[520px]">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/95 backdrop-blur">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    OneHmt Logistics Platform
                  </span>
                  <span className="hidden rounded-full border border-white/18 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/90 backdrop-blur sm:inline-flex">
                    Innova Crysta Fleet
                  </span>
                </div>

                <h1 className="max-w-[8ch] text-[2.5rem] font-extrabold leading-[0.95] tracking-[-0.04em] text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.45)] sm:text-[3.75rem] lg:text-[5.25rem]">
                  Fleet operations, billing, and reporting in one reliable workspace.
                </h1>

                <p className="mt-4 max-w-md text-sm leading-6 text-white/95 drop-shadow-[0_2px_18px_rgba(0,0,0,0.35)] sm:mt-5 sm:max-w-lg sm:text-lg sm:leading-8">
                  Replace scattered sheets with a clean logistics workflow for real dispatch teams, billing review,
                  invoice exports, and day-to-day trip visibility.
                </p>

                <div className="mt-5 flex flex-wrap gap-3 sm:mt-7">
                  <Button asChild size="lg" className="h-12 rounded-full px-6">
                    <Link to="/auth">
                      Open workspace <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="hidden h-12 rounded-full border-white/20 bg-white/10 px-6 text-white backdrop-blur hover:bg-white/16 hover:text-white sm:inline-flex"
                  >
                    <Link to="/auth">Request a walkthrough</Link>
                  </Button>
                </div>

                <div className="mt-6 hidden flex-wrap gap-3 text-xs font-medium uppercase tracking-[0.18em] text-white/88 sm:flex">
                  <span className="rounded-full border border-white/14 bg-white/8 px-3 py-1.5 backdrop-blur">
                    4 Innova variants
                  </span>
                  <span className="rounded-full border border-white/14 bg-white/8 px-3 py-1.5 backdrop-blur">
                    Automated billing
                  </span>
                  <span className="rounded-full border border-white/14 bg-white/8 px-3 py-1.5 backdrop-blur">
                    Excel and PDF exports
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-10">
        <div className="space-y-4">
          <div className="eyebrow">Core capabilities</div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-2xl text-3xl font-bold sm:text-4xl">Everything needed to run daily logistics billing cleanly.</h2>
            <p className="max-w-xl text-muted-foreground">
              A practical UI for dispatchers, operations managers, and admins working on recurring Innova Crysta trips.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="surface-card p-6 transition-transform duration-200 hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-10">
        <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="surface-card p-6 sm:p-8">
            <div className="eyebrow">Pricing logic</div>
            <h2 className="mt-4 text-3xl font-bold">Package slabs your team already understands.</h2>
            <p className="mt-3 text-muted-foreground">
              The system keeps pricing straightforward: defined duty slabs, automatic overage handling, and totals that
              match what gets exported.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {pricing.map((plan) => (
              <div key={plan.label} className="surface-muted p-5">
                <div className="text-sm font-semibold text-muted-foreground">{plan.label}</div>
                <div className="mt-3 text-3xl font-extrabold text-secondary">{plan.amount}</div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{plan.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-10">
        <div className="section-shell overflow-hidden">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="eyebrow">Ready to launch</div>
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Move from spreadsheet dependency to a proper operating flow.</h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Sign in, record a trip, and start generating cleaner data for billing, trip review, and fleet reporting.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 rounded-full px-6">
                <Link to="/auth">Get started</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6">
                <Link to="/auth">See login flow</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="container py-10">
        <div className="grid gap-6 border-t border-border/70 pt-6 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="text-lg font-extrabold text-secondary">OneHmt Logistics</div>
            <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              Purpose-built trip management and billing for teams moving people, vehicles, and invoices every day.
            </p>
          </div>
          <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
            <div>
              <div className="font-semibold text-foreground">Platform</div>
              <div className="mt-2">Trip entry</div>
              <div>Analytics dashboard</div>
              <div>Invoice exports</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">Build</div>
              <div className="mt-2">React + Vite frontend</div>
              <div>Node + PostgreSQL backend</div>
              <div>© 2026 OneHmt</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
