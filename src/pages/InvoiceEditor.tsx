
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Send, Eye, Plus, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useInvoice, InvoicePreviewPanel } from '@/features/invoices';
import { useTaxConfigurations } from '@/hooks/useTaxConfigurations';
import { Invoice, InvoiceItem, Client, TemplateId } from '@/types';
import AddClientModal from '@/components/AddClientModal';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

const InvoiceEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state, addInvoice, updateInvoice, getNextInvoiceNumber } = useInvoice();
  const { getEnabledTaxOptions } = useTaxConfigurations();
  
  const isEditing = !!id;
  const existingInvoice = isEditing ? state.invoices.find(inv => inv.id === id) : null;
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<string>('');

  const [invoiceData, setInvoiceData] = useState<Partial<Invoice>>({
    client_id: '',
    status: 'draft',
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    items: [
      {
        id: '1',
        invoice_id: id || '',
        description: '',
        quantity: 1,
        unit_price: 0,
        total: 0,
        tax_rate: 0,
        tax_amount: 0,
        tax_name: 'No Tax',
      },
    ],
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
    notes: '',
  });

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

  useEffect(() => {
    if (existingInvoice) {
      setInvoiceData(existingInvoice);
      const client = state.clients.find(c => c.id === existingInvoice.client_id);
      setSelectedClient(client || null);
      setNextInvoiceNumber(existingInvoice.invoice_number);
    } else {
      // Load next invoice number for new invoices
      getNextInvoiceNumber().then(setNextInvoiceNumber);
    }
  }, [existingInvoice, state.clients, getNextInvoiceNumber]);

  useEffect(() => {
    calculateTotals();
  }, [invoiceData.items, invoiceData.discount]);

  // Update invoice data with invoice number for preview
  useEffect(() => {
    if (nextInvoiceNumber && !isEditing) {
      setInvoiceData(prev => ({ ...prev, invoice_number: nextInvoiceNumber }));
    }
  }, [nextInvoiceNumber, isEditing]);

  const calculateTotals = () => {
    const items = invoiceData.items || [];
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discount = invoiceData.discount || 0;
    const taxAmount = items.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
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
    
    if (field === 'quantity' || field === 'unit_price') {
      const subtotal = items[index].quantity * items[index].unit_price;
      items[index].total = subtotal;
      
      // Recalculate tax amount based on current tax rate
      const taxRate = items[index].tax_rate || 0;
      items[index].tax_amount = subtotal * (taxRate / 100);
    }

    if (field === 'tax_rate') {
      // When tax rate changes, recalculate tax amount
      const subtotal = items[index].quantity * items[index].unit_price;
      items[index].tax_amount = subtotal * ((value as number) / 100);
    }

    setInvoiceData(prev => ({ ...prev, items }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      invoice_id: id || '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0,
      tax_rate: 0,
      tax_amount: 0,
      tax_name: 'No Tax',
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

  const handleSaveAs = async (status: 'draft' | 'ready') => {
    if (!invoiceData.client_id) {
      toast.error('Please select a client');
      return;
    }

    if (!invoiceData.items?.length || invoiceData.items.every(item => !item.description)) {
      toast.error('Please add at least one item');
      return;
    }

    const invoiceToSave = {
      ...invoiceData,
      user_id: user!.id,
      invoice_number: nextInvoiceNumber,
      client_id: invoiceData.client_id!,
      status: status,
      issue_date: invoiceData.issue_date!,
      due_date: invoiceData.due_date!,
      items: invoiceData.items!,
      subtotal: invoiceData.subtotal!,
      discount: invoiceData.discount!,
      tax: invoiceData.tax!,
      total: invoiceData.total!,
      notes: invoiceData.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      if (isEditing && existingInvoice) {
        await updateInvoice({ ...existingInvoice, ...invoiceToSave });
        toast.success(`Invoice updated as ${status === 'draft' ? 'Draft' : 'Ready'}`);
      } else {
        await addInvoice(invoiceToSave);
        toast.success(`Invoice saved as ${status === 'draft' ? 'Draft' : 'Ready'}`);
      }
      navigate('/invoices');
    } catch (error) {
      toast.error('Failed to save invoice');
      console.error('Error saving invoice:', error);
    }
  };

  const handleSend = async () => {
    if (!invoiceData.client_id) {
      toast.error('Please select a client first');
      return;
    }

    const invoiceToSend = {
      ...invoiceData,
      status: 'sent' as const,
      sent_at: format(new Date(), 'yyyy-MM-dd'),
    };

    try {
      if (isEditing && existingInvoice) {
        await updateInvoice({ ...existingInvoice, ...invoiceToSend });
      } else {
        await addInvoice({
          ...invoiceToSend,
          user_id: user!.id,
          invoice_number: nextInvoiceNumber,
          client_id: invoiceData.client_id!,
          issue_date: invoiceData.issue_date!,
          due_date: invoiceData.due_date!,
          items: invoiceData.items!,
          subtotal: invoiceData.subtotal!,
          discount: invoiceData.discount!,
          tax: invoiceData.tax!,
          total: invoiceData.total!,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      toast.success(`Invoice sent to ${selectedClient?.email}`);
      navigate('/invoices');
    } catch (error) {
      toast.error('Failed to send invoice');
      console.error('Error sending invoice:', error);
    }
  };

  const handleClientAdded = (newClient: Client) => {
    // Automatically select the newly created client
    setInvoiceData(prev => ({ ...prev, client_id: newClient.id }));
    setSelectedClient(newClient);
    setIsAddClientModalOpen(false);
    toast.success('Client added successfully');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-blue-500 hover:bg-blue-600">
                      <Save className="w-4 h-4 mr-2" />
                      Save As
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleSaveAs('draft')}>
                      <Save className="w-4 h-4 mr-2" />
                      Save as Draft
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSaveAs('ready')}>
                      <Eye className="w-4 h-4 mr-2" />
                      Save as Ready
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                      value={invoiceData.client_id}
                      onValueChange={(value) => {
                        if (value === 'new-client') {
                          setIsAddClientModalOpen(true);
                        } else {
                          setInvoiceData(prev => ({ ...prev, client_id: value }));
                          const client = state.clients.find(c => c.id === value);
                          setSelectedClient(client || null);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new-client" className="text-blue-600 font-medium">
                          + New Client
                        </SelectItem>
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
                      value={isEditing ? (existingInvoice?.invoice_number || '') : nextInvoiceNumber}
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
                      value={invoiceData.issue_date}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, issue_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={invoiceData.due_date}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, due_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="template">Template</Label>
                  <Select
                    value={invoiceData.notes || ''}
                    onValueChange={(value: TemplateId) => setInvoiceData(prev => ({ ...prev, notes: value }))}
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
                  <div className="grid grid-cols-12 gap-3 text-sm font-medium text-gray-600 mb-2">
                    <div className="col-span-4">Description</div>
                    <div className="col-span-1">Qty</div>
                    <div className="col-span-2">Price</div>
                    <div className="col-span-2">Tax</div>
                    <div className="col-span-2">Total</div>
                    <div className="col-span-1"></div>
                  </div>
                  {invoiceData.items?.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-4">
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                        />
                      </div>
                      <div className="col-span-1">
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
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Select
                          value={item.tax_rate ? enabledTaxOptions.find(opt => opt.rate === item.tax_rate)?.value || 'no-tax' : 'no-tax'}
                          onValueChange={(value) => {
                            if (value === 'no-tax') {
                              updateItem(index, 'tax_rate', 0);
                              updateItem(index, 'tax_name', 'No Tax');
                            } else {
                              const option = enabledTaxOptions.find(opt => opt.value === value);
                              if (option) {
                                updateItem(index, 'tax_rate', option.rate);
                                updateItem(index, 'tax_name', option.name);
                              }
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tax" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-tax">No Tax</SelectItem>
                            {enabledTaxOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <div className="text-sm">
                          <div className="font-medium">{formatCurrency(item.total)}</div>
                          {item.tax_amount && item.tax_amount > 0 && (
                            <div className="text-xs text-gray-500">+{formatCurrency(item.tax_amount)} tax</div>
                          )}
                        </div>
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
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(invoiceData.subtotal || 0)}</span>
                  </div>
                  
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

                  {invoiceData.tax && invoiceData.tax > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Tax:</span>
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

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onClientAdded={handleClientAdded}
      />
    </div>
  );
};

export default InvoiceEditor;
