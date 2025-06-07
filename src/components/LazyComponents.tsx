import { lazy } from 'react';

// Lazy load page components for better performance
export const LazyDashboard = lazy(() => import('@/pages/Dashboard'));
export const LazyClientsList = lazy(() => import('@/pages/ClientsList'));
export const LazyInvoicesList = lazy(() => import('@/pages/InvoicesList'));
export const LazyInvoiceEditor = lazy(() => import('@/pages/InvoiceEditor'));
export const LazyInvoicePreview = lazy(() => import('@/pages/InvoicePreview'));
export const LazySettings = lazy(() => import('@/pages/Settings'));
export const LazyAuth = lazy(() => import('@/pages/Auth'));
export const LazyOnboarding = lazy(() => import('@/pages/Onboarding'));

// Lazy load feature components
export const LazyInvoicePreviewPanel = lazy(() => 
  import('@/features/invoices/components/InvoicePreviewPanel').then(module => ({
    default: module.default
  }))
);

export const LazySendInvoiceModal = lazy(() => 
  import('@/features/invoices/components/SendInvoiceModal').then(module => ({
    default: module.default
  }))
);

export const LazyAddClientModal = lazy(() => import('@/components/AddClientModal'));
