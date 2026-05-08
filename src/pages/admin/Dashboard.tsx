import { useQuery } from "@tanstack/react-query";
import { Calendar, CheckCircle2, Clock, Truck, TrendingUp, TrendingDown, Download } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AdminLayout from "@/layouts/AdminLayout";
import { adminApi } from "@/lib/admin-api";
import { formatINR } from "@/lib/billing";
import { Button } from "@/components/ui/button";

function Kpi({ icon: Icon, iconBg, label, value, delta, deltaUp, accent }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className={`text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded-full ${deltaUp ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"}`}>
          {deltaUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {delta}
        </div>
      </div>
      <div className="mt-4 text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-bold text-slate-900">{value}</div>
      <div className={`mt-3 h-1 rounded-full ${accent}`} />
    </div>
  );
}

export default function AdminDashboard() {
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: adminApi.vehicles.list });
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: adminApi.events.list });
  const { data: tripLogs = [] } = useQuery({ queryKey: ["driver-trip-logs"], queryFn: adminApi.tripLogs.list });

  const totalTrips = tripLogs.length;
  const completed = events.filter((e) => e.status === "completed").length;
  const inProgress = events.filter((e) => e.status === "active").length;
  const activeDays = new Set(tripLogs.map((row) => row.log_date)).size;
  const totalDistance = tripLogs.reduce(
    (sum, row) => sum + Math.max(0, Number(row.closing_meter) - Number(row.starting_meter)),
    0,
  );
  const totalRevenue = tripLogs.reduce((sum, row) => sum + Number(row.package_amount || 0), 0);

  const ownCount = vehicles.filter((v) => v.ownership === "own").length;
  const rentCount = vehicles.filter((v) => v.ownership === "rent").length;
  const agencyCount = vehicles.filter((v) => v.ownership === "agency").length;
  const totalV = vehicles.length;
  const managedPct = Math.round(((ownCount + rentCount) / Math.max(totalV, 1)) * 100);

  const donut = [
    { name: "Driver/Owner", value: ownCount, fill: "#2563eb" },
    { name: "Driver", value: rentCount, fill: "#dbe1ff" },
    { name: "Agency", value: agencyCount, fill: "#943700" },
  ];

  const monthlyMap = new Map<string, number>();
  for (const row of tripLogs) {
    const key = new Intl.DateTimeFormat("en-IN", { month: "short" }).format(new Date(row.log_date));
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1);
  }
  const monthly = [...monthlyMap.entries()].map(([m, v]) => ({ m, v }));

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Analytics Overview</h1>
            <p className="mt-1 text-slate-500">Real-time insights across events, vehicles, and personnel.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-lg gap-2 border-slate-200 bg-white">
              <Calendar className="h-4 w-4" /> Last 30 Days
            </Button>
            <Button className="rounded-lg gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white">
              <Download className="h-4 w-4" /> Export Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Kpi icon={Truck} iconBg="bg-blue-100 text-blue-600" label="Imported Trips" value={totalTrips.toLocaleString()} delta={`${activeDays} days`} deltaUp accent="bg-blue-500" />
          <Kpi icon={CheckCircle2} iconBg="bg-emerald-100 text-emerald-600" label="Completed Events" value={completed.toLocaleString()} delta={`${events.length} total`} deltaUp accent="bg-emerald-500" />
          <Kpi icon={Clock} iconBg="bg-amber-100 text-amber-600" label="Total Distance" value={`${totalDistance.toLocaleString()} km`} delta={formatINR(totalRevenue)} deltaUp accent="bg-amber-500" />
          <Kpi icon={Calendar} iconBg="bg-red-100 text-red-600" label="Tracked Vehicles" value={totalV.toLocaleString()} delta={`${inProgress} active events`} deltaUp={false} accent="bg-red-500" />
        </div>

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
                      <Cell key={i} fill={i === 6 ? "#dbe1ff" : "#2563eb"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Fleet Ownership Mix</h3>
            <div className="relative h-56 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donut} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2}>
                    {donut.map((d, i) => (<Cell key={i} fill={d.fill} />))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-2xl font-bold text-slate-900">{managedPct}%</div>
                <div className="text-xs text-slate-500">Directly Managed</div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
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
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
