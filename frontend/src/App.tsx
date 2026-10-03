import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import { usePermissions } from './hooks/usePermissions';
import type { Module } from './config/permissions';
import { Menu, Shield } from 'lucide-react';
import { Loader, NetworkStatusBanner } from './components/ui';
import { Tooltip } from './components/Tooltip';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DisastersPage = lazy(() => import('./pages/disasters'));
const SOSPage = lazy(() => import('./pages/sos'));
const SheltersPage = lazy(() => import('./pages/shelters'));
const MissingPersonsPage = lazy(() => import('./pages/missing-persons'));
const VolunteersPage = lazy(() => import('./pages/volunteers'));
const RescueTeamsPage = lazy(() => import('./pages/rescue-teams'));
const ResourcesPage = lazy(() => import('./pages/resources'));
const AlertsPage = lazy(() => import('./pages/alerts'));
const NotificationsPage = lazy(() => import('./pages/notifications'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const AccessDeniedPage = lazy(() => import('./pages/AccessDeniedPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
import ProfileModal from './components/ProfileModal';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader variant="page" text="Authenticating user session..." subtext="Verifying security credentials..." />
    </div>
  );
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user } = useAuth();
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="app-layout">
      {/* Mobile Header Bar */}
      <header className="mobile-topbar">
        <button 
          type="button" 
          className="mobile-menu-btn" 
          onClick={() => setIsMobileNavOpen(true)}
          aria-label="Open Navigation Menu"
        >
          <Menu size={22} />
        </button>

        <div className="mobile-brand">
          <div className="mobile-brand-icon">
            <Shield size={18} color="white" />
          </div>
          <span className="mobile-brand-text">DisasterConnect</span>
        </div>

        <div 
          className="mobile-user-avatar" 
          onClick={() => setIsProfileOpen(true)}
          style={{ cursor: 'pointer' }}
          title="Edit Profile Settings"
        >
          {user?.profilePhoto ? (
            <img 
              src={user.profilePhoto} 
              alt="Profile" 
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
            />
          ) : (
            initials
          )}
        </div>
      </header>

      <Sidebar isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
      <main className="main-content">{children}</main>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
};

const ModuleRoute: React.FC<{ module: Module; children: React.ReactNode }> = ({ module, children }) => {
  const { canAccessModule } = usePermissions();
  return canAccessModule(module)
    ? <AppLayout>{children}</AppLayout>
    : <Navigate to="/access-denied" replace />;
};

const App: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader variant="page" text="Authenticating user session..." subtext="Verifying security credentials..." />
      </div>
    );
  }

  return (
    <>
      <NetworkStatusBanner />
      <Suspense fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader variant="page" text="Loading secure module..." subtext="Accessing emergency systems..." />
        </div>
      }>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/access-denied" element={<ProtectedRoute><AccessDeniedPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><ModuleRoute module="dashboard"><DashboardPage /></ModuleRoute></ProtectedRoute>} />

          <Route path="/disasters" element={<ProtectedRoute><ModuleRoute module="disasters"><DisastersPage /></ModuleRoute></ProtectedRoute>} />
          <Route path="/disasters/add" element={<ProtectedRoute><ModuleRoute module="disasters"><DisastersPage initialView="form" /></ModuleRoute></ProtectedRoute>} />
          <Route path="/disasters/edit/:id" element={<ProtectedRoute><ModuleRoute module="disasters"><DisastersPage initialView="form" /></ModuleRoute></ProtectedRoute>} />

          <Route path="/sos" element={<ProtectedRoute><ModuleRoute module="sos"><SOSPage /></ModuleRoute></ProtectedRoute>} />
          <Route path="/sos/add" element={<ProtectedRoute><ModuleRoute module="sos"><SOSPage initialView="form" /></ModuleRoute></ProtectedRoute>} />

          <Route path="/shelters" element={<ProtectedRoute><ModuleRoute module="shelters"><SheltersPage /></ModuleRoute></ProtectedRoute>} />
          <Route path="/shelters/add" element={<ProtectedRoute><ModuleRoute module="shelters"><SheltersPage initialView="form" /></ModuleRoute></ProtectedRoute>} />
          <Route path="/shelters/edit/:id" element={<ProtectedRoute><ModuleRoute module="shelters"><SheltersPage initialView="form" /></ModuleRoute></ProtectedRoute>} />

          <Route path="/missing-persons" element={<ProtectedRoute><ModuleRoute module="missing-persons"><MissingPersonsPage /></ModuleRoute></ProtectedRoute>} />
          <Route path="/missing-persons/add" element={<ProtectedRoute><ModuleRoute module="missing-persons"><MissingPersonsPage initialView="form" /></ModuleRoute></ProtectedRoute>} />
          <Route path="/missing-persons/edit/:id" element={<ProtectedRoute><ModuleRoute module="missing-persons"><MissingPersonsPage initialView="form" /></ModuleRoute></ProtectedRoute>} />

          <Route path="/volunteers" element={<ProtectedRoute><ModuleRoute module="volunteers"><VolunteersPage /></ModuleRoute></ProtectedRoute>} />
          <Route path="/volunteers/add" element={<ProtectedRoute><ModuleRoute module="volunteers"><VolunteersPage initialView="form" /></ModuleRoute></ProtectedRoute>} />
          <Route path="/volunteers/edit/:id" element={<ProtectedRoute><ModuleRoute module="volunteers"><VolunteersPage initialView="form" /></ModuleRoute></ProtectedRoute>} />

          <Route path="/rescue-teams" element={<ProtectedRoute><ModuleRoute module="rescue-teams"><RescueTeamsPage /></ModuleRoute></ProtectedRoute>} />
          <Route path="/rescue-teams/add" element={<ProtectedRoute><ModuleRoute module="rescue-teams"><RescueTeamsPage initialView="form" /></ModuleRoute></ProtectedRoute>} />
          <Route path="/rescue-teams/edit/:id" element={<ProtectedRoute><ModuleRoute module="rescue-teams"><RescueTeamsPage initialView="form" /></ModuleRoute></ProtectedRoute>} />

          <Route path="/resources" element={<ProtectedRoute><ModuleRoute module="resources"><ResourcesPage /></ModuleRoute></ProtectedRoute>} />
          <Route path="/resources/add" element={<ProtectedRoute><ModuleRoute module="resources"><ResourcesPage initialView="form" /></ModuleRoute></ProtectedRoute>} />
          <Route path="/resources/edit/:id" element={<ProtectedRoute><ModuleRoute module="resources"><ResourcesPage initialView="form" /></ModuleRoute></ProtectedRoute>} />

          <Route path="/alerts" element={<ProtectedRoute><ModuleRoute module="alerts"><AlertsPage /></ModuleRoute></ProtectedRoute>} />
          <Route path="/alerts/add" element={<ProtectedRoute><ModuleRoute module="alerts"><AlertsPage initialView="form" /></ModuleRoute></ProtectedRoute>} />
          <Route path="/alerts/edit/:id" element={<ProtectedRoute><ModuleRoute module="alerts"><AlertsPage initialView="form" /></ModuleRoute></ProtectedRoute>} />

          <Route path="/notifications" element={<ProtectedRoute><AppLayout><NotificationsPage /></AppLayout></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><ModuleRoute module="users"><UsersPage /></ModuleRoute></ProtectedRoute>} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Tooltip />
    </>
  );
};

export default App;
