"use client";

import React, { useState } from "react";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import ReportParameterSelection from "./ReportParameterSelection";

interface ReportGenerationEngineProps {
  onGenerateReport: (startDate: Date, endDate: Date, reportType: string) => void;
}

const ReportGenerationEngine: React.FC<ReportGenerationEngineProps> = ({ onGenerateReport }) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [reportType, setReportType] = useState<string>("");

  const handleDateRangeSelect = (selectedDate: DateRange | undefined) => {
    setDateRange(selectedDate);
  };

  const handleReportTypeSelect = (selectedReportType: string) => {
    setReportType(selectedReportType);
  };

  const handleGenerateReport = () => {
    if (dateRange && dateRange.from && dateRange.to && reportType) {
      onGenerateReport(dateRange.from, dateRange.to, reportType);
    } else {
      alert("Please select a date range and report type.");
    }
  };

  return (
    <div>
      <h2>Report Generation Engine</h2>
      <ReportParameterSelection onSelectReportType={handleReportTypeSelect} />
      <DatePickerWithRange onSelect={handleDateRangeSelect} />
      <button onClick={handleGenerateReport}>Generate Report</button>
    </div>
  );
};

export default ReportGenerationEngine;
