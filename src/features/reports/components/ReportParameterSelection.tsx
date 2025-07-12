import React, { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Label } from '../../../components/ui/label';
import { DatePickerWithRange } from '../../../components/ui/date-picker-with-range';

// This would typically come from a shared types file or be generated from the backend.
const reportTypes = [
  { value: 'revenue_summary', label: 'Revenue Summary' },
  { value: 'tax_summary', label: 'Tax Summary' },
  { value: 'client_performance', label: 'Client Performance' },
  { value: 'invoice_status', label: 'Invoice Status Overview' },
  { value: 'aging_report', label: 'Aging Report' },
];

type ReportParams = {
  reportType: string;
  startDate: string;
  endDate: string;
};

interface ReportParameterSelectionProps {
  onGenerate: (params: ReportParams) => void;
  isGenerating: boolean;
}

const ReportParameterSelection: React.FC<ReportParameterSelectionProps> = ({ onGenerate, isGenerating }) => {
  const [reportType, setReportType] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const handleGenerateClick = () => {
    if (!reportType || !dateRange?.from || !dateRange?.to) {
      // Basic validation
      alert('Please select a report type and a date range.');
      return;
    }

    const params: ReportParams = {
      reportType,
      startDate: dateRange.from.toISOString().split('T')[0],
      endDate: dateRange.to.toISOString().split('T')[0],
    };
    onGenerate(params);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="report-type">Report Type</Label>
          <Select onValueChange={setReportType}>
            <SelectTrigger id="report-type">
              <SelectValue placeholder="Select a report type" />
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Date Range</Label>
          <DatePickerWithRange onSelect={setDateRange} />
        </div>

        <Button onClick={handleGenerateClick} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate Report'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ReportParameterSelection;
