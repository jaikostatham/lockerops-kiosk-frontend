export interface ValidateAccessCodeRequest {
  ticketCode: string;
  accessCode: string;
}

export interface AccessCodeValidationResult {
  granted: boolean;
  ticketCode: string;
  reservationId: number;
  lockerCompartmentId: number;
  compartmentNumber: number;
  reservedUntil: string;
  validatedAt: string;
}
