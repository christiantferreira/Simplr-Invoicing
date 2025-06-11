import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OnboardingWizard from '@/components/OnboardingWizard';

const Onboarding = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user;

  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true });
    }
  }, [user, navigate]);

  if (!user) {
    return null; // Redirecting, so no need to render anything
  }

  return (
    <div className="min-h-screen bg-background">
      <OnboardingWizard user={user} />
    </div>
  );
};

export default Onboarding;
