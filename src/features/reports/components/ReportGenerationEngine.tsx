"use client";

import React, { useState } from "react";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import ReportParameterSelection from "./ReportParameterSelection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface ReportPreview {
  reportType: string;
  period: string;
  summary: string;
}

interface ReportGenerationEngineProps {
  onGenerateReport: (startDate: Date, endDate: Date, reportType: string) => void;
}

const ReportGenerationEngine: React.FC<ReportGenerationEngineProps> = ({ onGenerateReport }) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [reportType, setReportType] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ReportPreview | null>(null);
  const { toast } = useToast();

  const handleDateRangeSelect = (selectedDate: DateRange | undefined) => {
    setDateRange(selectedDate);
  };

  const handleReportTypeSelect = (selectedReportType: string) => {
    setReportType(selectedReportType);
  };

  const handleGenerateReport = async () => {
    if (dateRange && dateRange.from && dateRange.to && reportType) {
      setIsLoading(true);
      setPreviewData(null);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const mockPreview = {
          reportType,
          period: `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`,
          summary: "This is a preview of the generated report.",
        };
        setPreviewData(mockPreview);
        onGenerateReport(dateRange.from, dateRange.to, reportType);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to generate report preview.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      toast({
        title: "Missing Information",
        description: "Please select a date range and report type.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Generation Engine</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ReportParameterSelection onSelectReportType={handleReportTypeSelect} reportType={reportType} />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Date Range Selection</h3>
          <DatePickerWithRange onSelect={handleDateRangeSelect} />
        </div>
        <Button onClick={handleGenerateReport} disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate Report"}
        </Button>
        {previewData && (
          <div className="mt-4 p-4 border rounded-md">
            <h4 className="font-semibold">Report Preview</h4>
            <pre>{JSON.stringify(previewData, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportGenerationEngine;
