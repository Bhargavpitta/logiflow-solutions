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
            </form>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;
