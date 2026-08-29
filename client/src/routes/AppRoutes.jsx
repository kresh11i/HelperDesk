import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "../contexts/ToastContext";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Tickets from "../pages/Tickets";
import TicketDetails from "../pages/TicketDetails";
import CreateTicket from "../pages/CreateTicket";
import KnowledgeBase from "../pages/KnowledgeBase";
import Team from "../pages/Team";
import Account from "../pages/Account";
import NotFound from "../pages/NotFound";
import AcceptInvite from "../pages/AcceptInvite";
import OrgSetup from "../pages/OrgSetup";
import DashboardLayout from "../layouts/DashboardLayout";

function AppRoutes() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/invite/:token" element={<ProtectedRoute><AcceptInvite /></ProtectedRoute>} />
            <Route path="/org/setup" element={<ProtectedRoute><OrgSetup /></ProtectedRoute>} />
            
            {/* Dashboard Routes wrapped in Layout */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/tickets" element={<ProtectedRoute><DashboardLayout><Tickets /></DashboardLayout></ProtectedRoute>} />
            <Route path="/tickets/:id" element={<ProtectedRoute><DashboardLayout><Tickets /></DashboardLayout></ProtectedRoute>} />
            <Route path="/create" element={<ProtectedRoute><DashboardLayout><CreateTicket /></DashboardLayout></ProtectedRoute>} />
            <Route path="/knowledge-base" element={<ProtectedRoute><DashboardLayout><KnowledgeBase /></DashboardLayout></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><DashboardLayout><Team /></DashboardLayout></ProtectedRoute>} />
            
            <Route path="/account" element={<ProtectedRoute><DashboardLayout><Account /></DashboardLayout></ProtectedRoute>} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default AppRoutes;
