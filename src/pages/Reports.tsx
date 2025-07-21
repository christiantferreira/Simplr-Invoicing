import React from 'react';
import ReportGenerator from '@/features/reports/components/ReportGenerator';

const Reports = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate comprehensive business reports and analytics.</p>
        </div>
      </div>
      
      <ReportGenerator />
    </div>
  );
};

export default Reports;