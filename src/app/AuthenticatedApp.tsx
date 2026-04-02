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
import { AIAgentPage } from "./pages/AIAgentPage";
import { StorePage } from "./pages/StorePage";
import { TemplatesPage } from "./pages/TemplatesPage";
import { TemplateBuilderPage } from "./pages/TemplateBuilderPage";
import { AuthSettingsPage } from "./pages/AuthSettingsPage";
import { AutomationsPage } from "./pages/AutomationsPage";
import { MessagingPage } from "./pages/MessagingPage";
import NotFound from "@/demo/pages/NotFound";

const queryClient = new QueryClient();

const AuthenticatedApp = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<AuthCRMLayout />}>
          <Route index element={<AIAgentPage />} />
          <Route path="leads" element={<AuthPipelinePage />} />
          <Route path="pipeline" element={<AuthPipelinePage />} />
          <Route path="borrower/:id" element={<AuthBorrowerDetail />} />
          <Route path="marketing" element={<AuthMarketingPage />} />
          <Route path="ai" element={<AIAgentPage />} />
          <Route path="store" element={<StorePage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="templates/new" element={<TemplateBuilderPage />} />
          <Route path="templates/:id/edit" element={<TemplateBuilderPage />} />
          <Route path="automations" element={<AutomationsPage />} />
          <Route path="messages" element={<MessagingPage />} />
          <Route path="settings" element={<AuthSettingsPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default AuthenticatedApp;
