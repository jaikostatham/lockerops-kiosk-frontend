export function getDateTimeValue(value: string): number | null {
  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp) ? null : timestamp;
}

export function isPastDateTime(value: string, now = Date.now()): boolean {
  const timestamp = getDateTimeValue(value);

  return timestamp !== null && timestamp <= now;
}
