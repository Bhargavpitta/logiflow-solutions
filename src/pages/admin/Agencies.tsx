import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Building } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi, type Agency, LOCATIONS } from "@/lib/admin-api";
import { toast } from "sonner";

const empty = { agency_name: "", organizer_name: "", organizer_number: "", alt_number: "", location: "" };

export default function AgenciesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Agency | null>(null);
  const [form, setForm] = useState(empty);

  const { data: agencies = [], isLoading } = useQuery({ queryKey: ["agencies"], queryFn: adminApi.agencies.list });

  const save = useMutation({
    mutationFn: () => editing ? adminApi.agencies.update(editing.id, form) : adminApi.agencies.create(form),
    onSuccess: () => {
      toast.success(editing ? "Agency updated" : "Agency added");
      qc.invalidateQueries({ queryKey: ["agencies"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.agencies.remove(id),
    onSuccess: () => { toast.success("Agency removed"); qc.invalidateQueries({ queryKey: ["agencies"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (a: Agency) => {
    setEditing(a);
    setForm({
      agency_name: a.agency_name,
      organizer_name: a.organizer_name || "",
      organizer_number: a.organizer_number || "",
      alt_number: a.alt_number || "",
      location: a.location || "",
    });
    setOpen(true);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Agencies</h1>
            <p className="mt-1 text-slate-500">Manage logistics agencies and their vehicle fleets.</p>
          </div>
          <Button onClick={openCreate} className="bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg gap-2">
            <Plus className="h-4 w-4" /> Add Agency
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead>Agency Name</TableHead>
                  <TableHead>Owner Name</TableHead>
                  <TableHead>Owner Number</TableHead>
                  <TableHead>Alternate Number</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-slate-500">Loading…</TableCell></TableRow>
                ) : agencies.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-slate-500">No agencies yet. Click Add Agency to get started.</TableCell></TableRow>
                ) : agencies.map((a) => (
                  <TableRow key={a.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                          <Building className="h-4 w-4 text-amber-600" />
                        </div>
                        {a.agency_name}
                      </div>
                    </TableCell>
                    <TableCell>{a.organizer_name || "—"}</TableCell>
                    <TableCell>{a.organizer_number || "—"}</TableCell>
                    <TableCell>{a.alt_number || "—"}</TableCell>
                    <TableCell>
                      {a.location ? (
                        <span className="inline-flex text-xs px-2 py-1 rounded-full font-medium bg-slate-100 text-slate-700">{a.location}</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove.mutate(a.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Agency" : "Add Agency"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Agency Name</Label>
              <Input value={form.agency_name} onChange={(e) => setForm({ ...form, agency_name: e.target.value })} placeholder="Enter agency name" />
            </div>
            <div className="grid gap-2">
              <Label>Agency Owner Name</Label>
              <Input value={form.organizer_name} onChange={(e) => setForm({ ...form, organizer_name: e.target.value })} placeholder="Owner name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Owner Number</Label>
                <Input value={form.organizer_number} onChange={(e) => setForm({ ...form, organizer_number: e.target.value })} placeholder="Primary number" />
              </div>
              <div className="grid gap-2">
                <Label>Alternate Number</Label>
                <Input value={form.alt_number} onChange={(e) => setForm({ ...form, alt_number: e.target.value })} placeholder="Alternate number" />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.agency_name} className="bg-[#2563eb] hover:bg-[#1d4ed8]">
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
