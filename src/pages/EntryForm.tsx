import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { ChevronLeft, Clock3, Route, Save, Truck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TopNav } from "@/components/TopNav";
import { calculateBilling, formatINR, OWNERSHIP, PACKAGES, VEHICLE_TYPES } from "@/lib/billing";
import { apiFetch, type Entry, type EntryPayload } from "@/lib/api";

const schema = z.object({
  driver_name: z.string().trim().min(1).max(100),
  contact_number: z.string().trim().max(20).optional().or(z.literal("")),
  vehicle_number: z.string().trim().min(1).max(20),
  vehicle_model: z.string().trim().min(1).max(50),
  vehicle_type_id: z.number().int().min(1),
  package_hours_id: z.number().int().min(1).max(4),
  ownership_id: z.number().int().min(1).max(3),
  logistics_date: z.string().min(1),
  starting_meter: z.number().int().min(0),
  closing_meter: z.number().int().min(0),
  starting_time: z.string().min(1),
  closing_time: z.string().min(1),
});

const initial = {
  driver_name: "",
  contact_number: "",
  vehicle_number: "",
  vehicle_model: "Innova Crysta",
  vehicle_type_id: 1,
  package_hours_id: 1,
  ownership_id: 1,
  logistics_date: new Date().toISOString().slice(0, 10),
  starting_meter: 0,
  closing_meter: 0,
  starting_time: "",
  closing_time: "",
};

const EntryForm = () => {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) nav("/auth");
  }, [user, authLoading, nav]);

  useEffect(() => {
    if (!id) return;
    apiFetch<{ entry: Entry }>(`/entries/${id}`)
      .then(({ entry: data }) => {
        setForm({
          driver_name: data.driver_name,
          contact_number: data.contact_number ?? "",
          vehicle_number: data.vehicle_number,
          vehicle_model: data.vehicle_model,
          vehicle_type_id: data.vehicle_type_id,
          package_hours_id: data.package_hours_id,
          ownership_id: data.ownership_id,
          logistics_date: data.logistics_date,
          starting_meter: data.starting_meter,
          closing_meter: data.closing_meter,
          starting_time: data.starting_time?.slice(0, 5) ?? "",
          closing_time: data.closing_time?.slice(0, 5) ?? "",
        });
      })
      .catch((error: any) => {
        toast.error(error.message ?? "Failed to load entry");
        nav(user?.role === "admin" ? "/dashboard" : "/my");
      });
  }, [id, nav, user?.role]);

  const billing = useMemo(
    () =>
      calculateBilling({
        packageId: form.package_hours_id,
        startingMeter: form.starting_meter,
        closingMeter: form.closing_meter,
        startingTime: form.starting_time,
        closingTime: form.closing_time,
      }),
    [form],
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      schema.parse(form);
      const payload: EntryPayload = {
        ...form,
        contact_number: form.contact_number || null,
        total_km: billing.totalKm,
        total_hours: billing.totalHours,
        extra_km: billing.extraKm,
        extra_hours: billing.extraHours,
        total_amount: billing.totalAmount,
      };

      if (id) {
        await apiFetch(`/entries/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/entries", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      toast.success(id ? "Entry updated" : "Entry saved");
      nav(user?.role === "admin" ? "/dashboard" : "/my");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="container space-y-6 py-8">
        <Button variant="ghost" size="sm" onClick={() => nav(-1)} className="gap-1 rounded-full">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>

        <section className="section-shell">
          <div className="space-y-3">
            <div className="eyebrow">
              <Truck className="h-3.5 w-3.5" />
              {id ? "Edit trip entry" : "New trip entry"}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold lg:text-4xl">Trip details and billing input</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Fill the complete form at once, review the billing preview on the side, and save the entry without
                changing the existing trip calculation flow.
              </p>
            </div>
          </div>
        </section>

        <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="surface-card p-6 sm:p-8">
            <div className="space-y-8">
              <Section title="Driver and vehicle" description="Basic assignment details used in the dashboard, exports, and invoices.">
                <Field label="Driver Name">
                  <Input
                    required
                    value={form.driver_name}
                    onChange={(e) => setForm({ ...form, driver_name: e.target.value })}
                    placeholder="e.g. Rakesh Kumar"
                    className="h-12 rounded-2xl"
                  />
                </Field>
                <Field label="Contact Number">
                  <Input
                    value={form.contact_number}
                    onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="h-12 rounded-2xl"
                  />
                </Field>
                <Field label="Vehicle Number">
                  <Input
                    required
                    value={form.vehicle_number}
                    onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })}
                    placeholder="TS-09-AB-1234"
                    className="h-12 rounded-2xl"
                  />
                </Field>
                <Field label="Vehicle Model">
                  <Input
                    required
                    value={form.vehicle_model}
                    onChange={(e) => setForm({ ...form, vehicle_model: e.target.value })}
                    className="h-12 rounded-2xl"
                  />
                </Field>
              </Section>

              <Section title="Vehicle package and ownership" description="Package and vehicle details used in calculation and reporting.">
                <Field label="Vehicle Type">
                  <Select value={String(form.vehicle_type_id)} onValueChange={(v) => setForm({ ...form, vehicle_type_id: +v })}>
                    <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(VEHICLE_TYPES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Package Hours">
                  <Select value={String(form.package_hours_id)} onValueChange={(v) => setForm({ ...form, package_hours_id: +v })}>
                    <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PACKAGES).map(([k, p]) => (
                        <SelectItem key={k} value={k}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Ownership">
                  <Select value={String(form.ownership_id)} onValueChange={(v) => setForm({ ...form, ownership_id: +v })}>
                    <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(OWNERSHIP).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Logistics Date">
                  <Input
                    required
                    type="date"
                    value={form.logistics_date}
                    onChange={(e) => setForm({ ...form, logistics_date: e.target.value })}
                    className="h-12 rounded-2xl"
                  />
                </Field>
              </Section>

              <Section title="Trip metrics" description="Meter and duty timings feed the exact billing values sent to the backend.">
                <Field label="Starting Meter (KM)">
                  <Input
                    required
                    type="number"
                    min={0}
                    value={form.starting_meter}
                    onChange={(e) => setForm({ ...form, starting_meter: +e.target.value })}
                    className="h-12 rounded-2xl"
                  />
                </Field>
                <Field label="Closing Meter (KM)">
                  <Input
                    required
                    type="number"
                    min={0}
                    value={form.closing_meter}
                    onChange={(e) => setForm({ ...form, closing_meter: +e.target.value })}
                    className="h-12 rounded-2xl"
                  />
                </Field>
                <Field label="Starting Time">
                  <Input
                    required
                    type="time"
                    value={form.starting_time}
                    onChange={(e) => setForm({ ...form, starting_time: e.target.value })}
                    className="h-12 rounded-2xl"
                  />
                </Field>
                <Field label="Closing Time">
                  <Input
                    required
                    type="time"
                    value={form.closing_time}
                    onChange={(e) => setForm({ ...form, closing_time: e.target.value })}
                    className="h-12 rounded-2xl"
                  />
                </Field>
              </Section>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving} size="lg" className="h-12 rounded-2xl px-6">
                  <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : id ? "Update Entry" : "Save Entry"}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="surface-card sticky top-24 p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-secondary dark:text-foreground">Billing preview</div>
                  <div className="mt-1 text-sm text-muted-foreground">{PACKAGES[form.package_hours_id]?.label}</div>
                </div>
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <Route className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <PreviewStat label="Calculated distance" value={`${billing.totalKm} km`} icon={Route} />
                <PreviewStat label="Calculated hours" value={`${billing.totalHours} hrs`} icon={Clock3} />
              </div>

              <div className="mt-6 surface-muted p-5">
                <div className="space-y-3 text-sm">
                  <Row label={`Base rate (${PACKAGES[form.package_hours_id]?.label})`} value={formatINR(billing.basePrice)} />
                  <Row label={`Extra distance (${billing.extraKm} km)`} value={`+ ${formatINR(billing.extraKmCharge)}`} accent />
                  <Row label={`Extra time (${billing.extraHours} hrs)`} value={`+ ${formatINR(billing.extraHourCharge)}`} accent />
                </div>
                <div className="mt-4 border-t border-border/70 pt-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Estimated total</div>
                      <div className="mt-1 text-sm text-muted-foreground">Live preview based on current package and trip input.</div>
                    </div>
                    <div className="text-3xl font-extrabold text-secondary dark:text-foreground">{formatINR(billing.totalAmount)}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <InfoPill label="Vehicle" value={form.vehicle_model || "Innova Crysta"} />
                <InfoPill label="Ownership" value={OWNERSHIP[form.ownership_id]} />
                <InfoPill label="Type" value={VEHICLE_TYPES[form.vehicle_type_id]} />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <div className="space-y-5">
    <div>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">{children}</div>
  </div>
);

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="space-y-2">
    <Label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const Row = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div className="flex justify-between gap-3">
    <span className="text-muted-foreground">{label}</span>
    <span className={`font-semibold ${accent ? "text-tertiary" : "text-secondary dark:text-foreground"}`}>{value}</span>
  </div>
);

const PreviewStat = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Route;
}) => (
  <div className="surface-muted p-4">
    <div className="flex items-center justify-between">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div className="mt-3 text-2xl font-extrabold text-secondary dark:text-foreground">{value}</div>
  </div>
);

const InfoPill = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-border/70 bg-accent/55 px-4 py-3">
    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
    <div className="mt-1 font-semibold">{value}</div>
  </div>
);

export default EntryForm;
