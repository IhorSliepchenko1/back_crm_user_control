import { ApiResponse } from 'src/common/interfaces';

export function buildResponse<T = undefined>(
  message: string,
  data?: T,
): ApiResponse<T> {
  return {
    success: true,
    message,
    ...(data !== undefined && data),
  };
}
