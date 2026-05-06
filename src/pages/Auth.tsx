import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TopNav } from '@/components/TopNav';
import { toast } from 'sonner';
import { ArrowRight, Truck } from 'lucide-react';

const emailSchema = z.string().trim().email('Invalid email').max(255);
const passwordSchema = z.string().min(6, 'Min 6 characters').max(128);
const nameSchema = z.string().trim().min(1, 'Required').max(100);

const Auth = () => {
  const nav = useNavigate();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) nav('/dashboard'); });
  }, [nav]);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const email = emailSchema.parse(form.email);
      const password = passwordSchema.parse(form.password);
      if (tab === 'signup') {
        const name = nameSchema.parse(form.name);
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { name } },
        });
        if (error) throw error;
        toast.success('Account created — signing you in.');
        nav('/dashboard');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back.');
        nav('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="container grid lg:grid-cols-2 gap-12 py-12 lg:py-20 items-center">
        <div className="space-y-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 glass px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider">
            <Truck className="h-3 w-3" /> Secure Console Access
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
            Architect-level precision for global operations.
          </h1>
          <p className="text-muted-foreground text-lg">
            Orchestrate complex logistics with unparalleled clarity and control.
          </p>
          <div className="space-y-2 font-mono text-xs uppercase tracking-wider">
            <div><span className="text-tertiary">●</span> SYS_CORE_ONLINE :: LATENCY 12MS</div>
            <div className="text-muted-foreground"><span className="text-tertiary">●</span> GLOBAL_FLEET_SYNC :: ACTIVE</div>
          </div>
        </div>

        <div className="glass-strong rounded-3xl p-8 animate-scale-in">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <div className="space-y-2 mb-6">
              <h2 className="text-3xl font-bold">{tab === 'signin' ? 'Welcome Back' : 'Create Account'}</h2>
              <p className="text-sm text-muted-foreground">
                {tab === 'signin' ? 'Sign in to access your dashboard.' : 'All new accounts default to USER role.'}
              </p>
            </div>
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <form onSubmit={handle} className="space-y-4">
              <TabsContent value="signup" className="m-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" required={tab === 'signup'} value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
                </div>
              </TabsContent>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@company.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-glow h-11">
                {loading ? 'Processing…' : tab === 'signin' ? 'Sign In' : 'Create Account'}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">OR</span></div>
            </div>
              <Button
              type="button"
              variant="outline"
              className="w-full h-11 mb-4 gap-2"
              onClick={async () => {
                const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin + '/dashboard' });
                if (result.error) toast.error(result.error.message ?? 'Google sign-in failed');
                else if (!result.redirected) nav('/dashboard');
              }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </Button>
            </form>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;
