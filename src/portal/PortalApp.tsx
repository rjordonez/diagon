import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { PortalLayout } from "./PortalLayout";
import { PortalDashboard } from "./pages/PortalDashboard";
import { ApplicationPage } from "./pages/ApplicationPage";
import { QuotePage } from "./pages/QuotePage";
import { InvitePage } from "./pages/InvitePage";

const queryClient = new QueryClient();

const PortalApp = () => (
  <QueryClientProvider client={queryClient}>
    <Routes>
      <Route path="invite/:token" element={<InvitePage />} />
      <Route path="/" element={<PortalLayout />}>
        <Route index element={<PortalDashboard />} />
        <Route path="application" element={<ApplicationPage />} />
        <Route path="application/:id" element={<ApplicationPage />} />
        <Route path="quote" element={<QuotePage />} />
        <Route path="quote/:id" element={<QuotePage />} />
      </Route>
    </Routes>
  </QueryClientProvider>
);

export default PortalApp;
