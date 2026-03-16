import './demo.css'
import { Toaster } from "@/demo/components/ui/toaster";
import { Toaster as Sonner } from "@/demo/components/ui/sonner";
import { TooltipProvider } from "@/demo/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import Application from "./pages/Application";
import NotFound from "./pages/NotFound";
import { CRMLayout } from "./crm/components/CRMLayout";
import { CRMDashboard } from "./crm/pages/CRMDashboard";
import { PipelinePage } from "./crm/pages/PipelinePage";
import { BorrowerDetail } from "./crm/pages/BorrowerDetail";
import { DocumentsPage } from "./crm/pages/DocumentsPage";
import { SpeedToLeadPage } from "./crm/pages/SpeedToLeadPage";
import { MarketingPage } from "./crm/pages/MarketingPage";
import { SettingsPage } from "./crm/pages/SettingsPage";

const queryClient = new QueryClient();

const DemoApp = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="borrower-app" element={<Application />} />
        <Route path="/" element={<CRMLayout />}>
          <Route index element={<CRMDashboard />} />
          <Route path="pipeline" element={<PipelinePage />} />
          <Route path="borrower/:id" element={<BorrowerDetail />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="automations" element={<SpeedToLeadPage />} />
          <Route path="marketing" element={<MarketingPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default DemoApp;
