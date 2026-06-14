export type LockerStationStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'MAINTENANCE'
  | 'OUT_OF_SERVICE';

export interface LockerStation {
  id: number;
  name: string;
  model: string;
  manufacturer: string;
  status: LockerStationStatus;
  location: string;
  imageUrl: string | null;
}
