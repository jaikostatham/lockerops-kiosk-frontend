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
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  expiredAt: string | null;
  completedAt: string | null;
}
