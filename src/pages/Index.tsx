import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { InvoiceProvider } from '@/features/invoices';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { useEffect, useState, Suspense } from 'react';
import {
  LazyDashboard,
  LazyClientsList,
  LazyInvoicesList,
  LazyInvoiceEditor,
  LazyInvoicePreview,
  LazySettings,
  LazyAuth,
  LazyOnboarding,
  LazyWaitingForVerification,
} from '@/components/LazyComponents';

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
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>}>
        <LazyAuth />
      </Suspense>
    );
  }

  // If user exists but hasn't completed setup, show onboarding
  if (hasCompletedSetup === false) {
    console.log('User exists but setup not completed, showing Onboarding');
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>}>
        <LazyOnboarding />
      </Suspense>
    );
  }

  // If user exists but email is not verified, show waiting for verification
  if (user && !user.email_confirmed_at) {
    console.log('User exists but email not verified, showing WaitingForVerification');
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>}>
        <LazyWaitingForVerification />
      </Suspense>
    );
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
        <Suspense fallback={<div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>}>
          <Routes>
            <Route path="/" element={<LazyDashboard />} />
            <Route path="/clients" element={<LazyClientsList />} />
            <Route path="/invoices" element={<LazyInvoicesList />} />
            <Route path="/invoices/new" element={<LazyInvoiceEditor />} />
            <Route path="/invoices/:id/edit" element={<LazyInvoiceEditor />} />
            <Route path="/invoices/:id/preview" element={<LazyInvoicePreview />} />
            <Route path="/settings" element={<LazySettings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
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
