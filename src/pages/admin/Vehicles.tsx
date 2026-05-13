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
import { adminApi, type Vehicle, LOCATIONS } from "@/lib/admin-api";
import { toast } from "sonner";

const VEHICLE_TYPE_OPTIONS = ["GX", "GX PLUS", "VX", "ZX"] as const;

const emptyForm = () => ({
  vehicle_name: "",
  vehicle_number: "",
  vehicle_type: "",
  vehicle_model: "",
  model_year: "",
  location: "",
  is_agency: "no" as "yes" | "no",
  agency_id: "",
  owner_name: "",
  owner_number: "",
  ownership: "own" as "own" | "rent" | "agency",
});

export default function VehiclesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: vehicles = [], isLoading } = useQuery({ queryKey: ["vehicles"], queryFn: adminApi.vehicles.list });
  const { data: agencies = [] } = useQuery({ queryKey: ["agencies"], queryFn: adminApi.agencies.list });

  const save = useMutation({
    mutationFn: () => {
      const isAgency = form.is_agency === "yes";
      const payload = {
        vehicle_name: form.vehicle_name || form.vehicle_model || "Vehicle",
        vehicle_number: form.vehicle_number,
        vehicle_type: form.vehicle_type || null,
        vehicle_model: form.vehicle_model || "Vehicle",
        model_year: form.model_year || null,
        location: form.location || null,
        ownership: isAgency ? "agency" : "own",
        agency_id: isAgency && form.agency_id && form.agency_id !== "driver_owner" ? form.agency_id : null,
        owner_name: form.owner_name || "—",
        owner_number: form.owner_number || null,
      };
      return editing ? adminApi.vehicles.update(editing.id, payload) : adminApi.vehicles.create(payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Vehicle updated" : "Vehicle added");
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.vehicles.remove(id),
    onSuccess: () => { toast.success("Vehicle removed"); qc.invalidateQueries({ queryKey: ["vehicles"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setOpen(true); };
  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setForm({
      vehicle_name: v.vehicle_name,
      vehicle_number: v.vehicle_number,
      vehicle_type: v.vehicle_type || "",
      vehicle_model: v.vehicle_model,
      model_year: v.model_year || "",
      location: v.location || "",
      is_agency: v.ownership === "agency" ? "yes" : "no",
      agency_id: v.agency_id || "",
      owner_name: v.owner_name,
      owner_number: v.owner_number || "",
      ownership: v.ownership,
    });
    setOpen(true);
  };

  const getVehicleLabel = (v: Vehicle) => {
    if (v.ownership === "agency") return v.agency_name ? `Agency — ${v.agency_name}` : "Agency Vehicle";
    return "Independent";
  };

  const getLabelBadgeCls = (v: Vehicle) => {
    if (v.ownership === "agency") return "bg-red-50 text-red-700 border-red-200";
    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Vehicles</h1>
            <p className="mt-1 text-slate-500">Manage fleet vehicles, both independent and agency vehicles.</p>
          </div>
          <Button onClick={openCreate} className="bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg gap-2">
            <Plus className="h-4 w-4" /> Create Vehicle
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead>Vehicle Name</TableHead>
                  <TableHead>Vehicle Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Model Year</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-slate-500">Loading…</TableCell></TableRow>
                ) : vehicles.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-slate-500">No vehicles yet. Click Create Vehicle to get started.</TableCell></TableRow>
                ) : vehicles.map((v) => (
                  <TableRow key={v.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium text-slate-900">{v.vehicle_name}</TableCell>
                    <TableCell className="font-mono text-xs">{v.vehicle_number}</TableCell>
                    <TableCell>{v.vehicle_type || v.vehicle_model || "—"}</TableCell>
                    <TableCell>{v.model_year || "—"}</TableCell>
                    <TableCell>
                      {v.location ? (
                        <span className="inline-flex text-xs px-2 py-1 rounded-full font-medium bg-slate-100 text-slate-700">{v.location}</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-medium border ${getLabelBadgeCls(v)}`}>
                        {getVehicleLabel(v)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(v)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove.mutate(v.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Vehicle" : "Create Vehicle"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Vehicle Name</Label>
              <Input value={form.vehicle_name} onChange={(e) => setForm({ ...form, vehicle_name: e.target.value })} placeholder="e.g. Innova Crysta" />
            </div>
            <div className="grid gap-2">
              <Label>Vehicle Number</Label>
              <Input value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} placeholder="e.g. AP39AB1234" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Vehicle Type</Label>
                <Select value={form.vehicle_type} onValueChange={(v) => setForm({ ...form, vehicle_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Vehicle Model Year</Label>
                <Input value={form.model_year} onChange={(e) => setForm({ ...form, model_year: e.target.value })} placeholder="e.g. 2022" />
              </div>
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
              <Label>Is Agency Vehicle?</Label>
              <Select value={form.is_agency} onValueChange={(v) => setForm({ ...form, is_agency: v as "yes" | "no", agency_id: "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.is_agency === "yes" && (
              <div className="grid gap-2">
                <Label>Select Agency</Label>
                <Select value={form.agency_id} onValueChange={(v) => setForm({ ...form, agency_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select agency" /></SelectTrigger>
                  <SelectContent>
                    {agencies.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.agency_name}</SelectItem>
                    ))}
                    <SelectItem value="driver_owner">Driver/Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.vehicle_number} className="bg-[#2563eb] hover:bg-[#1d4ed8]">
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
