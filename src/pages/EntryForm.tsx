import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'sonner';
import { ChevronLeft, Save, Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TopNav } from '@/components/TopNav';
import { calculateBilling, formatINR, OWNERSHIP, PACKAGES, VEHICLE_TYPES } from '@/lib/billing';

const schema = z.object({
  driver_name: z.string().trim().min(1).max(100),
  contact_number: z.string().trim().max(20).optional().or(z.literal('')),
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
  driver_name: '', contact_number: '', vehicle_number: '', vehicle_model: 'Innova Crysta',
  vehicle_type_id: 1, package_hours_id: 1, ownership_id: 1,
  logistics_date: new Date().toISOString().slice(0, 10),
  starting_meter: 0, closing_meter: 0, starting_time: '', closing_time: '',
};

const EntryForm = () => {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!authLoading && !user) nav('/auth'); }, [user, authLoading, nav]);

  useEffect(() => {
    if (!id) return;
    supabase.from('logistics_entries').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      if (data) setForm({
        driver_name: data.driver_name, contact_number: data.contact_number ?? '',
        vehicle_number: data.vehicle_number, vehicle_model: data.vehicle_model,
        vehicle_type_id: data.vehicle_type_id, package_hours_id: data.package_hours_id,
        ownership_id: data.ownership_id, logistics_date: data.logistics_date,
        starting_meter: data.starting_meter, closing_meter: data.closing_meter,
        starting_time: data.starting_time?.slice(0, 5) ?? '',
        closing_time: data.closing_time?.slice(0, 5) ?? '',
      });
    });
  }, [id]);

  const billing = useMemo(() => calculateBilling({
    packageId: form.package_hours_id,
    startingMeter: form.starting_meter,
    closingMeter: form.closing_meter,
    startingTime: form.starting_time,
    closingTime: form.closing_time,
  }), [form]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      schema.parse(form);
      const payload = {
        ...form,
        contact_number: form.contact_number || null,
        user_id: user!.id,
        total_km: billing.totalKm, total_hours: billing.totalHours,
        extra_km: billing.extraKm, extra_hours: billing.extraHours,
        total_amount: billing.totalAmount,
      };
      const { error } = id
        ? await supabase.from('logistics_entries').update(payload).eq('id', id)
        : await supabase.from('logistics_entries').insert(payload);
      if (error) throw error;
      toast.success(id ? 'Entry updated' : 'Entry saved');
      nav('/dashboard');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="container py-8 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => nav(-1)} className="gap-1">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary">
            <Truck className="h-3 w-3" /> Entry Registration
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gradient">Logistics Data Entry</h1>
          <p className="text-muted-foreground">Enter trip details for vehicle deployment and billing calculation.</p>
        </div>

        <form onSubmit={submit} className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass rounded-3xl p-7 space-y-7">
            <Section title="Driver & Vehicle Profile">
              <Field label="Driver Name"><Input required value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} placeholder="e.g., Jane Doe" /></Field>
              <Field label="Contact Number"><Input value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} placeholder="+91 98765 43210" /></Field>
              <Field label="Vehicle Number"><Input required value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} placeholder="KA-01-AB-1234" /></Field>
              <Field label="Vehicle Model"><Input required value={form.vehicle_model} onChange={(e) => setForm({ ...form, vehicle_model: e.target.value })} /></Field>
            </Section>
            <Section title="Classification & Terms">
              <Field label="Vehicle Type">
                <Select value={String(form.vehicle_type_id)} onValueChange={(v) => setForm({ ...form, vehicle_type_id: +v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(VEHICLE_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Package Hours">
                <Select value={String(form.package_hours_id)} onValueChange={(v) => setForm({ ...form, package_hours_id: +v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(PACKAGES).map(([k, p]) => <SelectItem key={k} value={k}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Ownership">
                <Select value={String(form.ownership_id)} onValueChange={(v) => setForm({ ...form, ownership_id: +v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(OWNERSHIP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </Section>
            <Section title="Trip Metrics">
              <Field label="Logistics Date" full><Input required type="date" value={form.logistics_date} onChange={(e) => setForm({ ...form, logistics_date: e.target.value })} /></Field>
              <Field label="Starting Meter (KM)"><Input required type="number" min={0} value={form.starting_meter} onChange={(e) => setForm({ ...form, starting_meter: +e.target.value })} /></Field>
              <Field label="Closing Meter (KM)"><Input required type="number" min={0} value={form.closing_meter} onChange={(e) => setForm({ ...form, closing_meter: +e.target.value })} /></Field>
              <Field label="Starting Time"><Input required type="time" value={form.starting_time} onChange={(e) => setForm({ ...form, starting_time: e.target.value })} /></Field>
              <Field label="Closing Time"><Input required type="time" value={form.closing_time} onChange={(e) => setForm({ ...form, closing_time: e.target.value })} /></Field>
            </Section>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving} size="lg" className="bg-gradient-primary shadow-glow">
                <Save className="mr-2 h-4 w-4" /> {saving ? 'Saving…' : (id ? 'Update Entry' : 'Save Entry')}
              </Button>
            </div>
          </div>

          {/* Billing preview */}
          <div className="glass-strong rounded-3xl p-6 space-y-4 h-fit lg:sticky lg:top-24">
            <div className="text-tertiary text-xs font-mono uppercase tracking-wider">Billing Preview</div>
            <h3 className="text-2xl font-bold">{PACKAGES[form.package_hours_id]?.label}</h3>
            <div className="glass rounded-xl p-4 space-y-2 text-sm">
              <Row label="Calculated Distance" value={`${billing.totalKm} KM`} />
              <Row label="Calculated Hours" value={`${billing.totalHours} Hrs`} />
            </div>
            <div className="space-y-2 text-sm">
              <Row label={`Base Rate (${PACKAGES[form.package_hours_id]?.label})`} value={formatINR(billing.basePrice)} />
              <Row label={`Extra Distance (${billing.extraKm} KM)`} value={`+ ${formatINR(billing.extraKmCharge)}`} accent />
              <Row label={`Extra Time (${billing.extraHours} Hrs)`} value={`+ ${formatINR(billing.extraHourCharge)}`} accent />
            </div>
            <div className="border-t border-border pt-4 flex items-end justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Estimated Total</div>
                <div className="text-xs text-muted-foreground">Innova Crysta pricing</div>
              </div>
              <div className="text-3xl font-bold text-gradient">{formatINR(billing.totalAmount)}</div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-4">
    <h3 className="text-primary font-semibold tracking-tight">{title}</h3>
    <div className="grid sm:grid-cols-2 gap-4">{children}</div>
  </div>
);
const Field = ({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) => (
  <div className={`space-y-1.5 ${full ? 'sm:col-span-2' : ''}`}>
    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</Label>
    {children}
  </div>
);
const Row = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div className="flex justify-between gap-2">
    <span className="text-muted-foreground">{label}</span>
    <span className={`font-mono font-semibold ${accent ? 'text-tertiary' : ''}`}>{value}</span>
  </div>
);

export default EntryForm;
