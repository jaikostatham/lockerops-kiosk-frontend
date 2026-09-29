export type ReservationStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'COMPLETED';

export interface CreateReservationRequest {
  lockerCompartmentId: number;
  durationMinutes: number;
  customerReference?: string;
}

export interface Reservation {
  id: number;
  reservationReference: string;
  lockerCompartmentId: number;
  lockerStationId: number;
  compartmentNumber: number;
  status: ReservationStatus;
  reservedFrom: string;
  reservedUntil: string;
  customerReference: string | null;
  amountMinor: number;
  currency: string;
  paymentExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  expiredAt: string | null;
  completedAt: string | null;
}

export interface ReservationTicket {
  reservationId: number;
  reservationReference: string;
  reservationStatus: ReservationStatus;
  lockerCompartmentId: number;
  lockerStationId: number;
  compartmentNumber: number;
  reservedFrom: string;
  reservedUntil: string;
  customerReference: string | null;
  ticketCode: string;
  accessCode: string;
}
