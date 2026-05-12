import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, User } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi, type Host, LOCATIONS } from "@/lib/admin-api";
import { toast } from "sonner";

const empty = { host_name: "", contact_number: "", alt_number: "", location: "" };

export default function HostsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Host | null>(null);
  const [form, setForm] = useState(empty);

  const { data: hosts = [], isLoading } = useQuery({ queryKey: ["hosts"], queryFn: adminApi.hosts.list });

  const save = useMutation({
    mutationFn: () => editing ? adminApi.hosts.update(editing.id, form) : adminApi.hosts.create(form),
    onSuccess: () => {
      toast.success(editing ? "Host updated" : "Host added");
      qc.invalidateQueries({ queryKey: ["hosts"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.hosts.remove(id),
    onSuccess: () => { toast.success("Host removed"); qc.invalidateQueries({ queryKey: ["hosts"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (h: Host) => {
    setEditing(h);
    setForm({ host_name: h.host_name, contact_number: h.contact_number || "", alt_number: h.alt_number || "", location: h.location || "" });
    setOpen(true);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Hosts</h1>
            <p className="mt-1 text-slate-500">Manage event hosts and their contact details.</p>
          </div>
          <Button onClick={openCreate} className="bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg gap-2">
            <Plus className="h-4 w-4" /> Add Host
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead>Host Name</TableHead>
                  <TableHead>Contact Number</TableHead>
                  <TableHead>Alternate Number</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-slate-500">Loading…</TableCell></TableRow>
                ) : hosts.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-slate-500">No hosts yet. Click Add Host to get started.</TableCell></TableRow>
                ) : hosts.map((h) => (
                  <TableRow key={h.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        {h.host_name}
                      </div>
                    </TableCell>
                    <TableCell>{h.contact_number || "—"}</TableCell>
                    <TableCell>{h.alt_number || "—"}</TableCell>
                    <TableCell>
                      {h.location ? (
                        <span className="inline-flex text-xs px-2 py-1 rounded-full font-medium bg-slate-100 text-slate-700">
                          {h.location}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(h)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove.mutate(h.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
            <DialogTitle>{editing ? "Edit Host" : "Add Host"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Host Name</Label>
              <Input value={form.host_name} onChange={(e) => setForm({ ...form, host_name: e.target.value })} placeholder="Enter host name" />
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
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.host_name} className="bg-[#2563eb] hover:bg-[#1d4ed8]">
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
