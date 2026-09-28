import type {
  ReservationStatus,
  ReservationTicket,
} from '@/types/reservation';

export type PaymentStatus = 'APPROVED' | 'DECLINED';

export interface SimulatePaymentRequest {
  reservationId: number;
  outcome: PaymentStatus;
}

export interface SimulatedPaymentResponse {
  paymentReference: string;
  reservationId: number;
  paymentStatus: PaymentStatus;
  reservationStatus: ReservationStatus;
  amountMinor: number;
  currency: string;
  processedAt: string;
  ticket: ReservationTicket | null;
}
