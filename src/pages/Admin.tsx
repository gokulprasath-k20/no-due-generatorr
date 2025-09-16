import { useState } from 'react';
import { AdminLogin } from '@/components/AdminLogin';
import { AdminPanel } from '@/components/AdminPanel';
import { Layout } from '@/components/Layout';

const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Layout>
      {isLoggedIn ? (
        <AdminPanel onLogout={() => setIsLoggedIn(false)} />
      ) : (
        <AdminLogin onLoginSuccess={() => setIsLoggedIn(true)} />
      )}
    </Layout>
  );
};

export default Admin;