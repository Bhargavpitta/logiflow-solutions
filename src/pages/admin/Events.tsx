import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Trash2, Pencil, Filter, ChevronDown, ChevronUp } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminApi, type EventRow, type Vehicle, type Driver, LOCATIONS, RATE_CARDS } from "@/lib/admin-api";
import { toast } from "sonner";

interface DraftBooking {
  id?: string;
  vehicle_id: string;
  day_date: string;
  start_time?: string | null;
  end_time?: string | null;
  driver_id?: string | null;
  starting_meter?: string;
  ending_meter?: string;
  rate_card?: string | null;
  reporting_time?: string | null;
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
  return {
    name: "",
    from_date: "",
    to_date: "",
    host_id: "",
    event_company_id: "",
    location: "",
    status: "pending",
  };
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    active: "bg-blue-50 text-blue-700 border-blue-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    cancelled: "bg-red-50 text-red-600 border-red-200",
  };
  return map[status] || "bg-slate-100 text-slate-600 border-slate-200";
}

function VehicleAssignmentCard({
  booking,
  vehicles,
  drivers,
  onUpdate,
  onRemove,
}: {
  booking: DraftBooking & { _idx: number };
  vehicles: Vehicle[];
  drivers: Driver[];
  onUpdate: (idx: number, patch: Partial<DraftBooking>) => void;
  onRemove: (idx: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const v = vehicles.find((x) => x.id === booking.vehicle_id);
  const vehicleLabel = v ? `${v.vehicle_name} (${v.vehicle_number})` : booking.vehicle_id;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between px-3 py-2">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 text-sm font-medium text-slate-900 flex-1 text-left">
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          {vehicleLabel}
        </button>
        <Button size="icon" variant="ghost" onClick={() => onRemove(booking._idx)}><X className="h-4 w-4" /></Button>
      </div>
      {expanded && (
        <div className="px-3 pb-3 grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1.5">
              <Label className="text-xs">Starting Time</Label>
              <Input type="time" value={booking.start_time || ""} onChange={(e) => onUpdate(booking._idx, { start_time: e.target.value })} className="h-8 text-xs" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Ending Time</Label>
              <Input type="time" value={booking.end_time || ""} onChange={(e) => onUpdate(booking._idx, { end_time: e.target.value })} className="h-8 text-xs" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1.5">
              <Label className="text-xs">Starting Meter Reading</Label>
              <Input type="number" value={booking.starting_meter || ""} onChange={(e) => onUpdate(booking._idx, { starting_meter: e.target.value })} className="h-8 text-xs" placeholder="km" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Ending Meter Reading</Label>
              <Input type="number" value={booking.ending_meter || ""} onChange={(e) => onUpdate(booking._idx, { ending_meter: e.target.value })} className="h-8 text-xs" placeholder="km (editable later)" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Driver</Label>
            <Select value={booking.driver_id || "__none__"} onValueChange={(v) => onUpdate(booking._idx, { driver_id: v === "__none__" ? null : v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select driver" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— No driver —</SelectItem>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.driver_name}{d.agency_name ? ` (${d.agency_name})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1.5">
              <Label className="text-xs">Rate Card</Label>
              <Select value={booking.rate_card || ""} onValueChange={(v) => onUpdate(booking._idx, { rate_card: v || null })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select rate" /></SelectTrigger>
                <SelectContent>
                  {RATE_CARDS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Reporting Time</Label>
              <Input type="time" value={booking.reporting_time || ""} onChange={(e) => onUpdate(booking._idx, { reporting_time: e.target.value })} className="h-8 text-xs" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Events() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [bookings, setBookings] = useState<DraftBooking[]>([]);
  const [vehiclePicker, setVehiclePicker] = useState<{ day: string } | null>(null);

  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: adminApi.events.list });
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: adminApi.vehicles.list });
  const { data: drivers = [] } = useQuery({ queryKey: ["drivers"], queryFn: adminApi.drivers.list });
  const { data: hosts = [] } = useQuery({ queryKey: ["hosts"], queryFn: adminApi.hosts.list });
  const { data: companies = [] } = useQuery({ queryKey: ["emc"], queryFn: adminApi.emc.list });

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
      host_id: e.host_id || "",
      event_company_id: e.event_company_id || "",
      location: e.location || "",
      status: e.status,
    });
    setBookings(e.vehicles.map((v) => ({
      id: v.id,
      vehicle_id: v.vehicle_id,
      day_date: v.day_date.slice(0, 10),
      start_time: v.start_time,
      end_time: v.end_time,
      driver_id: v.driver_id,
      starting_meter: v.starting_meter != null ? String(v.starting_meter) : "",
      ending_meter: v.ending_meter != null ? String(v.ending_meter) : "",
      rate_card: v.rate_card,
      reporting_time: v.reporting_time,
    })));
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        ...draft,
        host_id: draft.host_id || null,
        event_company_id: draft.event_company_id || null,
        location: draft.location || null,
        vehicles: bookings.map(({ id, ...b }) => ({
          ...b,
          starting_meter: b.starting_meter ? Number(b.starting_meter) : null,
          ending_meter: b.ending_meter ? Number(b.ending_meter) : null,
        })),
      };
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

  function updateBooking(idx: number, patch: Partial<DraftBooking>) {
    setBookings(bookings.map((b, i) => i === idx ? { ...b, ...patch } : b));
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Events</h1>
            <p className="mt-1 text-slate-500">Plan, assign vehicles and drivers, and track event logistics.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-lg gap-2"><Filter className="h-4 w-4" /> Filter</Button>
            <Button onClick={openCreate} className="bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg gap-2">
              <Plus className="h-4 w-4" /> Create Event
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead>Event Name</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Event Company</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Vehicles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="py-8 text-center text-slate-500">No events yet. Click Create Event to get started.</TableCell></TableRow>
                ) : events.map((e) => (
                  <TableRow key={e.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium text-slate-900">{e.name}</TableCell>
                    <TableCell>{e.host_name || "—"}</TableCell>
                    <TableCell>{e.event_company_name || "—"}</TableCell>
                    <TableCell>{new Date(e.from_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(e.to_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {e.location ? (
                        <span className="inline-flex text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{e.location}</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>{e.vehicles.length}</TableCell>
                    <TableCell>
                      <span className={`inline-flex text-xs px-2 py-1 rounded-full font-medium border ${statusBadge(e.status)}`}>{e.status}</span>
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

      {/* Create / Edit Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit Event" : "Create Event"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 grid gap-5">
            {/* Basic Info */}
            <div className="grid gap-2">
              <Label>Event Name</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Enter event name" />
            </div>
            <div className="grid gap-2">
              <Label>Event Company</Label>
              <Select value={draft.event_company_id || "__none__"} onValueChange={(v) => setDraft({ ...draft, event_company_id: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select event company" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Host</Label>
              <Select value={draft.host_id || "__none__"} onValueChange={(v) => setDraft({ ...draft, host_id: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select host" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {hosts.map((h) => <SelectItem key={h.id} value={h.id}>{h.host_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>From Date</Label>
                <Input type="date" value={draft.from_date} onChange={(e) => setDraft({ ...draft, from_date: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>To Date</Label>
                <Input type="date" value={draft.to_date} onChange={(e) => setDraft({ ...draft, to_date: e.target.value, })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Location</Label>
              <Select value={draft.location} onValueChange={(v) => setDraft({ ...draft, location: v })}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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

            {/* Per-Day Vehicle Assignment */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Vehicle Assignments by Date</div>
              {days.length === 0 ? (
                <div className="text-sm text-slate-500 border border-dashed rounded-xl p-4">Select a date range above to assign vehicles per day.</div>
              ) : (
                <div className="space-y-4">
                  {days.map((day) => {
                    const dayBookings = bookings.map((b, i) => ({ ...b, _idx: i })).filter((b) => b.day_date === day);
                    return (
                      <div key={day} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-semibold text-slate-900">
                            {new Date(day + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                          </div>
                          <Button size="sm" variant="ghost" className="text-[#2563eb] text-xs" onClick={() => setVehiclePicker({ day })}>
                            <Plus className="h-3.5 w-3.5 mr-1" /> Add Vehicle
                          </Button>
                        </div>
                        {dayBookings.length === 0 ? (
                          <div className="text-xs text-slate-400 py-1">No vehicles assigned for this day.</div>
                        ) : (
                          <div className="space-y-2">
                            {dayBookings.map((b) => (
                              <VehicleAssignmentCard
                                key={b._idx}
                                booking={b}
                                vehicles={vehicles}
                                drivers={drivers}
                                onUpdate={updateBooking}
                                onRemove={removeBooking}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => save.mutate()} disabled={save.isPending || !draft.name} className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8]">
                {save.isPending ? "Saving…" : "Save Event"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Vehicle Picker Dialog */}
      <Dialog open={!!vehiclePicker} onOpenChange={(v) => !v && setVehiclePicker(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Select a Vehicle</DialogTitle></DialogHeader>
          <div className="grid gap-2">
            {vehicles.length === 0 ? (
              <div className="py-8 text-center text-slate-500">No vehicles available. Add vehicles in the Vehicles section first.</div>
            ) : vehicles.map((v) => {
              const isAgency = v.ownership === "agency";
              return (
                <button
                  key={v.id}
                  onClick={() => addVehicle(v.id)}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-left hover:border-[#2563eb] hover:bg-blue-50 transition"
                >
                  <div>
                    <div className="font-medium text-sm">{v.vehicle_name} <span className="text-slate-500 font-normal">({v.vehicle_number})</span></div>
                    <div className="text-xs text-slate-500">{v.vehicle_type || v.vehicle_model}{v.model_year ? ` · ${v.model_year}` : ""}{v.location ? ` · ${v.location}` : ""}</div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${isAgency ? "bg-red-50 text-red-700 border-red-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                    {isAgency ? (v.agency_name ? `Agency — ${v.agency_name}` : "Agency") : "Independent"}
                  </span>
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVehiclePicker(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
