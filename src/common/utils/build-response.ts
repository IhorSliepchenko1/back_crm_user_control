interface ApiResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
}

export function buildResponse<T = undefined>(
  message: string,
  data?: T,
): ApiResponse<T> {
  return {
    success: true,
    message,
    ...(data !== undefined && { data }),
  };
}
