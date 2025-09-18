import { useState, useEffect } from 'react';
import { AdminLogin } from '@/components/AdminLogin';
import { AdminPanel } from '@/components/AdminPanel';
import { Layout } from '@/components/Layout';

const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if admin is already logged in (from localStorage)
    const adminSession = localStorage.getItem('admin_session');
    if (adminSession) {
      const session = JSON.parse(adminSession);
      // Check if session is still valid (24 hours)
      const now = new Date().getTime();
      if (session.expiry > now) {
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem('admin_session');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    // Set session with 24-hour expiry
    const expiry = new Date().getTime() + (24 * 60 * 60 * 1000);
    localStorage.setItem('admin_session', JSON.stringify({ expiry }));
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    setIsLoggedIn(false);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {isLoggedIn ? (
        <AdminPanel onLogout={handleLogout} />
      ) : (
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
      )}
    </Layout>
  );
};

export default Admin;