import { httpClient } from './httpClient';
import type { LockerStation } from '@/types/lockerStation';

export async function getLockerStations(): Promise<LockerStation[]> {
  const response = await httpClient.get<LockerStation[]>('/api/locker-stations');

  return response.data;
}

export async function getLockerStation(id: number): Promise<LockerStation> {
  const response = await httpClient.get<LockerStation>(
    `/api/locker-stations/${id}`,
  );

  return response.data;
}
