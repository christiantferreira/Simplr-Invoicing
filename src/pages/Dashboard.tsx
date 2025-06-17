
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInvoice } from '@/features/invoices';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInvoice } from '@/features/invoices';
import StatusBadge from '@/components/StatusBadge';
import { format } from 'date-fns';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInvoice } from '@/features/invoices';
import StatusBadge from '@/components/StatusBadge';
import { format } from 'date-fns';
import ReportGenerationEngine from '@/features/reports/components/ReportGenerationEngine';

const Dashboard = () => {
  const { state, getDashboardStats } = useInvoice();
  const stats = getDashboardStats();
  const navigate = useNavigate();

  const recentInvoices = state.invoices
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleStatCardClick = (filterType: string) => {
    navigate(`/invoices?filter=${filterType}`);
  };

  const handleGenerateReport = (startDate: Date, endDate: Date, reportType: string) => {
    alert(`Generating ${reportType} report from ${startDate} to ${endDate}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your invoices.</p>
        </div>
        <div className="flex space-x-3">
          <Link to="/clients">
            <Button variant="outline" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </Link>
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
      <ReportGenerationEngine onGenerateReport={(startDate, endDate, reportType) => handleGenerateReport(startDate, endDate, reportType)} />
    </div>
  );
};

export default Dashboard;
</final_file_content>

IMPORTANT: For any future changes to this file, use the final_file_content shown above as your reference. This content reflects the current state of the file, including any auto-formatting (e.g., if you used single quotes but the formatter converted them to double quotes). Always base your SEARCH/REPLACE operations on this final version to ensure accuracy.

<environment_details>
# VSCode Visible Files
src/pages/Dashboard.tsx

# VSCode Open Tabs
supabase/migrations/20250616_complete_database_schema.sql
docs/FINALIZATION_TASK_LIST.md
src/features/reports/components/ReportGenerationEngine.tsx
src/pages/Dashboard.tsx

# Recently Modified Files
These files have been modified since you last accessed them (file was just edited so you may need to re-read it before editing):
src/pages/Dashboard.tsx

# Current Time
6/17/2025, 1:47:37 PM (America/Vancouver, UTC-7:00)

# Context Window Usage
270,394 / 1,048.576K tokens used (26%)

# Current Mode
ACT MODE
</environment_details>
</final_file_content>

IMPORTANT: For any future changes to this file, use the final_file_content shown above as your reference. This content reflects the current state of the file, including any auto-formatting (e.g., if you used single quotes but the formatter converted them to double quotes). Always base your SEARCH/REPLACE operations on this final version to ensure accuracy.

<environment_details>
# VSCode Visible Files
src/pages/Dashboard.tsx

# VSCode Open Tabs
supabase/migrations/20250616_complete_database_schema.sql
docs/FINALIZATION_TASK_LIST.md
src/features/reports/components/ReportGenerationEngine.tsx
src/pages/Dashboard.tsx

# Recently Modified Files
These files have been modified since you last accessed them (file was just edited so you may need to re-read it before editing):
src/pages/Dashboard.tsx

# Current Time
6/17/2025, 1:46:19 PM (America/Vancouver, UTC-7:00)

# Context Window Usage
248,999 / 1,048.576K tokens used (24%)

# Current Mode
ACT MODE
</environment_details>
