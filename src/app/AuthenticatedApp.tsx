import "@/demo/demo.css";
import { Toaster } from "@/demo/components/ui/toaster";
import { Toaster as Sonner } from "@/demo/components/ui/sonner";
import { TooltipProvider } from "@/demo/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AuthCRMLayout } from "./AuthCRMLayout";
import { AuthDashboard } from "./pages/AuthDashboard";
import { AuthPipelinePage } from "./pages/AuthPipelinePage";
import { AuthBorrowerDetail } from "./pages/AuthBorrowerDetail";
import { AuthMarketingPage } from "./pages/AuthMarketingPage";
import { AuthSettingsPage } from "./pages/AuthSettingsPage";
import NotFound from "@/demo/pages/NotFound";

const queryClient = new QueryClient();

const AuthenticatedApp = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<AuthCRMLayout />}>
          <Route index element={<AuthDashboard />} />
          <Route path="pipeline" element={<AuthPipelinePage />} />
          <Route path="borrower/:id" element={<AuthBorrowerDetail />} />
          <Route path="marketing" element={<AuthMarketingPage />} />
          <Route path="settings" element={<AuthSettingsPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default AuthenticatedApp;
