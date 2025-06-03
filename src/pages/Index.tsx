
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { InvoiceProvider } from '@/contexts/InvoiceContext';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import ClientsList from '@/pages/ClientsList';
import InvoicesList from '@/pages/InvoicesList';
import InvoiceEditor from '@/pages/InvoiceEditor';
import InvoicePreview from '@/pages/InvoicePreview';
import Settings from '@/pages/Settings';
import Auth from '@/pages/Auth';
import Onboarding from '@/pages/Onboarding';
import { useEffect, useState } from 'react';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [hasCompletedSetup, setHasCompletedSetup] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSetupStatus = async () => {
      if (user) {
        // Check if user has completed company setup in database
        const { data } = await supabase.from('company_info')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setHasCompletedSetup(!!data);
      } else {
        setHasCompletedSetup(null);
      }
    };

    checkSetupStatus();
  }, [user]);

  if (loading || hasCompletedSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
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

const Index = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default Index;
