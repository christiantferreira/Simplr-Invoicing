
import React from 'react';
import { InvoiceStatus } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getStatusConfig = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft':
        return {
          label: 'Draft',
          className: 'bg-gray-100 text-gray-800',
        };
      case 'ready':
        return {
          label: 'Ready',
          className: 'bg-orange-100 text-orange-800',
        };
      case 'sent':
        return {
          label: 'Sent',
          className: 'bg-blue-100 text-blue-800',
        };
      case 'viewed':
        return {
          label: 'Viewed',
          className: 'bg-yellow-100 text-yellow-800',
        };
      case 'paid':
        return {
          label: 'Paid',
          className: 'bg-green-100 text-green-800',
        };
      case 'overdue':
        return {
          label: 'Overdue',
          className: 'bg-red-100 text-red-800',
        };
      default:
        return {
          label: 'Unknown',
          className: 'bg-gray-100 text-gray-800',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
