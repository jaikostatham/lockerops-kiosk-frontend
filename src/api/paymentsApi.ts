import { httpClient } from './httpClient';
import type {
  SimulatePaymentRequest,
  SimulatedPaymentResponse,
} from '@/types/payment';

export async function simulatePayment(
  payload: SimulatePaymentRequest,
): Promise<SimulatedPaymentResponse> {
  const response = await httpClient.post<SimulatedPaymentResponse>(
    '/api/payments/simulate',
    payload,
  );

  return response.data;
}
