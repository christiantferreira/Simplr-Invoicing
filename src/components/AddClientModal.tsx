
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInvoice } from '@/features/invoices';
import { Client, CreateClientData } from '@/types';
import {
  CANADIAN_PROVINCES,
  ADDRESS_EXTRA_TYPES,
  CANADIAN_POSTAL_CODE_REGEX,
} from '@/constants/serviceTypes';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingClient?: Client | null;
  onClientAdded?: (newClient: Client) => void;
}

const AddClientModal: React.FC<AddClientModalProps> = ({
  isOpen,
  onClose,
  editingClient,
  onClientAdded,
}) => {
  const { addClient, updateClient } = useInvoice();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    province: '',
    city: '',
    address_extra_type: '',
    address_extra_value: '',
    street_number: '',
    street_name: '',
    county: '',
    postal_code: '',
  });

  useEffect(() => {
    if (editingClient) {
      setFormData({
        name: editingClient.name,
        email: editingClient.email,
        phone: editingClient.phone || '',
        company: editingClient.company || '',
        province: editingClient.province || '',
        city: editingClient.city || '',
        address_extra_type: editingClient.address_extra_type || '',
        address_extra_value: editingClient.address_extra_value || '',
        street_number: editingClient.street_number || '',
        street_name: editingClient.street_name || '',
        county: editingClient.county || '',
        postal_code: editingClient.postal_code || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        province: '',
        city: '',
        address_extra_type: '',
        address_extra_value: '',
        street_number: '',
        street_name: '',
        county: '',
        postal_code: '',
      });
    }
  }, [editingClient, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingClient) {
        // For update, pass all form data
        updateClient({
          ...editingClient,
          ...formData,
        });
      } else {
        // For add, pass the properties expected by the CreateClientData type
        const newClient = await addClient(formData as CreateClientData);
        if (newClient && onClientAdded) {
          onClientAdded(newClient);
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving client:', error);
      // You could add a toast notification here
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-simplr-primary">
            {editingClient ? 'Edit Client' : 'Add New Client'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Client name"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="client@email.com"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          
          <div>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
              placeholder="Company name"
            />
          </div>

          {/* Canadian Address Structure */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="province">Province *</Label>
                <Select value={formData.province} onValueChange={(value) => handleChange('province', value)}>
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
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Enter city"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address_extra_type">Address Extra Type</Label>
                <Select value={formData.address_extra_type} onValueChange={(value) => handleChange('address_extra_type', value)}>
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
                  onChange={(e) => handleChange('address_extra_value', e.target.value)}
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
                  onChange={(e) => handleChange('street_number', e.target.value)}
                  placeholder="123"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="street_name">Street Name *</Label>
                <Input
                  id="street_name"
                  value={formData.street_name}
                  onChange={(e) => handleChange('street_name', e.target.value)}
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
                  onChange={(e) => handleChange('county', e.target.value)}
                  placeholder="Enter county"
                />
              </div>
              
              <div>
                <Label htmlFor="postal_code">Postal Code *</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleChange('postal_code', e.target.value.toUpperCase())}
                  placeholder="A1A 1A1"
                  required
                />
                {formData.postal_code && !CANADIAN_POSTAL_CODE_REGEX.test(formData.postal_code) && (
                  <p className="text-sm text-destructive mt-1">Please enter a valid Canadian postal code</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="btn-simplr hover:bg-purple-600">
              {editingClient ? 'Update Client' : 'Add Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddClientModal;
