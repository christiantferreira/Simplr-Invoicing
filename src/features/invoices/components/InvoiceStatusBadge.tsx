import React from 'react';
import { Badge } from '@/components/ui/badge';
import { InvoiceStatus } from '@/types';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({ status }) => {
  const statusColors: Record<InvoiceStatus, string> = {
    draft: 'bg-gray-500',
    ready: 'bg-blue-500',
    sent: 'bg-green-500',
    viewed: 'bg-yellow-500',
    paid: 'bg-purple-500',
    overdue: 'bg-red-500',
  };

  return (
    <Badge className={statusColors[status]}>
      {status}
    </Badge>
  );
};

export default InvoiceStatusBadge;
