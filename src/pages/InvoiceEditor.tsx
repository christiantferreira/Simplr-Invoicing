import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Send, Eye, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInvoice } from '@/contexts/InvoiceContext';
import { useTaxConfigurations } from '@/hooks/useTaxConfigurations';
import { Invoice, InvoiceItem, Client, TemplateId } from '@/types';
import InvoicePreviewPanel from '@/components/InvoicePreviewPanel';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

const InvoiceEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, addInvoice, updateInvoice, getNextInvoiceNumber } = useInvoice();
  const { getEnabledTaxOptions } = useTaxConfigurations();
  
  const isEditing = !!id;
  const existingInvoice = isEditing ? state.invoices.find(inv => inv.id === id) : null;
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<string>('');

  const [invoiceData, setInvoiceData] = useState<Partial<Invoice>>({
    clientId: '',
    status: 'draft',
    issueDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    items: [
      {
        id: '1',
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
      },
    ],
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
    notes: '',
    templateId: 'classic',
  });

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedTaxOption, setSelectedTaxOption] = useState<{ rate: number; name: string } | null>(null);

  useEffect(() => {
    if (existingInvoice) {
      setInvoiceData(existingInvoice);
      const client = state.clients.find(c => c.id === existingInvoice.clientId);
      setSelectedClient(client || null);
      setNextInvoiceNumber(existingInvoice.invoiceNumber);
    } else {
      // Load next invoice number for new invoices
      getNextInvoiceNumber().then(setNextInvoiceNumber);
    }
  }, [existingInvoice, state.clients, getNextInvoiceNumber]);

  useEffect(() => {
    calculateTotals();
  }, [invoiceData.items, invoiceData.discount, selectedTaxOption]);

  const calculateTotals = () => {
    const items = invoiceData.items || [];
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discount = invoiceData.discount || 0;
    const taxRate = selectedTaxOption?.rate || 0;
    const taxAmount = (subtotal - discount) * (taxRate / 100);
    const total = subtotal - discount + taxAmount;

    setInvoiceData(prev => ({
      ...prev,
      subtotal,
      tax: taxAmount,
      total,
    }));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const items = [...(invoiceData.items || [])];
    items[index] = { ...items[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      items[index].total = items[index].quantity * items[index].unitPrice;
    }

    setInvoiceData(prev => ({ ...prev, items }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setInvoiceData(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  const removeItem = (index: number) => {
    const items = [...(invoiceData.items || [])];
    items.splice(index, 1);
    setInvoiceData(prev => ({ ...prev, items }));
  };

  const handleSave = async () => {
    if (!invoiceData.clientId) {
      toast.error('Please select a client');
      return;
    }

    if (!invoiceData.items?.length || invoiceData.items.every(item => !item.description)) {
      toast.error('Please add at least one item');
      return;
    }

    const invoiceToSave = {
      ...invoiceData,
      clientId: invoiceData.clientId!,
      status: invoiceData.status!,
      issueDate: invoiceData.issueDate!,
      dueDate: invoiceData.dueDate!,
      items: invoiceData.items!,
      subtotal: invoiceData.subtotal!,
      discount: invoiceData.discount!,
      tax: invoiceData.tax!,
      total: invoiceData.total!,
      templateId: invoiceData.templateId!,
      notes: invoiceData.notes,
    };

    try {
      if (isEditing && existingInvoice) {
        updateInvoice({ ...existingInvoice, ...invoiceToSave });
        toast.success('Invoice updated successfully');
      } else {
        await addInvoice(invoiceToSave);
        toast.success('Invoice created successfully');
      }
      navigate('/invoices');
    } catch (error) {
      toast.error('Failed to save invoice');
      console.error('Error saving invoice:', error);
    }
  };

  const handleSend = async () => {
    if (!invoiceData.clientId) {
      toast.error('Please select a client first');
      return;
    }

    const invoiceToSend = {
      ...invoiceData,
      status: 'sent' as const,
      sentAt: format(new Date(), 'yyyy-MM-dd'),
    };

    try {
      if (isEditing && existingInvoice) {
        updateInvoice({ ...existingInvoice, ...invoiceToSend });
      } else {
        await addInvoice({
          ...invoiceToSend,
          clientId: invoiceData.clientId!,
          issueDate: invoiceData.issueDate!,
          dueDate: invoiceData.dueDate!,
          items: invoiceData.items!,
          subtotal: invoiceData.subtotal!,
          discount: invoiceData.discount!,
          tax: invoiceData.tax!,
          total: invoiceData.total!,
          templateId: invoiceData.templateId!,
        });
      }

      toast.success(`Invoice sent to ${selectedClient?.email}`);
      navigate('/invoices');
    } catch (error) {
      toast.error('Failed to send invoice');
      console.error('Error sending invoice:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const enabledTaxOptions = getEnabledTaxOptions();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Left Panel - Form */}
        <div className="w-full lg:w-1/2 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Edit Invoice' : 'Create Invoice'}
              </h1>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => navigate('/invoices')}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleSend} className="bg-green-500 hover:bg-green-600">
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>

            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client">Client *</Label>
                    <Select
                      value={invoiceData.clientId}
                      onValueChange={(value) => {
                        setInvoiceData(prev => ({ ...prev, clientId: value }));
                        const client = state.clients.find(c => c.id === value);
                        setSelectedClient(client || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {state.clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} ({client.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <Input
                      id="invoiceNumber"
                      value={nextInvoiceNumber}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="issueDate">Issue Date</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={invoiceData.issueDate}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, issueDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={invoiceData.dueDate}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="template">Template</Label>
                  <Select
                    value={invoiceData.templateId}
                    onValueChange={(value: TemplateId) => setInvoiceData(prev => ({ ...prev, templateId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classic">Classic</SelectItem>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Items</CardTitle>
                  <Button onClick={addItem} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoiceData.items?.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-5">
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Price"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm font-medium">{formatCurrency(item.total)}</span>
                      </div>
                      <div className="col-span-1">
                        {(invoiceData.items?.length || 0) > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(invoiceData.subtotal || 0)}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="discount">Discount</Label>
                      <Input
                        id="discount"
                        type="number"
                        placeholder="0.00"
                        value={invoiceData.discount || ''}
                        onChange={(e) => setInvoiceData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tax">Tax</Label>
                      <Select
                        value={selectedTaxOption ? `${selectedTaxOption.name}-${selectedTaxOption.rate}` : ''}
                        onValueChange={(value) => {
                          if (value) {
                            const option = enabledTaxOptions.find(opt => opt.value === value);
                            setSelectedTaxOption(option ? { rate: option.rate, name: option.name } : null);
                          } else {
                            setSelectedTaxOption(null);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tax type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No Tax</SelectItem>
                          {enabledTaxOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedTaxOption && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tax ({selectedTaxOption.rate}%):</span>
                      <span className="font-medium">{formatCurrency(invoiceData.tax || 0)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-lg font-semibold pt-3 border-t">
                    <span>Total:</span>
                    <span>{formatCurrency(invoiceData.total || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Additional notes or payment terms..."
                  value={invoiceData.notes || ''}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="hidden lg:block w-1/2 bg-white border-l border-gray-200">
          <div className="sticky top-0 h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
              <p className="text-sm text-gray-600">See how your invoice will look</p>
            </div>
            <div className="p-6">
              <InvoicePreviewPanel 
                invoice={invoiceData as Invoice} 
                client={selectedClient}
                companySettings={state.companySettings}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceEditor;
