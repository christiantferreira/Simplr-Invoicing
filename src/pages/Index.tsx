
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { InvoiceProvider } from '@/contexts/InvoiceContext';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import ClientsList from '@/pages/ClientsList';
import InvoicesList from '@/pages/InvoicesList';
import InvoiceEditor from '@/pages/InvoiceEditor';
import InvoicePreview from '@/pages/InvoicePreview';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import Onboarding from '@/pages/Onboarding';
import { useEffect, useState } from 'react';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasCompletedSetup, setHasCompletedSetup] = useState<boolean | null>(null);

  useEffect(() => {
    const authStatus = localStorage.getItem('simplr_auth');
    const setupStatus = localStorage.getItem('simplr_company_setup');
    
    setIsAuthenticated(!!authStatus);
    setHasCompletedSetup(!!setupStatus);
  }, []);

  if (isAuthenticated === null || hasCompletedSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  if (!hasCompletedSetup) {
    return <Onboarding />;
  }

  return (
    <InvoiceProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<ClientsList />} />
          <Route path="/invoices" element={<InvoicesList />} />
          <Route path="/invoices/new" element={<InvoiceEditor />} />
          <Route path="/invoices/:id/edit" element={<InvoiceEditor />} />
          <Route path="/invoices/:id/preview" element={<InvoicePreview />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </InvoiceProvider>
  );
};

export default Index;
