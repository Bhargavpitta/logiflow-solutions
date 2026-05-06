import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Download, FileText, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TopNav } from '@/components/TopNav';
import { OWNERSHIP, PACKAGES, VEHICLE_TYPES, formatINR } from '@/lib/billing';
import { exportToExcel, generateInvoicePDF, EntryRow } from '@/lib/exporters';

interface Entry extends EntryRow { id: string; user_id: string; created_at: string; }

/**
 * Unified records table.
 *  - mode="admin"  → admins only. Sees ALL drivers, can edit/delete/export/invoice.
 *  - mode="user"   → regular users. Sees own entries, can edit only. No invoice/delete.
 */
const Dashboard = ({ mode = 'admin' }: { mode?: 'admin' | 'user' }) => {
  const { user, isAdmin, role, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [q, setQ] = useState('');

  // Auth + role gating
  useEffect(() => {
    if (authLoading) return;
    if (!user) { nav('/auth'); return; }
    if (mode === 'admin' && role && !isAdmin) {
      // Non-admins should never see the admin dashboard
      nav('/my', { replace: true });
    }
    if (mode === 'user' && isAdmin) {
      // Admins land on the admin dashboard
      nav('/dashboard', { replace: true });
    }
  }, [user, role, isAdmin, authLoading, mode, nav]);

  useEffect(() => { if (user) load(); }, [user, mode]);

  async function load() {
    setLoading(true);
    let query = supabase.from('logistics_entries').select('*').order('logistics_date', { ascending: false });
    if (mode === 'user') query = query.eq('user_id', user!.id);
    const { data, error } = await query;
    if (error) toast.error(error.message);
    else setRows((data as Entry[]) ?? []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (from && r.logistics_date < from) return false;
      if (to && r.logistics_date > to) return false;
      if (q) {
        const s = q.toLowerCase();
        if (!r.driver_name.toLowerCase().includes(s) &&
            !r.vehicle_number.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [rows, from, to, q]);

  const totals = useMemo(() => filtered.reduce((acc, r) => ({
    hours: acc.hours + Number(r.total_hours), km: acc.km + Number(r.total_km),
    extraHrs: acc.extraHrs + Number(r.extra_hours), extraKm: acc.extraKm + Number(r.extra_km),
    amount: acc.amount + Number(r.total_amount),
  }), { hours: 0, km: 0, extraHrs: 0, extraKm: 0, amount: 0 }), [filtered]);

  const remove = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    const { error } = await supabase.from('logistics_entries').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Entry deleted'); load(); }
  };

  const isAdminMode = mode === 'admin';

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="container py-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
              {isAdminMode ? 'Driver Records' : 'My Logistics'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isAdminMode
                ? 'Manage and export fleet performance data across all drivers.'
                : 'View and edit your trip submissions.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-gradient-primary shadow-glow">
              <Link to="/entry"><Plus className="h-4 w-4 mr-1" /> New Entry</Link>
            </Button>
            {isAdminMode && (
              <>
                <Button variant="outline" className="glass" onClick={() => exportToExcel(filtered)}>
                  <Download className="h-4 w-4 mr-1" /> Export Excel
                </Button>
                <Button variant="outline" className="glass" onClick={() => generateInvoicePDF(filtered, { from, to })}>
                  <FileText className="h-4 w-4 mr-1" /> Generate Invoice
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="glass rounded-2xl p-4 flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">From</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">To</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" />
          </div>
          <div className="space-y-1 flex-1 min-w-[200px]">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Driver or vehicle…" className="pl-9" />
            </div>
          </div>
          {(from || to || q) && (
            <Button variant="ghost" size="sm" onClick={() => { setFrom(''); setTo(''); setQ(''); }}>Clear</Button>
          )}
          <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
            <Calendar className="h-3 w-3" /> {filtered.length} of {rows.length} entries
          </div>
        </div>

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-xs uppercase tracking-wider text-muted-foreground">
                  <Th>Date</Th><Th>Driver</Th><Th>Contact</Th><Th>Vehicle</Th><Th>Model</Th>
                  <Th>Type</Th><Th>Pkg</Th><Th>Owner</Th>
                  <Th right>Start KM</Th><Th right>Close KM</Th>
                  <Th>Start</Th><Th>End</Th>
                  <Th right>Total Hrs</Th><Th right>Total KM</Th>
                  <Th right>Extra Hrs</Th><Th right>Extra KM</Th>
                  <Th right>Amount</Th><Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={18} className="text-center py-12 text-muted-foreground">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={18} className="text-center py-16">
                    <div className="text-muted-foreground mb-3">No entries yet.</div>
                    <Button asChild size="sm" className="bg-gradient-primary"><Link to="/entry">Create first entry</Link></Button>
                  </td></tr>
                ) : filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border/40 hover:bg-accent/30 transition">
                    <Td mono>{r.logistics_date}</Td>
                    <Td><div className="font-semibold">{r.driver_name}</div></Td>
                    <Td className="text-muted-foreground">{r.contact_number ?? '—'}</Td>
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
                    <Td right mono className={Number(r.extra_hours) > 0 ? 'text-tertiary font-semibold' : 'text-muted-foreground'}>{Number(r.extra_hours).toFixed(1)}</Td>
                    <Td right mono className={Number(r.extra_km) > 0 ? 'text-tertiary font-semibold' : 'text-muted-foreground'}>{Number(r.extra_km).toFixed(0)}</Td>
                    <Td right className="font-bold">{formatINR(Number(r.total_amount))}</Td>
                    <Td>
                      <div className="flex gap-1">
                        {/* Edit: user on own entries OR admin on any entry */}
                        {(r.user_id === user?.id || isAdminMode) && (
                          <Button asChild variant="ghost" size="icon" className="h-7 w-7" title="Edit">
                            <Link to={`/entry/${r.id}`}><Pencil className="h-3.5 w-3.5" /></Link>
                          </Button>
                        )}
                        {/* Delete: admin only */}
                        {isAdminMode && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => remove(r.id)} title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {/* Per-row invoice: admin only */}
                        {isAdminMode && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-primary" onClick={() => generateInvoicePDF([r])} title="Invoice">
                            <FileText className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-primary/30 bg-accent/30">
                    <Td colSpan={12} className="font-bold uppercase tracking-wider text-xs">Totals</Td>
                    <Td right mono className="font-bold">{totals.hours.toFixed(1)}</Td>
                    <Td right mono className="font-bold">{totals.km.toFixed(0)}</Td>
                    <Td right mono className="font-bold text-tertiary">{totals.extraHrs.toFixed(1)}</Td>
                    <Td right mono className="font-bold text-tertiary">{totals.extraKm.toFixed(0)}</Td>
                    <Td right className="font-bold text-gradient text-base">{formatINR(totals.amount)}</Td>
                    <Td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const Th = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
  <th className={`px-3 py-3 font-semibold whitespace-nowrap ${right ? 'text-right' : 'text-left'}`}>{children}</th>
);
const Td = ({ children, right, mono, className = '', colSpan }: any) => (
  <td colSpan={colSpan} className={`px-3 py-2.5 whitespace-nowrap ${right ? 'text-right' : ''} ${mono ? 'font-mono' : ''} ${className}`}>{children}</td>
);

export default Dashboard;
