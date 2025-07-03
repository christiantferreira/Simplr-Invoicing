import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/BrandLogo';
import {
  CANADIAN_PROVINCES,
  ADDRESS_EXTRA_TYPES,
  SERVICE_AREA_OPTIONS,
  getServiceTypesForArea,
  CANADIAN_POSTAL_CODE_REGEX,
  CANADIAN_GST_REGEX,
  extractBusinessNumber,
} from '@/constants/serviceTypes';

interface OnboardingData {
  // Step 2: Business Name
  business_legal_name: string;
  has_trade_name: boolean;
  trade_name: string;
  
  // Step 3: Address
  province: string;
  city: string;
  address_extra_type: string;
  address_extra_value: string;
  street_number: string;
  street_name: string;
  county: string;
  postal_code: string;
  
  // Step 4: Service Provider
  is_service_provider: boolean;
  service_area: string;
  service_type: string;
  custom_service: string;
  
  // Step 5: GST
  has_gst: boolean;
  gst_number: string;
}

interface SupabaseUser {
  id: string;
  email?: string;
  // Add other potential properties if needed, or use a more specific type if available
  [key: string]: unknown;
}

interface OnboardingWizardProps {
  user: SupabaseUser;
}

const OnboardingWizard = ({ user }: OnboardingWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    business_legal_name: '',
    has_trade_name: false,
    trade_name: '',
    province: '',
    city: '',
    address_extra_type: '',
    address_extra_value: '',
    street_number: '',
    street_name: '',
    county: '',
    postal_code: '',
    is_service_provider: true,
    service_area: '',
    service_type: '',
    custom_service: '',
    has_gst: false,
    gst_number: '',
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = (field: keyof OnboardingData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 2:
        return !!formData.business_legal_name.trim();
      case 3:
        return !!(
          formData.province &&
          formData.city.trim() &&
          formData.street_number.trim() &&
          formData.street_name.trim() &&
          formData.postal_code.trim() &&
          CANADIAN_POSTAL_CODE_REGEX.test(formData.postal_code)
        );
      case 4:
        if (!formData.is_service_provider) return false;
        return !!(formData.service_area && formData.service_type);
      case 5:
        if (!formData.has_gst) return true;
        return !!(formData.gst_number.trim() && CANADIAN_GST_REGEX.test(formData.gst_number));
      default:
        return true;
    }
  };

  const handleServiceProviderRejection = async () => {
    try {
      await supabase.auth.signOut();
      toast.error('Unfortunately our system currently supports service-based businesses only');
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('An error occurred. Please try again.');
    }
  };

  const logCustomService = async () => {
    if (!user || !formData.custom_service.trim()) return;

    try {
      await supabase
        .from('other_service_types_log')
        .insert({
          user_id: user.id,
          entered_service: formData.custom_service.trim(),
        });
    } catch (error) {
      console.error('Error logging custom service:', error);
    }
  };

  const handleNext = async () => {
    if (currentStep === 4 && !formData.is_service_provider) {
      await handleServiceProviderRejection();
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!user) {
      toast.error('User not authenticated');
      window.location.href = '/auth';
      return;
    }

    setLoading(true);
    try {
      // Log custom service if applicable
      if ((formData.service_area === 'Other' || formData.service_type === 'Other') && formData.custom_service) {
        await logCustomService();
      }

      // Prepare settings data
      const settingsData = {
        user_id: user.id,
        business_legal_name: formData.business_legal_name,
        trade_name: formData.has_trade_name ? formData.trade_name : null,
        province: formData.province,
        city: formData.city,
        address_extra_type: formData.address_extra_type || null,
        address_extra_value: formData.address_extra_value || null,
        street_number: formData.street_number,
        street_name: formData.street_name,
        county: formData.county || null,
        postal_code: formData.postal_code,
        is_service_provider: formData.is_service_provider,
        service_area: formData.service_area || null,
        service_type: formData.service_type || null,
        gst_number: formData.has_gst ? formData.gst_number : null,
        business_number: formData.has_gst ? extractBusinessNumber(formData.gst_number) : null,
        has_completed_setup: true,
      };

      console.log('settingsData', settingsData);
      console.log('current user', user);

      const { error } = await supabase
        .from('settings')
        .upsert(settingsData, { onConflict: 'user_id' });

      if (error) {
        console.error('Error saving onboarding data:', error);
        console.error('Supabase error', JSON.stringify(error, null, 2));
        toast.error('Error saving your information. Please try again.');
        return;
      }

      // Show thank you message instead of immediate navigation
      setShowThankYou(true);
      
      // Set timer for redirect after 5 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 5000);

      toast.success('Onboarding completed successfully!');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-primary rounded-full mx-auto flex items-center justify-center">
              <BrandLogo />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">Welcome to Simplr Invoicing</h3>
              <p className="text-muted-foreground">
                To correctly set up your account we need a few details. Please complete these 5 quick steps.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="business_legal_name">Business Legal Name *</Label>
              <Input
                id="business_legal_name"
                value={formData.business_legal_name}
                onChange={(e) => updateFormData('business_legal_name', e.target.value)}
                placeholder="Enter your business legal name"
                required
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="has_trade_name"
                checked={formData.has_trade_name}
                onCheckedChange={(checked) => updateFormData('has_trade_name', checked)}
              />
              <Label htmlFor="has_trade_name">Operate under a different name?</Label>
            </div>

            {formData.has_trade_name && (
              <div>
                <Label htmlFor="trade_name">Operating / Trade Name</Label>
                <Input
                  id="trade_name"
                  value={formData.trade_name}
                  onChange={(e) => updateFormData('trade_name', e.target.value)}
                  placeholder="Enter your trade name"
                />
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="province">Province *</Label>
                <Select value={formData.province} onValueChange={(value) => updateFormData('province', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {CANADIAN_PROVINCES.map((province) => (
                      <SelectItem key={province.code} value={province.code}>
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateFormData('city', e.target.value)}
                  placeholder="Enter city"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address_extra_type">Address Extra Type</Label>
                <Select value={formData.address_extra_type} onValueChange={(value) => updateFormData('address_extra_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ADDRESS_EXTRA_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="address_extra_value">Address Extra Value</Label>
                <Input
                  id="address_extra_value"
                  value={formData.address_extra_value}
                  onChange={(e) => updateFormData('address_extra_value', e.target.value)}
                  placeholder="e.g., 101, A, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="street_number">Street Number *</Label>
                <Input
                  id="street_number"
                  value={formData.street_number}
                  onChange={(e) => updateFormData('street_number', e.target.value)}
                  placeholder="123"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="street_name">Street Name *</Label>
                <Input
                  id="street_name"
                  value={formData.street_name}
                  onChange={(e) => updateFormData('street_name', e.target.value)}
                  placeholder="Main Street"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="county">County (Optional)</Label>
                <Input
                  id="county"
                  value={formData.county}
                  onChange={(e) => updateFormData('county', e.target.value)}
                  placeholder="Enter county"
                />
              </div>
              
              <div>
                <Label htmlFor="postal_code">Postal Code *</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => updateFormData('postal_code', e.target.value.toUpperCase())}
                  placeholder="A1A 1A1"
                  required
                />
                {formData.postal_code && !CANADIAN_POSTAL_CODE_REGEX.test(formData.postal_code) && (
                  <p className="text-sm text-destructive mt-1">Please enter a valid Canadian postal code</p>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_service_provider"
                checked={formData.is_service_provider}
                onCheckedChange={(checked) => updateFormData('is_service_provider', checked)}
              />
              <Label htmlFor="is_service_provider">Are you a service provider?</Label>
            </div>

            {!formData.is_service_provider && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive font-medium">
                  Unfortunately our system currently supports service-based businesses only
                </p>
              </div>
            )}

            {formData.is_service_provider && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="service_area">Service Area *</Label>
                  <Select 
                    value={formData.service_area} 
                    onValueChange={(value) => {
                      updateFormData('service_area', value);
                      updateFormData('service_type', ''); // Reset service type when area changes
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service area" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_AREA_OPTIONS.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.service_area && (
                  <div>
                    <Label htmlFor="service_type">Service Type *</Label>
                    <Select value={formData.service_type} onValueChange={(value) => updateFormData('service_type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        {getServiceTypesForArea(formData.service_area).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(formData.service_area === 'Other' || formData.service_type === 'Other') && (
                  <div>
                    <Label htmlFor="custom_service">Please specify</Label>
                    <Input
                      id="custom_service"
                      value={formData.custom_service}
                      onChange={(e) => updateFormData('custom_service', e.target.value)}
                      placeholder="Describe your service"
                      required
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="has_gst"
                checked={formData.has_gst}
                onCheckedChange={(checked) => updateFormData('has_gst', checked)}
              />
              <Label htmlFor="has_gst">Do you have a GST number?</Label>
            </div>

            {formData.has_gst && (
              <div>
                <Label htmlFor="gst_number">GST Number</Label>
                <Input
                  id="gst_number"
                  value={formData.gst_number}
                  onChange={(e) => updateFormData('gst_number', e.target.value)}
                  placeholder="123456789RT0001"
                  required
                />
                {formData.gst_number && !CANADIAN_GST_REGEX.test(formData.gst_number) && (
                  <p className="text-sm text-destructive mt-1">
                    Please enter a valid GST number (9 digits + RT + 4 digits)
                  </p>
                )}
                {formData.gst_number && CANADIAN_GST_REGEX.test(formData.gst_number) && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Business Number: {extractBusinessNumber(formData.gst_number)}
                  </p>
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Welcome';
      case 2: return 'Business Name';
      case 3: return 'Address';
      case 4: return 'Service Provider';
      case 5: return 'GST Information';
      default: return '';
    }
  };

  const getButtonText = () => {
    if (currentStep === 1) return 'Start';
    if (currentStep === totalSteps) return 'Save & Continue';
    return 'Next';
  };

  const isNextDisabled = () => {
    if (loading) return true;
    if (currentStep === 1) return false;
    return !validateStep();
  };

  const renderContent = () => {
    if (showThankYou) {
      return (
        <div className="text-center space-y-6 py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3">Thank you!</h3>
            <p className="text-muted-foreground">
              Your information has been saved. Please check your email to confirm your account.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              You will be redirected shortly...
            </p>
          </div>
        </div>
      );
    }

    return (
      <>
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
            className="flex items-center bg-primary hover:bg-primary/90"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {getButtonText()}
            {currentStep !== totalSteps && !loading && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            {!showThankYou && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>Step {currentStep} of {totalSteps}</CardTitle>
                  <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="mb-2" />
                <CardTitle className="text-lg">{getStepTitle()}</CardTitle>
              </>
            )}
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingWizard;
