
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { InvoiceProvider } from '@/features/invoices';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ThemeProvider } from '@/contexts/ThemeContext';
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
  const { user, loading: authLoading } = useAuth();
  const [hasCompletedSetup, setHasCompletedSetup] = useState<boolean | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);

  console.log('AppContent render:', { user: !!user, authLoading, hasCompletedSetup, setupLoading });

  useEffect(() => {
    const checkSetupStatus = async () => {
      console.log('Checking setup status for user:', !!user);
      
      if (!user) {
        console.log('No user, setting hasCompletedSetup to null');
        setHasCompletedSetup(null);
        setSetupLoading(false);
        return;
      }

      setSetupLoading(true);
      try {
        console.log('Fetching company info for user:', user.id);
        const { data, error } = await supabase
          .from('company_info')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        console.log('Company info result:', { data, error });
        
        if (error) {
          console.error('Error fetching company info:', error);
          setHasCompletedSetup(false);
        } else {
          setHasCompletedSetup(data && data.length > 0);
        }
      } catch (error) {
        console.error('Exception checking setup status:', error);
        setHasCompletedSetup(false);
      } finally {
        setSetupLoading(false);
      }
    };

    checkSetupStatus();
  }, [user]);

  // Show loading spinner while auth is loading or while checking setup
  if (authLoading || (user && setupLoading)) {
    console.log('Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If no user, show auth page
  if (!user) {
    console.log('No user, showing Auth page');
    return <Auth />;
  }

  // If user exists but hasn't completed setup, show onboarding
  if (hasCompletedSetup === false) {
    console.log('User exists but setup not completed, showing Onboarding');
    return <Onboarding />;
  }

  // If setup status is still being checked, show loading
  if (hasCompletedSetup === null) {
    console.log('Setup status unknown, showing loading');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // User is authenticated and has completed setup
  console.log('User authenticated and setup complete, showing main app');
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
    <ThemeProvider defaultTheme="system" storageKey="simplr-invoicing-theme">
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default Index;
