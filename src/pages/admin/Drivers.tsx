import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi, type Driver, LOCATIONS } from "@/lib/admin-api";
import { toast } from "sonner";

const empty = {
  driver_name: "",
  contact_number: "",
  alt_number: "",
  license_id: "",
  location: "",
  driver_type: "driver_owner" as "driver_owner" | "agency_driver",
  agency_id: "",
};

export default function DriversPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState(empty);

  const { data: drivers = [], isLoading } = useQuery({ queryKey: ["drivers"], queryFn: adminApi.drivers.list });
  const { data: agencies = [] } = useQuery({ queryKey: ["agencies"], queryFn: adminApi.agencies.list });

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        agency_id: form.driver_type === "agency_driver" && form.agency_id ? form.agency_id : null,
      };
      return editing ? adminApi.drivers.update(editing.id, payload) : adminApi.drivers.create(payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Driver updated" : "Driver added");
      qc.invalidateQueries({ queryKey: ["drivers"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.drivers.remove(id),
    onSuccess: () => { toast.success("Driver removed"); qc.invalidateQueries({ queryKey: ["drivers"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (d: Driver) => {
    setEditing(d);
    setForm({
      driver_name: d.driver_name,
      contact_number: d.contact_number || "",
      alt_number: d.alt_number || "",
      license_id: d.license_id || "",
      location: d.location || "",
      driver_type: d.driver_type,
      agency_id: d.agency_id || "",
    });
    setOpen(true);
  };

  const driverTypeBadge = (d: Driver) => {
    if (d.driver_type === "agency_driver") {
      return { label: d.agency_name ? `Agency — ${d.agency_name}` : "Agency Driver", cls: "bg-red-50 text-red-700 border-red-200" };
    }
    return { label: "Driver/Owner", cls: "bg-amber-50 text-amber-800 border-amber-200" };
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Drivers</h1>
            <p className="mt-1 text-slate-500">Manage drivers and their agency assignments.</p>
          </div>
          <Button onClick={openCreate} className="bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg gap-2">
            <Plus className="h-4 w-4" /> Add Driver
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead>Driver Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Alternate</TableHead>
                  <TableHead>License ID</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-slate-500">Loading…</TableCell></TableRow>
                ) : drivers.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-slate-500">No drivers yet. Click Add Driver to get started.</TableCell></TableRow>
                ) : drivers.map((d) => {
                  const badge = driverTypeBadge(d);
                  return (
                    <TableRow key={d.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium text-slate-900">{d.driver_name}</TableCell>
                      <TableCell>{d.contact_number || "—"}</TableCell>
                      <TableCell>{d.alt_number || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{d.license_id || "—"}</TableCell>
                      <TableCell>
                        {d.location ? (
                          <span className="inline-flex text-xs px-2 py-1 rounded-full font-medium bg-slate-100 text-slate-700">{d.location}</span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-medium border ${badge.cls}`}>{badge.label}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => remove.mutate(d.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Driver" : "Add Driver"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Driver Name</Label>
              <Input value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} placeholder="Enter driver name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Contact Number</Label>
                <Input value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} placeholder="Primary number" />
              </div>
              <div className="grid gap-2">
                <Label>Alternate Number</Label>
                <Input value={form.alt_number} onChange={(e) => setForm({ ...form, alt_number: e.target.value })} placeholder="Alternate number" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>License ID Number</Label>
              <Input value={form.license_id} onChange={(e) => setForm({ ...form, license_id: e.target.value })} placeholder="Driver license number" />
            </div>
            <div className="grid gap-2">
              <Label>Location</Label>
              <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v })}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Driver Type</Label>
              <Select value={form.driver_type} onValueChange={(v) => setForm({ ...form, driver_type: v as any, agency_id: "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="driver_owner">Driver/Owner</SelectItem>
                  <SelectItem value="agency_driver">Agency Driver</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.driver_type === "agency_driver" && (
              <div className="grid gap-2">
                <Label>Agency</Label>
                <Select value={form.agency_id} onValueChange={(v) => setForm({ ...form, agency_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select agency" /></SelectTrigger>
                  <SelectContent>
                    {agencies.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.agency_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.driver_name} className="bg-[#2563eb] hover:bg-[#1d4ed8]">
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
