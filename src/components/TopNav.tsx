import { Link, useNavigate } from 'react-router-dom';
import { Moon, Sun, Truck, LogOut } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export const TopNav = () => {
  const { theme, toggle } = useTheme();
  const { user, isAdmin } = useAuth();
  const nav = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    nav('/');
  };

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
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
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
