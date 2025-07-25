import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInvoice } from '@/features/invoices';
import StatusBadge from '@/components/StatusBadge';
import { format } from 'date-fns';

import ReportGenerator from '@/features/reports/components/ReportGenerator';

const Dashboard = () => {
  const { state, getDashboardStats } = useInvoice();
  const stats = getDashboardStats();
  const navigate = useNavigate();

  const recentInvoices = state.invoices
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const handleStatCardClick = (filterType: string) => {
    navigate(`/invoices?filter=${filterType}`);
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your invoices.</p>
        </div>
        <div className="flex space-x-3">
          <Link to="/invoices/new">
            <Button className="flex items-center bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From paid invoices</p>
          </CardContent>
        </Card>

        <Card 
          onClick={() => handleStatCardClick('pending')} 
          className="cursor-pointer hover:shadow-md transition-shadow"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingInvoices.count}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.pendingInvoices.amount)} pending
            </p>
          </CardContent>
        </Card>

        <Card 
          onClick={() => handleStatCardClick('overdue')} 
          className="cursor-pointer hover:shadow-md transition-shadow"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueInvoices.count}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.overdueInvoices.amount)} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyInvoices}</div>
            <p className="text-xs text-muted-foreground">Invoices created</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Invoices</CardTitle>
            <Link to="/invoices">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No invoices yet</p>
              <Link to="/invoices/new">
                <Button className="bg-blue-500 hover:bg-blue-600">
                  Create Your First Invoice
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentInvoices.map((invoice) => {
                const client = state.clients.find(c => c.id === invoice.client_id);
                return (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{invoice.invoice_number}</span>
                        <StatusBadge status={invoice.status} />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {client?.name || 'Unknown Client'} • {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(invoice.total)}</p>
                      <p className="text-sm text-gray-500">Due {format(new Date(invoice.due_date), 'MMM d')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
</CardContent>
      </Card>
      <ReportGenerator />
    </div>
  );
};

export default Dashboard;
