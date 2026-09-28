import { httpClient } from './httpClient';
import type {
  CreateReservationRequest,
  Reservation,
} from '@/types/reservation';

export async function createReservation(
  payload: CreateReservationRequest,
): Promise<Reservation> {
  const response = await httpClient.post<Reservation>(
    '/api/reservations',
    payload,
  );

  return response.data;
}

export async function getReservations(): Promise<Reservation[]> {
  const response = await httpClient.get<Reservation[]>('/api/reservations');

  return response.data;
}

export async function getReservation(id: number): Promise<Reservation> {
  const response = await httpClient.get<Reservation>(`/api/reservations/${id}`);

  return response.data;
}

export async function cancelReservation(id: number): Promise<Reservation> {
  const response = await httpClient.patch<Reservation>(
    `/api/reservations/${id}/cancel`,
  );

  return response.data;
}
