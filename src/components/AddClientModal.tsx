
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
import { useInvoice } from '@/features/invoices';
import { Client, CreateClientData } from '@/types';

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
    address: '',
    company: '',
    hasGST: false,
    gstNumber: '',
  });

  useEffect(() => {
    if (editingClient) {
      setFormData({
        name: editingClient.name,
        email: editingClient.email,
        phone: editingClient.phone || '',
        address: editingClient.address || '',
        company: editingClient.company || '',
        hasGST: false, // Default value since it's not in Client type
        gstNumber: '', // Default value since it's not in Client type
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        company: '',
        hasGST: false,
        gstNumber: '',
      });
    }
  }, [editingClient, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingClient) {
        // For update, ensure only Client type properties are passed
        const { hasGST, gstNumber, ...clientData } = formData;
        updateClient({
          ...editingClient,
          ...clientData,
        });
      } else {
        // For add, pass the properties expected by the Client type, using type assertion
        const newClient = await addClient({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          company: formData.company,
        } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
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
      <DialogContent className="sm:max-w-md">
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

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasGST"
                checked={formData.hasGST}
                onChange={(e) => handleChange('hasGST', e.target.checked)}
                className="rounded border-gray-300 text-simplr-accent focus:ring-simplr-accent"
              />
              <Label htmlFor="hasGST">do they have a gst number?</Label>
            </div>
            
            {formData.hasGST && (
              <div>
                <Label htmlFor="gstNumber">GST Number *</Label>
                <Input
                  id="gstNumber"
                  value={formData.gstNumber}
                  onChange={(e) => handleChange('gstNumber', e.target.value)}
                  placeholder="Enter GST Number"
                  required={formData.hasGST}
                />
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="123 Business St, City, State 12345"
              rows={3}
            />
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
