import { PAYMENT_STATUS_LABEL } from '@/lib/orders';
import type { PaymentStatus } from '@/lib/types';

/**
 * Jedyny status, jaki zamówienie niesie w interfejsie, to status płatności.
 * Etapy realizacji prowadzimy poza systemem, więc nie ma dla nich plakietki.
 */
export function PaymentPill({ status }: { status: PaymentStatus }) {
  return (
    <span className={`status-pill status-payment-${status}`}>{PAYMENT_STATUS_LABEL[status]}</span>
  );
}
