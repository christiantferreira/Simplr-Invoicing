import { supabase } from "@/integrations/supabase/client";

const getRevenueReport = async (userId: string, startDate: Date, endDate: Date) => {
  const { data, error } = await supabase.rpc("calculate_revenue_report", {
    user_id: userId,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
  });

  if (error) {
    console.error("Error fetching revenue report:", error);
    throw error;
  }

  return data;
};

const getTaxSummaryReport = async (userId: string, startDate: Date, endDate: Date) => {
  const { data, error } = await supabase.rpc("calculate_tax_summary_report", {
    user_id: userId,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
  });

  if (error) {
    console.error("Error fetching tax summary report:", error);
    throw error;
  }

  return data;
};

const getClientPerformanceReport = async (userId: string, startDate: Date, endDate: Date) => {
  const { data, error } = await supabase.rpc("calculate_client_performance_report", {
    user_id: userId,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
  });

  if (error) {
    console.error("Error fetching client performance report:", error);
    throw error;
  }

  return data;
};

const getInvoiceStatusOverviewReport = async (userId: string, startDate: Date, endDate: Date) => {
  const { data, error } = await supabase.rpc("calculate_invoice_status_overview_report", {
    user_id: userId,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
  });

  if (error) {
    console.error("Error fetching invoice status overview report:", error);
    throw error;
  }

  return data;
};

const getAgingReport = async (userId: string, startDate: Date, endDate: Date) => {
  const { data, error } = await supabase.rpc("calculate_aging_report", {
    user_id: userId,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
  });

  if (error) {
    console.error("Error fetching aging report:", error);
    throw error;
  }

  return data;
};

export const reportService = {
  getRevenueReport,
  getTaxSummaryReport,
  getClientPerformanceReport,
  getInvoiceStatusOverviewReport,
  getAgingReport,
};
