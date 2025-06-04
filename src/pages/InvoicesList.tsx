
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Copy, Send, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useInvoice } from '@/contexts/InvoiceContext';
import StatusBadge from '@/components/StatusBadge';
import { InvoiceStatus } from '@/types';
import { format } from 'date-fns';

const InvoicesList = () => {
  const { state, updateInvoice, deleteInvoice } = useInvoice();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const location = useLocation();
  const navigate = useNavigate();

  // Extract filter from URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get('filter');
    
    if (filterParam) {
      if (filterParam === 'pending' || filterParam === 'overdue' || 
          filterParam === 'draft' || filterParam === 'sent' || 
          filterParam === 'paid' || filterParam === 'all') {
        setActiveTab(filterParam);
      }
    }
  }, [location.search]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/invoices?filter=${value}`, { replace: true });
  };

  const filteredInvoices = state.invoices.filter(invoice => {
    const client = state.clients.find(c => c.id === invoice.clientId);
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'pending') {
      // Pending invoices are those that are sent but not paid and not overdue
      const dueDate = new Date(invoice.dueDate);
      const today = new Date();
      return matchesSearch && 
             (invoice.status === 'sent' || invoice.status === 'viewed') && 
             dueDate >= today;
    }
    if (activeTab === 'overdue') {
      // Overdue invoices are past due date and not paid
      const dueDate = new Date(invoice.dueDate);
      const today = new Date();
      return matchesSearch && 
             invoice.status !== 'paid' && 
             dueDate < today;
    }
    return matchesSearch && invoice.status === activeTab;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleStatusChange = (invoiceId: string, newStatus: InvoiceStatus) => {
    const invoice = state.invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      const updatedInvoice = {
        ...invoice,
        status: newStatus,
        ...(newStatus === 'paid' && { paidAt: format(new Date(), 'yyyy-MM-dd') }),
        ...(newStatus === 'sent' && !invoice.sentAt && { sentAt: format(new Date(), 'yyyy-MM-dd') }),
      };
      updateInvoice(updatedInvoice);
    }
  };

  const handleDuplicate = (invoiceId: string) => {
    const invoice = state.invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      // Navigate to create new invoice with duplicated data
      // This would need to be implemented in the invoice editor
      console.log('Duplicate invoice:', invoice);
    }
  };

  const handleDelete = (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoice(invoiceId);
    }
  };

  const getTabCounts = () => {
    return {
      all: state.invoices.length,
      draft: state.invoices.filter(inv => inv.status === 'draft').length,
      sent: state.invoices.filter(inv => inv.status === 'sent').length,
      paid: state.invoices.filter(inv => inv.status === 'paid').length,
      overdue: state.invoices.filter(inv => inv.status === 'overdue').length,
    };
  };

  const tabCounts = getTabCounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600">Manage all your invoices</p>
        </div>
        <Link to="/invoices/new">
          <Button className="bg-blue-500 hover:bg-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Invoice List</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" className="flex items-center space-x-2">
                <span>All</span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                  {tabCounts.all}
                </span>
              </TabsTrigger>
              <TabsTrigger value="draft" className="flex items-center space-x-2">
                <span>Draft</span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                  {tabCounts.draft}
                </span>
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex items-center space-x-2">
                <span>Sent</span>
                <span className="bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                  {tabCounts.sent}
                </span>
              </TabsTrigger>
              <TabsTrigger value="paid" className="flex items-center space-x-2">
                <span>Paid</span>
                <span className="bg-green-200 text-green-700 px-2 py-0.5 rounded-full text-xs">
                  {tabCounts.paid}
                </span>
              </TabsTrigger>
              <TabsTrigger value="overdue" className="flex items-center space-x-2">
                <span>Overdue</span>
                <span className="bg-red-200 text-red-700 px-2 py-0.5 rounded-full text-xs">
                  {tabCounts.overdue}
                </span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-8">
                  {searchTerm ? (
                    <div>
                      <p className="text-gray-500 mb-4">No invoices found matching "{searchTerm}"</p>
                      <Button 
                        variant="outline" 
                        onClick={() => setSearchTerm('')}
                      >
                        Clear Search
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-500 mb-4">
                        {activeTab === 'all' ? 'No invoices yet' : `No ${activeTab} invoices`}
                      </p>
                      <Link to="/invoices/new">
                        <Button className="bg-blue-500 hover:bg-blue-600">
                          Create Your First Invoice
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => {
                      const client = state.clients.find(c => c.id === invoice.clientId);
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            <Link 
                              to={`/invoices/${invoice.id}/preview`}
                              className="font-medium text-blue-600 hover:text-blue-800"
                            >
                              {invoice.invoiceNumber}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{client?.name || 'Unknown Client'}</div>
                              <div className="text-sm text-gray-500">{client?.company}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(invoice.issueDate), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{formatCurrency(invoice.total)}</span>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={invoice.status} />
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Link to={`/invoices/${invoice.id}/preview`}>
                                <Button variant="ghost" size="icon" title="View">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Link to={`/invoices/${invoice.id}/edit`}>
                                <Button variant="ghost" size="icon" title="Edit">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </Link>
                              {invoice.status !== 'paid' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleStatusChange(invoice.id, 'paid')}
                                  title="Mark as Paid"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(invoice.id)}
                                title="Delete"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoicesList;
