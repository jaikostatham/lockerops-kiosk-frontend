import axios from 'axios';

import { API_BASE_URL } from '@/config/apiConfig';
import i18n from '@/i18n';

export interface ApiClientError {
  message: string;
  status?: number;
}

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 9000,
  headers: {
    Accept: 'application/json',
  },
});

function getResponseMessage(data: unknown): string {
  if (
    data &&
    typeof data === 'object' &&
    'message' in data &&
    typeof data.message === 'string'
  ) {
    return data.message;
  }

  return '';
}

function getResponseCode(data: unknown): number | string | undefined {
  if (data && typeof data === 'object' && 'code' in data) {
    const code = data.code;

    if (typeof code === 'number' || typeof code === 'string') {
      return code;
    }
  }

  return undefined;
}

export function getApiErrorCode(error: unknown): number | string | undefined {
  if (axios.isAxiosError(error)) {
    return getResponseCode(error.response?.data);
  }

  return undefined;
}

export function getApiErrorMessage(
  error: unknown,
  statusMessages: Partial<Record<number, string>> = {},
): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    if (status && statusMessages[status]) {
      return statusMessages[status];
    }

    const responseMessage = getResponseMessage(error.response?.data);

    if (responseMessage) {
      return responseMessage;
    }

    if (status === 404) {
      return i18n.global.t('apiErrors.notFound');
    }

    if (status) {
      return i18n.global.t('apiErrors.status', { status });
    }

    if (error.code === 'ECONNABORTED') {
      return i18n.global.t('apiErrors.timeout');
    }

    return i18n.global.t('apiErrors.unreachable');
  }

  return i18n.global.t('apiErrors.unexpected');
}
