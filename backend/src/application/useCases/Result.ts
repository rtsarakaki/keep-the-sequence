/**
 * Result pattern for handling success/error cases
 */
export type Result<T, E = string> =
  | { isSuccess: true; value: T }
  | { isSuccess: false; error: E };

export const success = <T>(value: T): Result<T> => ({
  isSuccess: true,
  value,
});

export const failure = <E = string>(error: E): Result<never, E> => ({
  isSuccess: false,
  error,
});

