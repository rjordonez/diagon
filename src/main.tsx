import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import DemoApp from './demo/DemoApp.tsx'
import AuthenticatedApp from './app/AuthenticatedApp.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { BorrowerLoginPage } from './pages/BorrowerLoginPage.tsx'
import { BorrowerUploadPage } from './pages/BorrowerUploadPage.tsx'
import { AuthProvider, useAuth } from './lib/AuthContext.tsx'

const PortalApp = lazy(() => import('./portal/PortalApp.tsx'))

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-sm text-muted-foreground">Loading...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const BorrowerProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-sm text-muted-foreground">Loading...</p></div>;
  if (!user) return <Navigate to="/portal/login" replace />;
  return <>{children}</>;
};

const LoginRoute = () => {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-sm text-muted-foreground">Loading...</p></div>;
  if (user) {
    if (profile?.role === 'borrower') return <Navigate to="/portal" replace />;
    return <Navigate to="/app" replace />;
  }
  return <LoginPage />;
};

const BorrowerLoginRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-sm text-muted-foreground">Loading...</p></div>;
  if (user) return <Navigate to="/portal" replace />;
  return <BorrowerLoginPage />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><p className="text-sm text-muted-foreground">Loading...</p></div>}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/portal/login" element={<BorrowerLoginRoute />} />
            <Route path="/upload/:token" element={<BorrowerUploadPage />} />
            <Route path="/demo/*" element={<DemoApp />} />
            <Route path="/portal/*" element={
              <BorrowerProtectedRoute>
                <PortalApp />
              </BorrowerProtectedRoute>
            } />
            <Route path="/app/*" element={
              <ProtectedRoute>
                <AuthenticatedApp />
              </ProtectedRoute>
            } />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
