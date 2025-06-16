import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './Dashboard';
import { vi, describe, it, expect } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

const queryClient = new QueryClient();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

describe('Dashboard', () => {
  it('renders the dashboard with stats', async () => {
    // Mock the fetchDashboardStats function
    const mockStats = [
      { status: 'paid', total_invoices: 10, total_amount: 5000 },
      { status: 'sent', total_invoices: 5, total_amount: 2500 },
      { status: 'overdue', total_invoices: 2, total_amount: 1000 },
    ];
    (supabase.rpc as any).mockResolvedValue({ data: mockStats, error: null });

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );

    // Check for the presence of the cards
    expect(await screen.findByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$ 5000.00')).toBeInTheDocument();
    expect(screen.getByText('Invoices Sent')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Invoices Paid')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Invoices Overdue')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    // Check for the presence of the charts
    expect(screen.getByText('Invoice Status Overview')).toBeInTheDocument();
    expect(screen.getByText('Revenue by Status')).toBeInTheDocument();
  });
});
