import { httpClient } from './httpClient';
import type {
  AccessCodeValidationResult,
  ValidateAccessCodeRequest,
} from '@/types/accessCode';

export async function validateAccessCode(
  payload: ValidateAccessCodeRequest,
): Promise<AccessCodeValidationResult> {
  const response = await httpClient.post<AccessCodeValidationResult>(
    '/api/access-codes/validate',
    payload,
  );

  return response.data;
}
