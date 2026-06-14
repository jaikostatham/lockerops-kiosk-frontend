import { httpClient } from './httpClient';
import type { LockerCompartment } from '@/types/lockerCompartment';

export async function getLockerCompartmentsByStationId(
  lockerStationId: number,
): Promise<LockerCompartment[]> {
  const response = await httpClient.get<LockerCompartment[]>(
    `/api/locker-stations/${lockerStationId}/compartments`,
  );

  return response.data;
}

export async function getLockerCompartment(
  id: number,
): Promise<LockerCompartment> {
  const response = await httpClient.get<LockerCompartment>(
    `/api/locker-compartments/${id}`,
  );

  return response.data;
}
