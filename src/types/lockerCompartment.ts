export type LockerCompartmentStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'OCCUPIED'
  | 'OUT_OF_SERVICE';

export type LockerCompartmentSize =
  | 'SMALL'
  | 'MEDIUM'
  | 'LARGE'
  | 'EXTRA_LARGE';

export interface LockerCompartment {
  id: number;
  compartmentNumber: number;
  size: LockerCompartmentSize;
  status: LockerCompartmentStatus;
  lockerStationId: number;
}
