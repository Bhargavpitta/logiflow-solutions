import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi, ownershipBadge, type Vehicle } from "@/lib/admin-api";
import { toast } from "sonner";

type View = "driver_owner" | "driver" | "agency";

const VIEW_LABEL: Record<View, string> = {
  driver_owner: "Driver / Owner",
  driver: "Driver",
  agency: "Agency Vehicles",
};

const OWNERSHIP_FOR_VIEW: Record<View, "own" | "rent" | "agency"> = {
  driver_owner: "own",
  driver: "rent",
  agency: "agency",
};

function emptyForm(view: View) {
  return {
    owner_name: "",
    owner_number: "",
    vehicle_name: "Innova Crysta",
    vehicle_number: "",
    vehicle_model: "Innova Crysta",
    ownership: OWNERSHIP_FOR_VIEW[view] as "own" | "rent" | "agency",
    agency: { agency_name: "", organizer_name: "", organizer_number: "", alt_number: "" },
  };
}

export default function Logistics() {
  const [view, setView] = useState<View>("driver_owner");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(() => emptyForm("driver_owner"));
  const qc = useQueryClient();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: adminApi.vehicles.list,
  });

  const filtered = useMemo(
    () => vehicles.filter((v) => v.ownership === OWNERSHIP_FOR_VIEW[view]),
    [vehicles, view],
  );

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = { ...form };
      if (form.ownership !== "agency") delete payload.agency;
      if (editing) return adminApi.vehicles.update(editing.id, payload);
      return adminApi.vehicles.create(payload);
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
    onSuccess: () => {
      toast.success("Vehicle removed");
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(view));
    setOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setForm({
      owner_name: v.owner_name,
      owner_number: v.owner_number || "",
      vehicle_name: v.vehicle_name,
      vehicle_number: v.vehicle_number,
      vehicle_model: v.vehicle_model,
      ownership: v.ownership,
      agency: { agency_name: v.agency_name || "", organizer_name: "", organizer_number: "", alt_number: "" },
    });
    setOpen(true);
  };

  const isAgencyView = view === "agency";
  const ownerLabel = isAgencyView ? "Agency Driver Name" : view === "driver" ? "Driver Name" : "Driver/Owner Name";
  const numberLabel = isAgencyView ? "Driver Number" : view === "driver" ? "Driver Number" : "Driver/Owner Number";

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Logistics</h1>
            <p className="mt-1 text-slate-500">Manage drivers, owners, and agency vehicles.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={view} onValueChange={(v) => setView(v as View)}>
              <SelectTrigger className="w-full sm:w-56 rounded-lg bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="driver_owner">Driver / Owner</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="agency">Agency Vehicles</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={openCreate} className="bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg gap-2">
              <Plus className="h-4 w-4" /> Add {VIEW_LABEL[view]}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead>Owner / Driver</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Number</TableHead>
                  {isAgencyView && <TableHead>Agency</TableHead>}
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">Loading…</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">No records yet.</TableCell></TableRow>
                ) : (
                  filtered.map((v) => {
                    const b = ownershipBadge(v.ownership);
                    return (
                      <TableRow key={v.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium text-slate-900">{v.owner_name}</TableCell>
                        <TableCell>{v.owner_number || "—"}</TableCell>
                        <TableCell>{v.vehicle_model}</TableCell>
                        <TableCell className="font-mono text-xs">{v.vehicle_number}</TableCell>
                        {isAgencyView && <TableCell>{v.agency_name || "—"}</TableCell>}
                        <TableCell>
                          <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${b.cls}`}>
                            {b.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(v)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => remove.mutate(v.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} {VIEW_LABEL[view]}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>{ownerLabel}</Label>
              <Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>{numberLabel}</Label>
              <Input value={form.owner_number} onChange={(e) => setForm({ ...form, owner_number: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Vehicle Name</Label>
                <Input value={form.vehicle_name} onChange={(e) => setForm({ ...form, vehicle_name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Vehicle Number</Label>
                <Input value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Vehicle Model</Label>
                <Input value={form.vehicle_model} onChange={(e) => setForm({ ...form, vehicle_model: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Ownership</Label>
                <Select value={form.ownership} onValueChange={(v) => setForm({ ...form, ownership: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="own">Own</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.ownership === "agency" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 grid gap-3">
                <div className="text-sm font-semibold text-amber-900">Agency Details</div>
                <div className="grid gap-2">
                  <Label>Agency Name</Label>
                  <Input value={form.agency.agency_name} onChange={(e) => setForm({ ...form, agency: { ...form.agency, agency_name: e.target.value } })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Organizer Name</Label>
                    <Input value={form.agency.organizer_name} onChange={(e) => setForm({ ...form, agency: { ...form.agency, organizer_name: e.target.value } })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Organizer Number</Label>
                    <Input value={form.agency.organizer_number} onChange={(e) => setForm({ ...form, agency: { ...form.agency, organizer_number: e.target.value } })} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Alternate Number</Label>
                  <Input value={form.agency.alt_number} onChange={(e) => setForm({ ...form, agency: { ...form.agency, alt_number: e.target.value } })} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-[#2563eb] hover:bg-[#1d4ed8]">
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
