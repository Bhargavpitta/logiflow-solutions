import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { ArrowRight, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopNav } from "@/components/TopNav";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch, type AppUser } from "@/lib/api";
import { requestGoogleAccessToken } from "@/lib/google";
import { toast } from "sonner";

const emailSchema = z.string().trim().min(1, "Required").max(255);
const passwordSchema = z.string().min(6, "Min 6 characters").max(128);
const nameSchema = z.string().trim().min(1, "Required").max(100);

const Auth = () => {
  const nav = useNavigate();
  const { user, loading: authLoading, setUser } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    if (!authLoading && user) {
      nav(user.role === "admin" ? "/dashboard" : "/my");
    }
  }, [authLoading, nav, user]);

  const finishAuth = (nextUser: AppUser) => {
    setUser(nextUser);
    nav(nextUser.role === "admin" ? "/dashboard" : "/my");
  };

  const handle = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const email = emailSchema.parse(form.email);
      const password = passwordSchema.parse(form.password);

      if (tab === "signup") {
        const name = nameSchema.parse(form.name);
        const data = await apiFetch<{ user: AppUser }>("/auth/signup", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
        toast.success("Account created and signed in.");
        finishAuth(data.user);
      } else {
        const data = await apiFetch<{ user: AppUser }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        toast.success("Welcome back.");
        finishAuth(data.user);
      }
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast.error("Missing VITE_GOOGLE_CLIENT_ID in .env");
      return;
    }

    setGoogleLoading(true);
    try {
      const accessToken = await requestGoogleAccessToken(clientId);
      const data = await apiFetch<{ user: AppUser }>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ accessToken }),
      });
      toast.success("Signed in with Google.");
      finishAuth(data.user);
    } catch (err: any) {
      toast.error(err.message ?? "Google sign-in failed");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="container py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_480px]">
          <section className="section-shell relative hidden overflow-hidden lg:block">
            <div className="hero-shape left-8 top-8 h-28 w-28 bg-orange-200/60" />
            <div className="hero-shape bottom-12 right-10 h-24 w-24 bg-emerald-200/60" />
            <div className="relative space-y-8">
              <div className="eyebrow">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure access
              </div>
              <div className="space-y-4">
                <h1 className="max-w-2xl text-4xl font-extrabold leading-tight lg:text-5xl">
                  Sign in to manage trips, billing, and exports from one place.
                </h1>
                <p className="max-w-xl text-lg leading-7 text-muted-foreground">
                  This workspace is built for daily logistics operations, with role-based access for admins and
                  straightforward entry management for users.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <AuthStat value="7 days" label="Session validity" />
                <AuthStat value="2 modes" label="Email or Google" />
                <AuthStat value="Role based" label="Admin and user access" />
              </div>

              <div className="surface-muted grid gap-5 p-5 sm:grid-cols-2">
                <div>
                  <div className="text-sm font-semibold text-secondary">For admins</div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Review all trips, generate invoices, export Excel sheets, and monitor operational totals.
                  </p>
                </div>
                <div>
                  <div className="text-sm font-semibold text-secondary">For users</div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Record trip details, edit your own entries, and keep billing inputs clean for approval.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="surface-card p-6 sm:p-8">
            <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
              <div className="mb-6 space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  <Truck className="h-3.5 w-3.5" />
                  Workspace login
                </div>
                <h2 className="text-3xl font-extrabold">{tab === "signin" ? "Welcome back" : "Create your account"}</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {tab === "signin"
                    ? "Use your email and password or continue with Google."
                    : "New accounts are created with user access by default."}
                </p>
              </div>

              <TabsList className="mb-6 grid h-12 grid-cols-2 rounded-2xl bg-accent/80 p-1">
                <TabsTrigger value="signin" className="rounded-xl">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-xl">Sign Up</TabsTrigger>
              </TabsList>

              <form onSubmit={handle} className="space-y-4">
                <TabsContent value="signup" className="m-0 space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-foreground">Full name</Label>
                  <Input
                    id="name"
                    required={tab === "signup"}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="h-12 rounded-2xl"
                  />
                </TabsContent>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">Email / Username</Label>
                  <Input
                    id="email"
                    type="text"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="admin or user@company.com"
                    className="h-12 rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Enter your password"
                    className="h-12 rounded-2xl"
                  />
                </div>

                <Button type="submit" disabled={loading} className="h-12 w-full rounded-2xl">
                  {loading ? "Processing..." : tab === "signin" ? "Sign In" : "Create Account"}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-[0.18em]">
                    <span className="bg-card px-3 text-muted-foreground">or continue</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full rounded-2xl gap-2"
                  disabled={googleLoading}
                  onClick={handleGoogleSignIn}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {googleLoading ? "Opening Google..." : "Continue with Google"}
                </Button>
              </form>
            </Tabs>
          </section>
        </div>
      </div>
    </div>
  );
};

const AuthStat = ({ value, label }: { value: string; label: string }) => (
  <div className="surface-muted p-4">
    <div className="text-2xl font-extrabold text-secondary">{value}</div>
    <div className="mt-1 text-sm text-muted-foreground">{label}</div>
  </div>
);

export default Auth;
