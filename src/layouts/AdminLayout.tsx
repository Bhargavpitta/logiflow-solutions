import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Building2,
  Truck,
  Plus,
  HelpCircle,
  LogOut,
  Search,
  Bell,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/events", label: "Events", icon: Calendar },
  { to: "/admin/emc", label: "EMC", icon: Building2 },
  { to: "/admin/logistics", label: "Logistics", icon: Truck },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, setUser } = useAuth();
  const nav = useNavigate();

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {}
    setUser(null);
    nav("/auth");
  };

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563eb] text-white font-bold">L</div>
        <div>
          <div className="text-xl font-bold text-[#2563eb] leading-tight">LogiManage</div>
          <div className="text-xs text-slate-500">Enterprise Logistics</div>
        </div>
      </div>

      <div className="px-4">
        <Button
          onClick={() => { nav("/admin/events?new=1"); onNavigate?.(); }}
          className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl h-11 gap-2 font-semibold"
        >
          <Plus className="h-4 w-4" /> New Event
        </Button>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#dbe1ff] text-[#2563eb]"
                    : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 px-3 py-4 space-y-1">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
          <HelpCircle className="h-5 w-5" /> Help
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          <LogOut className="h-5 w-5" /> Logout
        </button>
      </div>
    </div>
  );
}

function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, setUser } = useAuth();
  const nav = useNavigate();
  const initials = (user?.name || user?.email || "U").slice(0, 1).toUpperCase();

  const logout = async () => {
    try { await apiFetch("/auth/logout", { method: "POST" }); } catch {}
    setUser(null);
    toast.success("Signed out");
    nav("/auth");
  };

  return (
    <header className="flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 md:px-6 sticky top-0 z-30">
      <button onClick={onMenuClick} className="md:hidden p-2 rounded-lg hover:bg-slate-100">
        <Menu className="h-5 w-5" />
      </button>
      <div className="relative flex-1 max-w-2xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search logistics, events, or drivers..." className="pl-10 h-10 rounded-lg border-slate-200 bg-slate-50 focus:bg-white" />
      </div>
      <div className="hidden md:flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-slate-100"><Bell className="h-5 w-5 text-slate-600" /></button>
        <button className="p-2 rounded-lg hover:bg-slate-100"><Settings className="h-5 w-5 text-slate-600" /></button>
        <span className="h-6 w-px bg-slate-200 mx-1" />
        <button className="text-sm font-medium text-slate-700 hover:text-[#2563eb] px-2">Support</button>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center">
            <Avatar className="h-9 w-9">
              {user?.avatar_url ? <AvatarImage src={user.avatar_url} /> : null}
              <AvatarFallback className="bg-[#2563eb] text-white text-sm font-semibold">{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="font-medium">{user?.name}</div>
            <div className="text-xs text-slate-500 font-normal">{user?.email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [loc.pathname]);

  useEffect(() => {
    if (!loading && !user) nav("/auth");
    else if (!loading && user && !isAdmin) nav("/my");
  }, [loading, user, isAdmin, nav]);

  if (loading || !user || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center bg-[#faf8ff] text-slate-600">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] text-slate-900 font-sans" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 border-r border-slate-200 min-h-screen sticky top-0">
          <SidebarContent />
        </aside>

        {/* Mobile sidebar */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="p-0 w-72">
            <SidebarContent onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar onMenuClick={() => setOpen(true)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
