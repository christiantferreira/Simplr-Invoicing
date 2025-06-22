import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerWithRange } from '../../../components/ui/date-picker-with-range';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';

interface ReportGeneratorProps {
  onGenerate: (reportType: string, dateRange: DateRange) => void;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ onGenerate }) => {
  const [reportType, setReportType] = useState('revenue_summary');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const handleGenerate = () => {
    if (reportType && dateRange) {
      onGenerate(reportType, dateRange);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Generator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Select onValueChange={setReportType} defaultValue={reportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select a report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue_summary">Revenue Summary</SelectItem>
                <SelectItem value="tax_summary">Tax Summary</SelectItem>
                <SelectItem value="client_performance">Client Performance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <DatePickerWithRange onSelect={setDateRange} />
          </div>
<div className="flex space-x-2">
            <Button onClick={() => onGenerate(reportType, { from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), to: new Date() })}>This Month</Button>
            <Button onClick={() => onGenerate(reportType, { from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), to: new Date(new Date().getFullYear(), new Date().getMonth(), 0) })}>Last Month</Button>
          </div>
<Button onClick={handleGenerate}>Generate Report</Button>
          <Button onClick={() => console.log('Exporting CSV...')}>Export as CSV</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportGenerator;
