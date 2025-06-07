import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/BrandLogo';

const Onboarding = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    address: '',
    phone_number: '',
    email: '',
    gst_number: '',
    primary_color: '#3B82F6',
    secondary_color: '#6B7280',
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete setup
      setLoading(true);
      try {
        const { error } = await supabase
          .from('company_info')
          .insert({
            user_id: user?.id,
            company_name: formData.company_name || 'My Company',
            address: formData.address,
            phone_number: formData.phone_number,
            email: formData.email,
            gst_number: formData.gst_number,
            primary_color: formData.primary_color,
            secondary_color: formData.secondary_color,
          });

        if (error) {
          toast.error('Error saving company information');
          console.error('Error:', error);
          return;
        }

        toast.success('Company setup completed!');
        window.location.reload();
      } catch (error) {
        toast.error('An unexpected error occurred');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.company_name}
                onChange={(e) => updateFormData('company_name', e.target.value)}
                placeholder="Enter your company name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone_number}
                onChange={(e) => updateFormData('phone_number', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input
                id="gstNumber"
                value={formData.gst_number}
                onChange={(e) => updateFormData('gst_number', e.target.value)}
                placeholder="Enter your business GST number"
              />
            </div>
            <div>
              <Label htmlFor="address">Business Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => updateFormData('address', e.target.value)}
                placeholder="123 Business St, City, State 12345"
                rows={3}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-2xl shadow-lg">
                <BrandLogo />
              </div>
              <p className="text-sm text-gray-600">
                Upload your company logo (optional)
              </p>
              <p className="text-xs text-gray-500 mt-2">
                You can add this later in settings
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label>Primary Color</Label>
              <div className="flex items-center space-x-4 mt-2">
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => updateFormData('primary_color', e.target.value)}
                  className="w-12 h-12 rounded border-2 border-gray-300"
                />
                <Input
                  value={formData.primary_color}
                  onChange={(e) => updateFormData('primary_color', e.target.value)}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Secondary Color</Label>
              <div className="flex items-center space-x-4 mt-2">
                <input
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => updateFormData('secondary_color', e.target.value)}
                  className="w-12 h-12 rounded border-2 border-gray-300"
                />
                <Input
                  value={formData.secondary_color}
                  onChange={(e) => updateFormData('secondary_color', e.target.value)}
                  placeholder="#6B7280"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Preview</h4>
              <div 
                className="p-4 rounded text-white"
                style={{ backgroundColor: formData.primary_color }}
              >
                <h5 className="font-semibold">Invoice Header</h5>
                <p style={{ color: formData.secondary_color }}>
                  This is how your brand colors will appear
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">You're all set!</h3>
              <p className="text-gray-600">
                Your invoice template is ready. You can start creating professional invoices right away.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-medium mb-3">What's next?</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Add your first client
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Create your first invoice
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Customize your settings
                </li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Company Details';
      case 2: return 'Upload Logo';
      case 3: return 'Brand Colors';
      case 4: return 'Ready to Go!';
      default: return '';
    }
  };

  const isNextDisabled = () => {
    if (currentStep === 1) {
      return !formData.company_name || !formData.email;
    }
    if (currentStep === totalSteps) {
      return loading;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Simplr Invoicing</h1>
          <p className="text-gray-600 mt-2">Let's set up your account in a few simple steps</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle>Step {currentStep} of {totalSteps}</CardTitle>
              <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="mb-2" />
            <CardTitle className="text-lg">{getStepTitle()}</CardTitle>
          </CardHeader>
          <CardContent>
            {renderStep()}

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || loading}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={isNextDisabled()}
                className="flex items-center bg-blue-500 hover:bg-blue-600"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {currentStep === totalSteps ? 'Complete Setup' : 'Next'}
                {currentStep !== totalSteps && !loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
