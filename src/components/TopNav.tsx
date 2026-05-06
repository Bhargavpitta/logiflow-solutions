import { Link, useNavigate } from 'react-router-dom';
import { Moon, Sun, Truck, LogOut, User as UserIcon } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const TopNav = () => {
  const { theme, toggle } = useTheme();
  const { user, isAdmin } = useAuth();
  const nav = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    nav('/');
  };

  const initial = (user?.user_metadata?.name || user?.email || '?').charAt(0).toUpperCase();
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0];
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/50">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Truck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="font-bold text-lg tracking-tight">
            OneHmt <span className="text-gradient">Logistics</span>
          </div>
        </Link>
        <nav className="flex items-center gap-2">
          {user && (
            <>
              {isAdmin ? (
                <Link to="/dashboard" className="text-sm font-medium px-3 py-2 rounded-md hover:bg-accent transition">Dashboard</Link>
              ) : (
                <Link to="/my" className="text-sm font-medium px-3 py-2 rounded-md hover:bg-accent transition">My Entries</Link>
              )}
              <Link to="/entry" className="text-sm font-medium px-3 py-2 rounded-md hover:bg-accent transition">New Entry</Link>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Account"
                  className="h-9 w-9 rounded-full bg-gradient-primary text-primary-foreground font-semibold text-sm flex items-center justify-center shadow-glow overflow-hidden ring-2 ring-background hover:opacity-90 transition"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Account" className="h-full w-full object-cover" />
                  ) : (
                    initial
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-0 overflow-hidden">
                {/* Google-style account header */}
                <div className="flex flex-col items-center text-center px-5 pt-5 pb-4 bg-accent/30">
                  <div className="h-14 w-14 rounded-full bg-gradient-primary text-primary-foreground font-semibold text-xl flex items-center justify-center mb-2 overflow-hidden">
                    {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initial}
                  </div>
                  <div className="font-semibold text-sm">Hi, {displayName} 👋</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-full">{user.email}</div>
                  {isAdmin && (
                    <span className="mt-2 inline-flex text-[10px] uppercase tracking-wider font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Administrator
                    </span>
                  )}
                </div>
                <DropdownMenuSeparator className="m-0" />
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground px-3 pt-2">Account</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to={isAdmin ? '/dashboard' : '/my'} className="cursor-pointer">
                    <UserIcon className="h-4 w-4 mr-2" /> My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" size="sm" className="bg-gradient-primary shadow-glow">
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};
