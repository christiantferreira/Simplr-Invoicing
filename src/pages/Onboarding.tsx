import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import OnboardingWizard from '@/components/OnboardingWizard';

const Onboarding = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Redirect to auth if no user
    if (!user) {
      window.location.href = '/auth';
    }
  }, [user]);

  if (!user) {
    return null;
  }

  return <OnboardingWizard />;
};

export default Onboarding;
