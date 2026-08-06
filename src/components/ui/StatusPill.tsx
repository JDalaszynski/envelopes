import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from '@/lib/orders';
import type { OrderStatus, PaymentStatus } from '@/lib/types';

export function StatusPill({ status }: { status: OrderStatus }) {
  return <span className={`status-pill status-${status}`}>{ORDER_STATUS_LABEL[status]}</span>;
}

export function PaymentPill({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={`status-pill ${status === 'oplacone' ? 'status-zrealizowane' : 'status-w_trakcie'}`}
    >
      {PAYMENT_STATUS_LABEL[status]}
    </span>
  );
}
