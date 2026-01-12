import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Blacklist from "./pages/Blacklist";
import Servers from "./pages/Servers";
import AddEntry from "./pages/AddEntry";
import DashboardUsers from "./pages/admin/DashboardUsers";
import ServerLinking from "./pages/admin/ServerLinking";
import EnhancedStats from "./pages/admin/EnhancedStats";
import TrustedPartners from "./pages/admin/TrustedPartners";
import BotManagement from "./pages/admin/BotManagement";
import LicenseKeys from "./pages/admin/LicenseKeys";
import ClaimLicense from "./pages/ClaimLicense";
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/blacklist" element={<Blacklist />} />
        <Route path="/servers" element={<Servers />} />
        <Route path="/blacklist/add" element={<AddEntry />} />
        <Route path="/admin/users" element={<DashboardUsers />} />
        <Route path="/admin/server-linking" element={<ServerLinking />} />
        <Route path="/admin/stats" element={<EnhancedStats />} />
        <Route path="/admin/trusted-partners" element={<TrustedPartners />} />
        <Route path="/admin/bot-management" element={<BotManagement />} />
        <Route path="/admin/license-keys" element={<LicenseKeys />} />
        <Route path="/claim-license" element={<ClaimLicense />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
