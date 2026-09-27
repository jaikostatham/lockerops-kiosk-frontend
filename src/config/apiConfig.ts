const DEFAULT_API_BASE_URL = '';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;

const reservationFlowSetting =
  import.meta.env.VITE_RESERVATION_FLOW_ENABLED?.trim().toLowerCase();

export const RESERVATION_FLOW_ENABLED = reservationFlowSetting
  ? reservationFlowSetting === 'true'
  : import.meta.env.DEV;
