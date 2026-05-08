import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Trash2, Pencil, Filter, Clock } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminApi, ownershipBadge, type EventRow, type Vehicle } from "@/lib/admin-api";
import { toast } from "sonner";

interface DraftBooking {
  id?: string;
  vehicle_id: string;
  day_date: string;
  start_time?: string | null;
  end_time?: string | null;
}

function daysBetween(a: string, b: string): string[] {
  if (!a || !b) return [];
  const out: string[] = [];
  const start = new Date(a);
  const end = new Date(b);
  if (isNaN(start.valueOf()) || isNaN(end.valueOf()) || start > end) return [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function emptyDraft() {
  return { name: "", from_date: "", to_date: "", organizer_name: "", organizer_number: "", status: "pending" };
}

export default function Events() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [bookings, setBookings] = useState<DraftBooking[]>([]);
  const [vehiclePicker, setVehiclePicker] = useState<{ day: string } | null>(null);
  const [timeEdit, setTimeEdit] = useState<{ day: string; vehicleId: string; start: string; end: string } | null>(null);

  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: adminApi.events.list });
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: adminApi.vehicles.list });

  useEffect(() => {
    if (params.get("new") === "1") {
      openCreate();
      params.delete("new");
      setParams(params, { replace: true });
    }
  }, []); // eslint-disable-line

  const days = useMemo(() => daysBetween(draft.from_date, draft.to_date), [draft.from_date, draft.to_date]);

  function openCreate() {
    setEditing(null);
    setDraft(emptyDraft());
    setBookings([]);
    setOpen(true);
  }

  function openEdit(e: EventRow) {
    setEditing(e);
    setDraft({
      name: e.name,
      from_date: e.from_date.slice(0, 10),
      to_date: e.to_date.slice(0, 10),
      organizer_name: e.organizer_name || "",
      organizer_number: e.organizer_number || "",
      status: e.status,
    });
    setBookings(e.vehicles.map((v) => ({ id: v.id, vehicle_id: v.vehicle_id, day_date: v.day_date.slice(0, 10), start_time: v.start_time, end_time: v.end_time })));
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = { ...draft, vehicles: bookings.map(({ id, ...b }) => b) };
      return editing ? adminApi.events.update(editing.id, payload) : adminApi.events.create(payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Event updated" : "Event created");
      qc.invalidateQueries({ queryKey: ["events"] });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.events.remove(id),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["events"] }); },
  });

  function addVehicle(vehicleId: string) {
    if (!vehiclePicker) return;
    if (bookings.some((b) => b.day_date === vehiclePicker.day && b.vehicle_id === vehicleId)) {
      toast.error("Vehicle already added for this day");
      return;
    }
    setBookings([...bookings, { vehicle_id: vehicleId, day_date: vehiclePicker.day }]);
    setVehiclePicker(null);
  }

  function removeBooking(idx: number) {
    setBookings(bookings.filter((_, i) => i !== idx));
  }

  function applyTime() {
    if (!timeEdit) return;
    setBookings(bookings.map((b) =>
      b.day_date === timeEdit.day && b.vehicle_id === timeEdit.vehicleId
        ? { ...b, start_time: timeEdit.start || null, end_time: timeEdit.end || null }
        : b,
    ));
    setTimeEdit(null);
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Events</h1>
            <p className="mt-1 text-slate-500">Plan, assign vehicles, and track event logistics.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-lg gap-2"><Filter className="h-4 w-4" /> Filter</Button>
            <Button onClick={openCreate} className="bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg gap-2"><Plus className="h-4 w-4" /> Create Event</Button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead>Event Name</TableHead>
                  <TableHead>Organizer</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Vehicles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-slate-500">No events yet. Click Create Event.</TableCell></TableRow>
                ) : events.map((e) => (
                  <TableRow key={e.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium text-slate-900">{e.name}</TableCell>
                    <TableCell>{e.organizer_name || "—"}</TableCell>
                    <TableCell>{new Date(e.from_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(e.to_date).toLocaleDateString()}</TableCell>
                    <TableCell>{e.vehicles.length}</TableCell>
                    <TableCell>
                      <span className={`inline-flex text-xs px-2 py-1 rounded-full font-medium ${e.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>{e.status}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove.mutate(e.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit Event" : "Create Event"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 grid gap-5">
            <div className="grid gap-2"><Label>Event Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2"><Label>From Date</Label><Input type="date" value={draft.from_date} onChange={(e) => setDraft({ ...draft, from_date: e.target.value })} /></div>
              <div className="grid gap-2"><Label>To Date</Label><Input type="date" value={draft.to_date} onChange={(e) => setDraft({ ...draft, to_date: e.target.value })} /></div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Vehicles Needed</div>
              {days.length === 0 ? (
                <div className="text-sm text-slate-500 border border-dashed rounded-xl p-4">Pick a date range to add vehicles per day.</div>
              ) : (
                <div className="space-y-3">
                  {days.map((day) => {
                    const dayBookings = bookings.map((b, i) => ({ ...b, _idx: i })).filter((b) => b.day_date === day);
                    return (
                      <div key={day} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-semibold text-slate-900">{new Date(day).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
                          <Button size="sm" variant="ghost" className="text-[#2563eb]" onClick={() => setVehiclePicker({ day })}>
                            <Plus className="h-4 w-4 mr-1" /> Add Vehicle
                          </Button>
                        </div>
                        {dayBookings.length === 0 ? (
                          <div className="text-xs text-slate-400">No vehicles yet.</div>
                        ) : (
                          <div className="space-y-2">
                            {dayBookings.map((b) => {
                              const v = vehicles.find((x) => x.id === b.vehicle_id);
                              if (!v) return null;
                              const badge = ownershipBadge(v.ownership);
                              return (
                                <div key={b._idx} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                                  <div className="min-w-0">
                                    <div className="font-medium text-slate-900 truncate">{v.vehicle_model} ({v.vehicle_number})</div>
                                    <div className="text-xs text-slate-500 truncate">{v.owner_name}</div>
                                    {(b.start_time || b.end_time) && (
                                      <div className="text-xs text-[#2563eb] mt-0.5"><Clock className="inline h-3 w-3 mr-1" />{b.start_time || "—"} → {b.end_time || "—"}</div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.cls}`}>{badge.label.split(" ")[0]}</span>
                                    <Button size="icon" variant="ghost" onClick={() => setTimeEdit({ day, vehicleId: b.vehicle_id, start: b.start_time || "", end: b.end_time || "" })}><Clock className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" onClick={() => removeBooking(b._idx)}><X className="h-4 w-4" /></Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-3 text-xs text-slate-500 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> Agency</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Driver/Owner</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Driver</span>
              </div>
            </div>

            <div className="grid gap-2"><Label>Event Organizer</Label><Input value={draft.organizer_name} onChange={(e) => setDraft({ ...draft, organizer_name: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Organizer Number</Label><Input value={draft.organizer_number} onChange={(e) => setDraft({ ...draft, organizer_number: e.target.value })} /></div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => save.mutate()} disabled={save.isPending} className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8]">
                {save.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Vehicle picker */}
      <Dialog open={!!vehiclePicker} onOpenChange={(v) => !v && setVehiclePicker(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Select a Vehicle</DialogTitle></DialogHeader>
          <div className="grid gap-2">
            {vehicles.map((v) => {
              const b = ownershipBadge(v.ownership);
              return (
                <button
                  key={v.id}
                  onClick={() => addVehicle(v.id)}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-left hover:border-[#2563eb] hover:bg-blue-50 transition"
                >
                  <div>
                    <div className="font-medium text-sm">{v.vehicle_model} <span className="text-slate-500 font-normal">({v.vehicle_number})</span></div>
                    <div className="text-xs text-slate-500">{v.owner_name} · {v.owner_number || "—"}</div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${b.cls}`}>{b.label}</span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Time edit */}
      <Dialog open={!!timeEdit} onOpenChange={(v) => !v && setTimeEdit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Set Start & End Time</DialogTitle></DialogHeader>
          {timeEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2"><Label>Start Time</Label><Input type="time" value={timeEdit.start} onChange={(e) => setTimeEdit({ ...timeEdit, start: e.target.value })} /></div>
              <div className="grid gap-2"><Label>End Time</Label><Input type="time" value={timeEdit.end} onChange={(e) => setTimeEdit({ ...timeEdit, end: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTimeEdit(null)}>Cancel</Button>
            <Button onClick={applyTime} className="bg-[#2563eb] hover:bg-[#1d4ed8]">Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
