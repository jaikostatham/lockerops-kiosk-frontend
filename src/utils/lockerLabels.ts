import type {
  LockerCompartmentSize,
  LockerCompartmentStatus,
} from '@/types/lockerCompartment';
import type { LockerStationStatus } from '@/types/lockerStation';

export const stationStatusLabelKeys: Record<LockerStationStatus, string> = {
  ACTIVE: 'stationStatuses.ACTIVE',
  INACTIVE: 'stationStatuses.INACTIVE',
  MAINTENANCE: 'stationStatuses.MAINTENANCE',
  OUT_OF_SERVICE: 'stationStatuses.OUT_OF_SERVICE',
};

export const compartmentStatusLabelKeys: Record<LockerCompartmentStatus, string> = {
  AVAILABLE: 'compartmentStatuses.AVAILABLE',
  RESERVED: 'compartmentStatuses.RESERVED',
  OCCUPIED: 'compartmentStatuses.OCCUPIED',
  OUT_OF_SERVICE: 'compartmentStatuses.OUT_OF_SERVICE',
};

export const compartmentSizeLabelKeys: Record<LockerCompartmentSize, string> = {
  SMALL: 'compartmentSizes.SMALL',
  MEDIUM: 'compartmentSizes.MEDIUM',
  LARGE: 'compartmentSizes.LARGE',
  EXTRA_LARGE: 'compartmentSizes.EXTRA_LARGE',
};

export function getStationStatusLabelKey(status: LockerStationStatus): string {
  return stationStatusLabelKeys[status];
}

export function getCompartmentStatusLabelKey(
  status: LockerCompartmentStatus,
): string {
  return compartmentStatusLabelKeys[status];
}

export function getCompartmentSizeLabelKey(
  size: LockerCompartmentSize,
): string {
  return compartmentSizeLabelKeys[size];
}
