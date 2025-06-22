"use client";

import React from "react";

interface ReportParameterSelectionProps {
  onSelectReportType: (reportType: string) => void;
}

const ReportParameterSelection: React.FC<ReportParameterSelectionProps> = ({ onSelectReportType }) => {
  const handleReportTypeSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onSelectReportType(event.target.value);
  };

  return (
    <div>
      <h2>Report Parameter Selection</h2>
      <select onChange={handleReportTypeSelect}>
        <option value="">Select Report Type</option>
        <option value="revenue">Revenue Report</option>
        <option value="tax">Tax Summary Report</option>
        <option value="client">Client Performance Report</option>
        <option value="invoice">Invoice Status Overview Report</option>
        <option value="aging">Aging Report</option>
      </select>
    </div>
  );
};

export default ReportParameterSelection;
