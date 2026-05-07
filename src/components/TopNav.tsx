import { Link, useNavigate } from "react-router-dom";
import { LogOut, Moon, Sun, Truck, User as UserIcon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const TopNav = () => {
  const { theme, toggle } = useTheme();
  const { user, isAdmin, setUser } = useAuth();
  const nav = useNavigate();

  const signOut = async () => {
    await apiFetch("/auth/logout", { method: "POST" });
    setUser(null);
    nav("/");
  };

  const initial = (user?.name || user?.email || "?").charAt(0).toUpperCase();
  const displayName = user?.name || user?.email?.split("@")[0];
  const avatarUrl = user?.avatar_url && user.avatar_url.trim() ? user.avatar_url : null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[var(--shadow-soft)]">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-tight text-secondary dark:text-foreground">
              OneHmt Logistics
            </div>
            <div className="hidden text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:block">
              Fleet operations workspace
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {user && (
            <>
              {isAdmin ? (
                <Link to="/dashboard" className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground">Dashboard</Link>
              ) : (
                <Link to="/my" className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground">My Entries</Link>
              )}
              <Link to="/entry" className="hidden rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground sm:inline-flex">
                New Entry
              </Link>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme" className="rounded-full">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Account"
                  className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-card text-sm font-semibold text-secondary shadow-[var(--shadow-soft)] ring-2 ring-background transition hover:-translate-y-0.5"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Account" className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 overflow-hidden p-0">
                <div className="flex flex-col items-center bg-accent/40 px-5 pb-4 pt-5 text-center">
                  <div className="mb-2 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-primary/12 text-xl font-semibold text-primary">
                    {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : <UserIcon className="h-7 w-7" />}
                  </div>
                  <div className="text-sm font-semibold">Hi, {displayName}</div>
                  <div className="mt-0.5 max-w-full truncate text-xs text-muted-foreground">{user.email}</div>
                  {isAdmin && (
                    <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      Administrator
                    </span>
                  )}
                </div>
                <DropdownMenuSeparator className="m-0" />
                <DropdownMenuLabel className="px-3 pt-2 text-xs font-normal text-muted-foreground">Account</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to={isAdmin ? "/dashboard" : "/my"} className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" /> My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" size="sm" className="rounded-full px-5">
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};
