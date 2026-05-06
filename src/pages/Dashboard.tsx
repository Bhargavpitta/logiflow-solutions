import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Download,
  FileText,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TopNav } from "@/components/TopNav";
import { OWNERSHIP, PACKAGES, VEHICLE_TYPES, formatINR } from "@/lib/billing";
import { exportToExcel, generateInvoicePDF, type EntryRow } from "@/lib/exporters";
import { apiFetch, type Entry } from "@/lib/api";

type DashboardEntry = EntryRow & Entry;

const Dashboard = ({ mode = "admin" }: { mode?: "admin" | "user" }) => {
  const { user, isAdmin, role, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<DashboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      nav("/auth");
      return;
    }
    if (mode === "admin" && role && !isAdmin) {
      nav("/my", { replace: true });
    }
    if (mode === "user" && isAdmin) {
      nav("/dashboard", { replace: true });
    }
  }, [user, role, isAdmin, authLoading, mode, nav]);

  useEffect(() => {
    if (user) load();
  }, [user, mode]);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<{ entries: DashboardEntry[] }>("/entries");
      const nextRows = mode === "user" ? data.entries.filter((entry) => entry.user_id === user!.id) : data.entries;
      setRows(nextRows);
    } catch (error: any) {
      toast.error(error.message ?? "Failed to load entries");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (from && r.logistics_date < from) return false;
      if (to && r.logistics_date > to) return false;
      if (q) {
        const s = q.toLowerCase();
        if (!r.driver_name.toLowerCase().includes(s) && !r.vehicle_number.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [rows, from, to, q]);

  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, r) => ({
          hours: acc.hours + Number(r.total_hours),
          km: acc.km + Number(r.total_km),
          extraHrs: acc.extraHrs + Number(r.extra_hours),
          extraKm: acc.extraKm + Number(r.extra_km),
          amount: acc.amount + Number(r.total_amount),
        }),
        { hours: 0, km: 0, extraHrs: 0, extraKm: 0, amount: 0 },
      ),
    [filtered],
  );

  const topDrivers = useMemo(() => {
    const grouped = new Map<string, { trips: number; amount: number; km: number }>();
    filtered.forEach((row) => {
      const current = grouped.get(row.driver_name) ?? { trips: 0, amount: 0, km: 0 };
      grouped.set(row.driver_name, {
        trips: current.trips + 1,
        amount: current.amount + Number(row.total_amount),
        km: current.km + Number(row.total_km),
      });
    });
    return [...grouped.entries()]
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  }, [filtered]);

  const recentTrips = useMemo(() => filtered.slice(0, 5), [filtered]);

  const remove = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await apiFetch(`/entries/${id}`, { method: "DELETE" });
      toast.success("Entry deleted");
      load();
    } catch (error: any) {
      toast.error(error.message ?? "Failed to delete entry");
    }
  };

  const isAdminMode = mode === "admin";

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="container space-y-6 py-8">
        <section className="section-shell">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div className="eyebrow">{isAdminMode ? "Operations dashboard" : "My trip workspace"}</div>
              <div>
                <h1 className="text-3xl font-extrabold lg:text-4xl">
                  {isAdminMode ? "Driver records and billing overview" : "Your trip records and billing history"}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {isAdminMode
                    ? "Monitor fleet activity, review driver submissions, generate invoices, and export clean records."
                    : "Track your submitted trips, review billing results, and update records when needed."}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[440px]">
              <Button asChild className="h-12 rounded-2xl">
                <Link to="/entry">
                  <Plus className="mr-1 h-4 w-4" /> New Entry
                </Link>
              </Button>
              {isAdminMode && (
                <>
                  <Button variant="outline" className="h-12 rounded-2xl" onClick={() => exportToExcel(filtered)}>
                    <Download className="mr-1 h-4 w-4" /> Export Excel
                  </Button>
                  <Button variant="outline" className="h-12 rounded-2xl" onClick={() => generateInvoicePDF(filtered, { from, to })}>
                    <FileText className="mr-1 h-4 w-4" /> Generate Invoice
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="grid dashboard-grid gap-4">
          <SummaryCard label="Visible entries" value={String(filtered.length)} note={`${rows.length} total records loaded`} icon={Truck} />
          <SummaryCard label="Invoice value" value={formatINR(totals.amount)} note="Calculated from filtered records" icon={TrendingUp} />
          <SummaryCard label="Total distance" value={`${totals.km.toFixed(0)} km`} note={`${totals.extraKm.toFixed(0)} km over package`} icon={Calendar} />
          <SummaryCard label="Total hours" value={`${totals.hours.toFixed(1)} hrs`} note={`${totals.extraHrs.toFixed(1)} hrs overtime`} icon={Filter} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="surface-card p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-sm font-semibold text-secondary dark:text-foreground">Filters</div>
                <p className="mt-1 text-sm text-muted-foreground">Review the exact trips you want before exporting or invoicing.</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {filtered.length} of {rows.length} entries shown
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-[160px_160px_1fr_auto]">
              <FilterField label="From">
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-11 rounded-2xl" />
              </FilterField>
              <FilterField label="To">
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-11 rounded-2xl" />
              </FilterField>
              <FilterField label="Search">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Driver or vehicle number"
                    className="h-11 rounded-2xl pl-9"
                  />
                </div>
              </FilterField>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  className="h-11 rounded-2xl"
                  onClick={() => {
                    setFrom("");
                    setTo("");
                    setQ("");
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>

          <div className="surface-card p-5 sm:p-6">
            <div className="text-sm font-semibold text-secondary dark:text-foreground">Export section</div>
            <p className="mt-1 text-sm text-muted-foreground">Keep exports and invoice generation close to the filtered dataset.</p>

            <div className="mt-5 space-y-3">
              <ActionPanel
                title="Excel export"
                desc="Download current results for finance, audit, or reconciliation."
                action="Export"
                onClick={() => exportToExcel(filtered)}
                icon={Download}
              />
              <ActionPanel
                title="Invoice PDF"
                desc="Generate a professional invoice summary for the visible records."
                action="Generate"
                onClick={() => generateInvoicePDF(filtered, { from, to })}
                icon={FileText}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="surface-card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-secondary dark:text-foreground">Driver analytics</div>
                <p className="mt-1 text-sm text-muted-foreground">Highest value contributors across the current filter.</p>
              </div>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-5 space-y-4">
              {topDrivers.length === 0 ? (
                <EmptyState text="No driver analytics available yet." />
              ) : (
                topDrivers.map((driver) => (
                  <div key={driver.name} className="surface-muted flex items-center justify-between p-4">
                    <div>
                      <div className="font-semibold">{driver.name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {driver.trips} trip{driver.trips > 1 ? "s" : ""} • {driver.km.toFixed(0)} km
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-secondary dark:text-foreground">{formatINR(driver.amount)}</div>
                      <div className="text-xs text-muted-foreground">current billed amount</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="surface-card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-secondary dark:text-foreground">Recent trips</div>
                <p className="mt-1 text-sm text-muted-foreground">A quick snapshot of the latest visible records.</p>
              </div>
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-5 space-y-3">
              {recentTrips.length === 0 ? (
                <EmptyState text="No trips available yet." />
              ) : (
                recentTrips.map((trip) => (
                  <div key={trip.id} className="surface-muted flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold">{trip.driver_name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {trip.logistics_date} • {trip.vehicle_number} • {PACKAGES[trip.package_hours_id]?.label}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-secondary dark:text-foreground">{formatINR(Number(trip.total_amount))}</div>
                      <div className="text-xs text-muted-foreground">{Number(trip.total_km).toFixed(0)} km</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-lg font-bold">All trip records</h2>
              <p className="text-sm text-muted-foreground">Detailed table with edit, delete, and invoice actions.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1320px] text-sm">
              <thead className="bg-accent/50">
                <tr className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  <Th>Date</Th>
                  <Th>Driver</Th>
                  <Th>Contact</Th>
                  <Th>Vehicle</Th>
                  <Th>Model</Th>
                  <Th>Type</Th>
                  <Th>Pkg</Th>
                  <Th>Owner</Th>
                  <Th right>Start KM</Th>
                  <Th right>Close KM</Th>
                  <Th>Start</Th>
                  <Th>End</Th>
                  <Th right>Total Hrs</Th>
                  <Th right>Total KM</Th>
                  <Th right>Extra Hrs</Th>
                  <Th right>Extra KM</Th>
                  <Th right>Amount</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={18} className="py-16 text-center text-muted-foreground">
                      Loading entries...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={18} className="py-16 text-center">
                      <div className="mb-3 text-muted-foreground">No entries available for the current filter.</div>
                      <Button asChild size="sm" className="rounded-full">
                        <Link to="/entry">Create first entry</Link>
                      </Button>
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 transition-colors hover:bg-accent/35">
                      <Td mono>{r.logistics_date}</Td>
                      <Td>
                        <div className="font-semibold">{r.driver_name}</div>
                      </Td>
                      <Td className="text-muted-foreground">{r.contact_number ?? "-"}</Td>
                      <Td mono>{r.vehicle_number}</Td>
                      <Td className="text-muted-foreground">{r.vehicle_model}</Td>
                      <Td>{VEHICLE_TYPES[r.vehicle_type_id]}</Td>
                      <Td className="text-muted-foreground">{PACKAGES[r.package_hours_id]?.label}</Td>
                      <Td>{OWNERSHIP[r.ownership_id]}</Td>
                      <Td right mono>{r.starting_meter}</Td>
                      <Td right mono>{r.closing_meter}</Td>
                      <Td mono>{String(r.starting_time).slice(0, 5)}</Td>
                      <Td mono>{String(r.closing_time).slice(0, 5)}</Td>
                      <Td right mono className="font-semibold">{Number(r.total_hours).toFixed(1)}</Td>
                      <Td right mono className="font-semibold">{Number(r.total_km).toFixed(0)}</Td>
                      <Td right mono className={Number(r.extra_hours) > 0 ? "font-semibold text-tertiary" : "text-muted-foreground"}>
                        {Number(r.extra_hours).toFixed(1)}
                      </Td>
                      <Td right mono className={Number(r.extra_km) > 0 ? "font-semibold text-tertiary" : "text-muted-foreground"}>
                        {Number(r.extra_km).toFixed(0)}
                      </Td>
                      <Td right className="font-bold text-secondary dark:text-foreground">{formatINR(Number(r.total_amount))}</Td>
                      <Td>
                        <div className="flex gap-1">
                          {(r.user_id === user?.id || isAdminMode) && (
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full" title="Edit">
                              <Link to={`/entry/${r.id}`}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          )}
                          {isAdminMode && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:text-destructive"
                              onClick={() => remove(r.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {isAdminMode && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:text-primary"
                              onClick={() => generateInvoicePDF([r])}
                              title="Invoice"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot className="bg-accent/60">
                  <tr className="border-t border-border/80">
                    <Td colSpan={12} className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Totals
                    </Td>
                    <Td right mono className="font-bold">{totals.hours.toFixed(1)}</Td>
                    <Td right mono className="font-bold">{totals.km.toFixed(0)}</Td>
                    <Td right mono className="font-bold text-tertiary">{totals.extraHrs.toFixed(1)}</Td>
                    <Td right mono className="font-bold text-tertiary">{totals.extraKm.toFixed(0)}</Td>
                    <Td right className="text-base font-bold text-secondary dark:text-foreground">{formatINR(totals.amount)}</Td>
                    <Td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

const SummaryCard = ({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Truck;
}) => (
  <div className="surface-card p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div className="mt-3 text-3xl font-extrabold text-secondary dark:text-foreground">{value}</div>
        <div className="mt-2 text-sm text-muted-foreground">{note}</div>
      </div>
      <div className="rounded-2xl bg-primary/10 p-3 text-primary">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const FilterField = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="space-y-2">
    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</label>
    {children}
  </div>
);

const ActionPanel = ({
  title,
  desc,
  action,
  onClick,
  icon: Icon,
}: {
  title: string;
  desc: string;
  action: string;
  onClick: () => void;
  icon: typeof Download;
}) => (
  <div className="surface-muted flex items-center justify-between gap-4 p-4">
    <div className="flex items-start gap-3">
      <div className="rounded-2xl bg-card p-3 text-primary shadow-[var(--shadow-soft)]">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
      </div>
    </div>
    <Button variant="outline" className="rounded-full" onClick={onClick}>
      {action}
    </Button>
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="surface-muted p-4 text-sm text-muted-foreground">{text}</div>
);

const Th = ({ children, right }: { children: ReactNode; right?: boolean }) => (
  <th className={`whitespace-nowrap px-4 py-4 font-semibold ${right ? "text-right" : "text-left"}`}>{children}</th>
);

const Td = ({ children, right, mono, className = "", colSpan }: any) => (
  <td
    colSpan={colSpan}
    className={`whitespace-nowrap px-4 py-3 ${right ? "text-right" : ""} ${mono ? "font-mono" : ""} ${className}`}
  >
    {children}
  </td>
);

export default Dashboard;
