import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, FileSpreadsheet, Gauge, Lock, MapPin, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopNav } from '@/components/TopNav';
import { HeroScene } from '@/components/HeroScene';
import innovaHero from '@/assets/innova-hero.jpg';

const Index = () => {
  return (
    <div className="min-h-screen">
      <TopNav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="container relative grid lg:grid-cols-2 gap-12 py-20 lg:py-28 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 glass px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-tertiary animate-pulse-glow" />
              V2.0 ORCHESTRATION ENGINE LIVE
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              Command your <span className="text-gradient">fleet</span> with architect-level precision.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              LogiTrack Pro replaces fragmented Excel sheets with a unified command center. Real-time
              Innova Crysta billing, automated invoices, and admin-grade visibility — built for scale.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-primary shadow-glow text-base h-12 px-6">
                <Link to="/auth">Get Started <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="glass text-base h-12 px-6">
                <Link to="/auth">Request Demo</Link>
              </Button>
            </div>
            <div className="flex gap-6 pt-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <span><span className="text-tertiary">●</span> SYS_CORE_ONLINE</span>
              <span><span className="text-tertiary">●</span> FLEET_SYNC_ACTIVE</span>
            </div>
          </div>

          <div className="relative aspect-square lg:aspect-[4/5] glass-strong rounded-3xl overflow-hidden animate-scale-in">
            <div className="absolute inset-0">
              <HeroScene />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
              <div className="glass rounded-2xl overflow-hidden">
                <img
                  src={innovaHero}
                  alt="Toyota Innova Crysta — premium fleet vehicle"
                  width={1536}
                  height={1024}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Active Vehicle</div>
                    <div className="font-semibold">Innova Crysta · Fleet Tier 1</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-tertiary">● ROUTING</div>
                    <div className="text-xs text-muted-foreground">12ms latency</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container py-20 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-primary">Capabilities</div>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">
            Evolve past <span className="text-gradient">static spreadsheets.</span>
          </h2>
          <p className="text-muted-foreground">
            Traditional Excel can't handle the dynamic, multi-variable chaos of modern logistics.
            LogiTrack Pro structurally transforms flat data into active, interconnected operations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: MapPin, title: 'Real-Time Trip Tracking', desc: 'Capture every meter, hour, and vehicle assignment with sub-second precision.' },
            { icon: Gauge, title: 'Automated Billing Engine', desc: 'Innova Crysta pricing computed instantly — base + extra hours + extra km.' },
            { icon: Receipt, title: 'One-Click Invoices', desc: 'Generate professional PDF invoices for any date range with grand totals.' },
            { icon: FileSpreadsheet, title: 'Excel Export', desc: 'Export filtered logistics records as native .xlsx for finance teams.' },
            { icon: BarChart3, title: 'Admin Insights', desc: 'Cross-driver analytics, date-range filters, and full audit trails.' },
            { icon: Lock, title: 'Role-Based Access', desc: 'Zero-trust architecture: USER and ADMIN roles enforced at the database.' },
          ].map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
              <div className="h-11 w-11 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 shadow-glow">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <div className="glass-strong rounded-3xl p-10 lg:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero opacity-60 pointer-events-none" />
          <div className="relative space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-5xl font-bold tracking-tight">
              Ready to retire your <span className="line-through text-muted-foreground">spreadsheets</span>?
            </h2>
            <p className="text-muted-foreground">
              Sign up free, log your first trip, and watch the billing calculate itself.
            </p>
            <Button asChild size="lg" className="bg-gradient-primary shadow-glow h-12 px-8">
              <Link to="/auth">Launch Console <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="container py-8 text-sm text-muted-foreground flex justify-between">
        <span>LogiTrack Pro © 2026</span>
        <span className="font-mono">v2.4.1</span>
      </footer>
    </div>
  );
};

export default Index;
