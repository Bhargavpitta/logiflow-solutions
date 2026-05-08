import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import EntryForm from "./pages/EntryForm.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminDashboard from "./pages/admin/Dashboard.tsx";
import AdminEvents from "./pages/admin/Events.tsx";
import AdminEMC from "./pages/admin/EMC.tsx";
import AdminLogistics from "./pages/admin/Logistics.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<AdminDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/events" element={<AdminEvents />} />
              <Route path="/admin/emc" element={<AdminEMC />} />
              <Route path="/admin/logistics" element={<AdminLogistics />} />
              <Route path="/my" element={<Dashboard mode="user" />} />
              <Route path="/entry" element={<EntryForm />} />
              <Route path="/entry/:id" element={<EntryForm />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
