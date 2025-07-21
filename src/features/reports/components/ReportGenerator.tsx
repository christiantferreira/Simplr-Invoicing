import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../../integrations/supabase/client';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ReportParameterSelection from './ReportParameterSelection';
import { Skeleton } from '../../../components/ui/skeleton';
import DataTable from '../../../components/ui/data-table';
import DataChart from '../../../components/ui/data-chart';
import { Button } from '../../../components/ui/button';

type ReportParams = {
  reportType: string;
  startDate: string;
  endDate: string;
};

const generateReport = async (params: ReportParams) => {
  const { data, error } = await supabase.rpc(`calculate_${params.reportType}_report`, {
    start_date: params.startDate,
    end_date: params.endDate,
  });

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const ReportGenerator: React.FC = () => {
  const [reportData, setReportData] = useState<Record<string, unknown>[] | null>(null);

  const mutation = useMutation({
    mutationFn: generateReport,
    onSuccess: (data) => {
      setReportData(data);
      console.log("Report generated:", data);
    },
    onError: (error) => {
      console.error("Error generating report:", error.message);
      setReportData(null);
    }
  });

  return (
    <div className="space-y-6">
      <ReportParameterSelection 
        onGenerate={mutation.mutate} 
        isGenerating={mutation.isPending} 
      />

      {mutation.isPending && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {reportData && Array.isArray(reportData) && reportData.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Report Results</h2>
            <div className="flex space-x-2">
              <Button
                onClick={() => exportToCSV(reportData)}
                variant="outline"
              >
                Export to CSV
              </Button>
              <Button
                onClick={() => exportToPDF(reportData)}
                variant="outline"
              >
                Export to PDF
              </Button>
            </div>
          </div>
          
          {/* Example: Render a chart for revenue report */}
          {mutation.data && mutation.data[0]?.total_invoiced !== undefined && (
             <DataChart 
                data={reportData}
                xAxisKey="client_name" // Assuming client performance report for this example
                barDataKey="total_revenue"
                fill="#8884d8"
             />
          )}

          <DataTable data={reportData} />
        </div>
      )}

      {mutation.isError && (
         <div className="text-red-500">
            Failed to generate report: {mutation.error.message}
         </div>
      )}
    </div>
  );
};

const exportToCSV = (data: Record<string, unknown>[]) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'report.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportToPDF = (data: Record<string, unknown>[]) => {
  const doc = new jsPDF();
  const tableColumn = Object.keys(data[0]);
  const tableRows = data.map((item) => Object.values(item));

  (doc as any).autoTable({
    head: [tableColumn],
    body: tableRows,
  });

  doc.save('report.pdf');
};

export default ReportGenerator;
