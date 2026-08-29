import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { token, loading, user } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  if (!token) {
    sessionStorage.setItem('redirectUrl', location.pathname);
    return <Navigate to="/login" replace />;
  }

  const isOrgSetupPage = location.pathname === '/org/setup';
  const isInvitePage = location.pathname.startsWith('/invite/');

  if (user && !user.org_id) {
    if (!isOrgSetupPage && !isInvitePage) {
      return <Navigate to="/org/setup" replace />;
    }
  } else if (user && user.org_id) {
    if (isOrgSetupPage) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
