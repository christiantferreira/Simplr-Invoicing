import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OnboardingWizard from '@/components/OnboardingWizard';

const Onboarding = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user;

  useEffect(() => {
    // Redirect to auth if no user in location state
    if (!user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleFinished = () => {
    if (user?.email_confirmed_at) {
      // Email is verified, go to main app
      navigate('/', { replace: true });
    } else {
      // Email not verified, go to waiting page
      navigate('/waiting-for-verification', { replace: true });
    }
  };

  if (!user) {
    return null;
  }

  return <OnboardingWizard user={user} onFinished={handleFinished} />;
};

export default Onboarding;
