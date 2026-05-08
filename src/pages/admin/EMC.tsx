import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2, Mail, Phone, Pencil, Trash2 } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi, type EMC } from "@/lib/admin-api";
import { toast } from "sonner";

const empty = { company_name: "", organizer_name: "", mobile: "", alt_mobile: "", email: "" };

export default function EMCPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EMC | null>(null);
  const [form, setForm] = useState(empty);
  const [selected, setSelected] = useState<EMC | null>(null);

  const { data: companies = [] } = useQuery({ queryKey: ["emc"], queryFn: adminApi.emc.list });

  const save = useMutation({
    mutationFn: () => editing ? adminApi.emc.update(editing.id, form) : adminApi.emc.create(form),
    onSuccess: () => {
      toast.success(editing ? "Updated" : "Company added");
      qc.invalidateQueries({ queryKey: ["emc"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.emc.remove(id),
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["emc"] });
    },
  });

  const openEdit = (c: EMC) => {
    setEditing(c);
    setForm({ company_name: c.company_name, organizer_name: c.organizer_name || "", mobile: c.mobile || "", alt_mobile: c.alt_mobile || "", email: c.email || "" });
    setOpen(true);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Event Management Companies</h1>
            <p className="mt-1 text-slate-500">Manage and monitor your external logistics partners.</p>
          </div>
          <Button onClick={() => { setEditing(null); setForm(empty); setOpen(true); }} className="bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg gap-2">
            <Plus className="h-4 w-4" /> Add Company
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead>Company</TableHead>
                    <TableHead>Organizer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((c) => (
                    <TableRow key={c.id} onClick={() => setSelected(c)} className="cursor-pointer hover:bg-slate-50">
                      <TableCell className="font-medium text-slate-900">{c.company_name}</TableCell>
                      <TableCell>{c.organizer_name || "—"}</TableCell>
                      <TableCell className="text-sm">
                        <div>{c.mobile || "—"}</div>
                        {c.alt_mobile && <div className="text-slate-500">{c.alt_mobile}</div>}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex text-xs px-2 py-1 rounded-full font-medium ${c.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : c.status === "pending" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-600"}`}>
                          {c.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => remove.mutate(c.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {selected && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 h-fit">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-[#dbe1ff] text-[#2563eb] flex items-center justify-center"><Building2 className="h-5 w-5" /></div>
                <div>
                  <div className="font-semibold text-slate-900">{selected.company_name}</div>
                  <div className="text-xs text-slate-500">{selected.status}</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600"><span className="font-medium text-slate-900">{selected.organizer_name}</span></div>
                {selected.email && <div className="flex items-center gap-2 text-slate-600"><Mail className="h-4 w-4" /> <a className="text-[#2563eb] hover:underline" href={`mailto:${selected.email}`}>{selected.email}</a></div>}
                {selected.mobile && <div className="flex items-center gap-2 text-slate-600"><Phone className="h-4 w-4" /> {selected.mobile}</div>}
                {selected.alt_mobile && <div className="flex items-center gap-2 text-slate-600 ml-6">{selected.alt_mobile}</div>}
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => openEdit(selected)}>Edit Details</Button>
                <Button className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8]">Contact</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Company" : "Add Company"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Company Name</Label><Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Organizer Name</Label><Input value={form.organizer_name} onChange={(e) => setForm({ ...form, organizer_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2"><Label>Mobile Number</Label><Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Alternative Mobile</Label><Input value={form.alt_mobile} onChange={(e) => setForm({ ...form, alt_mobile: e.target.value })} /></div>
            </div>
            <div className="grid gap-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-[#2563eb] hover:bg-[#1d4ed8]">{save.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
