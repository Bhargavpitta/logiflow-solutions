import { useQuery } from "@tanstack/react-query";
import {
  Calendar, CheckCircle2, Clock, Truck, TrendingUp, TrendingDown,
  Users, User, Building, AlertCircle, Activity,
} from "lucide-react";
import {
  Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import AdminLayout from "@/layouts/AdminLayout";
import { adminApi } from "@/lib/admin-api";

function Kpi({ icon: Icon, iconBg, iconColor, label, value, sub, accent }: {
  icon: any; iconBg: string; iconColor: string; label: string; value: string | number; sub?: string; accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        {sub && (
          <div className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-full">{sub}</div>
        )}
      </div>
      <div className="mt-4 text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-bold text-slate-900">{value}</div>
      <div className={`mt-3 h-1 rounded-full ${accent}`} />
    </div>
  );
}

function EventStatusKpi({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm font-medium mt-0.5">{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: analytics } = useQuery({ queryKey: ["analytics"], queryFn: adminApi.analytics.get });
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: adminApi.vehicles.list });
  const { data: tripLogs = [] } = useQuery({ queryKey: ["driver-trip-logs"], queryFn: adminApi.tripLogs.list });

  const events = analytics?.events ?? { total: 0, completed: 0, pending: 0, active: 0, cancelled: 0 };
  const totalVehicles = analytics?.vehicles ?? vehicles.length;
  const totalDrivers = analytics?.drivers ?? 0;
  const totalHosts = analytics?.hosts ?? 0;
  const totalAgencies = analytics?.agencies ?? 0;
  const totalEventCompanies = analytics?.eventCompanies ?? 0;

  const ownCount = vehicles.filter((v) => v.ownership === "own").length;
  const rentCount = vehicles.filter((v) => v.ownership === "rent").length;
  const agencyCount = vehicles.filter((v) => v.ownership === "agency").length;

  const donut = [
    { name: "Independent", value: ownCount + rentCount, fill: "#2563eb" },
    { name: "Agency", value: agencyCount, fill: "#943700" },
  ];

  const monthlyMap = new Map<string, number>();
  for (const row of tripLogs) {
    const key = new Intl.DateTimeFormat("en-IN", { month: "short" }).format(new Date(row.log_date));
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1);
  }
  const monthly = [...monthlyMap.entries()].map(([m, v]) => ({ m, v }));

  const managedPct = Math.round(((ownCount + rentCount) / Math.max(totalVehicles, 1)) * 100);

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Analytics Overview</h1>
          <p className="mt-1 text-slate-500">Real-time insights across events, vehicles, drivers, and personnel.</p>
        </div>

        {/* Event Status Cards */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Events</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <EventStatusKpi label="Total Events" value={events.total} cls="bg-blue-50 border-blue-200 text-blue-900" />
            <EventStatusKpi label="Completed" value={events.completed} cls="bg-emerald-50 border-emerald-200 text-emerald-900" />
            <EventStatusKpi label="Active" value={events.active} cls="bg-sky-50 border-sky-200 text-sky-900" />
            <EventStatusKpi label="Pending" value={events.pending} cls="bg-amber-50 border-amber-200 text-amber-900" />
          </div>
        </div>

        {/* Main KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <Kpi
            icon={Truck}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            label="Total Vehicles"
            value={totalVehicles}
            sub={`${agencyCount} agency`}
            accent="bg-blue-500"
          />
          <Kpi
            icon={User}
            iconBg="bg-violet-100"
            iconColor="text-violet-600"
            label="Total Drivers"
            value={totalDrivers}
            accent="bg-violet-500"
          />
          <Kpi
            icon={Users}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
            label="Total Hosts"
            value={totalHosts}
            accent="bg-emerald-500"
          />
          <Kpi
            icon={Building}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            label="Agencies"
            value={totalAgencies}
            accent="bg-amber-500"
          />
          <Kpi
            icon={Building}
            iconBg="bg-rose-100"
            iconColor="text-rose-600"
            label="Event Companies"
            value={totalEventCompanies}
            accent="bg-rose-500"
          />
          <Kpi
            icon={AlertCircle}
            iconBg="bg-orange-100"
            iconColor="text-orange-600"
            label="Cancelled Events"
            value={events.cancelled}
            accent="bg-orange-500"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Imported Trip Volume</h3>
            <div className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <XAxis dataKey="m" axisLine={false} tickLine={false} stroke="#94a3b8" />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: "#f1f5f9" }} />
                  <Bar dataKey="v" radius={[8, 8, 0, 0]}>
                    {monthly.map((_, i) => (
                      <Cell key={i} fill={i === monthly.length - 1 ? "#dbe1ff" : "#2563eb"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Fleet Mix</h3>
            <div className="relative h-48 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donut} dataKey="value" innerRadius={50} outerRadius={72} paddingAngle={2}>
                    {donut.map((d, i) => (<Cell key={i} fill={d.fill} />))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-2xl font-bold text-slate-900">{managedPct}%</div>
                <div className="text-xs text-slate-500">Independent</div>
              </div>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              {donut.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                    <span className="text-slate-700">{d.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900">{d.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <h4 className="text-sm font-semibold text-slate-700">Event Summary</h4>
              {[
                { label: "Completed", value: events.completed, color: "bg-emerald-500" },
                { label: "Active", value: events.active, color: "bg-sky-500" },
                { label: "Pending", value: events.pending, color: "bg-amber-500" },
                { label: "Cancelled", value: events.cancelled, color: "bg-red-400" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${s.color}`} />
                    <span className="text-slate-600">{s.label}</span>
                  </div>
                  <span className="font-semibold text-slate-900">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
