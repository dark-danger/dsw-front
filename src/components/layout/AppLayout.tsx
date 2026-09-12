import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AppLayout: React.FC<{ allowedRoles: string[]; pageTitle: string }> = ({
  allowedRoles,
  pageTitle,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-sm font-medium text-slate-400">Loading DSW Portal...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to default route per role
    const dest = user.role === 'super_admin' ? '/admin/dashboard' : user.role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard';
    return <Navigate to={dest} replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar title={pageTitle} />
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-[#060e0a] to-[#020503]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
