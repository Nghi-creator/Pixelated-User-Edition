export type ApiRequestOptions = RequestInit & {
  authenticated?: boolean;
  timeoutMs?: number;
};

export type ApiResponseParser<T> = {
  parse: (payload: unknown) => T;
};

export type ApiRequest = <T>(
  path: string,
  options: ApiRequestOptions | undefined,
  parser: ApiResponseParser<T>,
) => Promise<T>;
