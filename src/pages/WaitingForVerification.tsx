import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/BrandLogo';

const WaitingForVerification = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);

  useEffect(() => {
    // Check if user is already verified
    if (user?.email_confirmed_at) {
      window.location.href = '/';
    }
  }, [user]);

  useEffect(() => {
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        toast.success('Email verified successfully!');
        window.location.href = '/';
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleResendEmail = async () => {
    if (!user?.email) {
      toast.error('No email address found');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast.error('Failed to resend verification email');
        console.error('Resend error:', error);
        return;
      }

      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Resend error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setCheckingVerification(true);
    try {
      const { data: { user: refreshedUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        toast.error('Failed to check verification status');
        return;
      }

      if (refreshedUser?.email_confirmed_at) {
        toast.success('Email verified successfully!');
        window.location.href = '/';
      } else {
        toast.info('Email not yet verified. Please check your inbox.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Check verification error:', error);
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
            <BrandLogo />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Simplr Invoicing</h1>
          <p className="text-gray-600 mt-2">Professional invoicing made simple</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle>Verify Your Email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                We've sent a verification email to:
              </p>
              <p className="font-semibold text-gray-900 mb-4">
                {user?.email}
              </p>
              <p className="text-sm text-gray-500">
                Please check your inbox and click the verification link to activate your account.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleCheckVerification}
                disabled={checkingVerification}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {checkingVerification && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                <CheckCircle className="w-4 h-4 mr-2" />
                I've Verified My Email
              </Button>

              <Button
                variant="outline"
                onClick={handleResendEmail}
                disabled={loading}
                className="w-full"
              >
                {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                <Mail className="w-4 h-4 mr-2" />
                Resend Verification Email
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 text-center mb-3">
                Didn't receive the email? Check your spam folder or try a different email address.
              </p>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full text-sm"
              >
                Sign out and try again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WaitingForVerification;
