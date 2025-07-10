"use client";

import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ReportParameterSelectionProps {
  onSelectReportType: (reportType: string) => void;
  reportType: string;
}

const ReportParameterSelection: React.FC<ReportParameterSelectionProps> = ({ onSelectReportType, reportType }) => {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Report Parameter Selection</h3>
      <Select onValueChange={onSelectReportType} value={reportType}>
        <SelectTrigger>
          <SelectValue placeholder="Select Report Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="revenue">Revenue Report</SelectItem>
          <SelectItem value="tax">Tax Summary Report</SelectItem>
          <SelectItem value="client">Client Performance Report</SelectItem>
          <SelectItem value="invoice">Invoice Status Overview Report</SelectItem>
          <SelectItem value="aging">Aging Report</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ReportParameterSelection;
