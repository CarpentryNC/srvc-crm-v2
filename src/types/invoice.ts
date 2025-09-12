export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';

export interface InvoiceStatusConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
}
