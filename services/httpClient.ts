import type { ApiFailure, ApiResponse } from "@/types/api";

type RequestConfig = RequestInit & { url: string };

type RequestInterceptor = (config: RequestConfig) => Promise<RequestConfig> | RequestConfig;

type ResponseInterceptor = (response: Response) => Promise<Response> | Response;

type RetryConfig = {
  retries: number;
  delay: number;
};

const requestInterceptors: RequestInterceptor[] = [];
const responseInterceptors: ResponseInterceptor[] = [];

const defaultRetryConfig: RetryConfig = { retries: 2, delay: 400 };

export const addRequestInterceptor = (interceptor: RequestInterceptor) => {
  requestInterceptors.push(interceptor);
};

export const addResponseInterceptor = (interceptor: ResponseInterceptor) => {
  responseInterceptors.push(interceptor);
};

const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL ?? "";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetry = (error: unknown) =>
  error instanceof TypeError || (error instanceof Error && error.message.includes("Network"));

const runRequestInterceptors = async (config: RequestConfig) => {
  let current = config;
  for (const interceptor of requestInterceptors) {
    current = await interceptor(current);
  }
  return current;
};

const runResponseInterceptors = async (response: Response) => {
  let current = response;
  for (const interceptor of responseInterceptors) {
    current = await interceptor(current);
  }
  return current;
};

const parseJson = async <T>(response: Response): Promise<ApiResponse<T>> => {
  if (response.status === 204) {
    return { success: true, data: null as T };
  }

  const text = await response.text();
  if (!text) {
    return { success: true, data: null as T };
  }

  try {
    const parsed = JSON.parse(text) as ApiResponse<T> | T;
    if (
      parsed &&
      typeof parsed === "object" &&
      "success" in parsed &&
      typeof (parsed as ApiResponse<T>).success === "boolean"
    ) {
      return parsed as ApiResponse<T>;
    }
    return { success: true, data: parsed as T };
  } catch {
    return {
      success: false,
      error: {
        code: "INVALID_JSON",
        message: "Resposta inválida do servidor",
        details: text,
      },
    } satisfies ApiFailure;
  }
};

const requestWithRetry = async <T>(
  config: RequestConfig,
  retryConfig: RetryConfig = defaultRetryConfig,
): Promise<ApiResponse<T>> => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retryConfig.retries) {
    try {
      const interceptedConfig = await runRequestInterceptors(config);
      const response = await fetch(`${getBaseUrl()}${interceptedConfig.url}`, interceptedConfig);
      const interceptedResponse = await runResponseInterceptors(response);

      if (!interceptedResponse.ok) {
        let errorMessage = interceptedResponse.statusText || "Erro inesperado";
        let details: unknown = null;

        try {
          const data = await interceptedResponse.json();
          details = data;
          if (data && typeof data === "object" && "detail" in data) {
            errorMessage = String((data as { detail?: string }).detail);
          }
        } catch {
          details = await interceptedResponse.text();
        }

        return {
          success: false,
          error: {
            code: `HTTP_${interceptedResponse.status}`,
            message: errorMessage,
            details,
          },
        } satisfies ApiFailure;
      }

      return await parseJson<T>(interceptedResponse);
    } catch (error) {
      lastError = error;
      if (!shouldRetry(error) || attempt === retryConfig.retries) break;
      await sleep(retryConfig.delay * Math.pow(2, attempt));
      attempt += 1;
    }
  }

  return {
    success: false,
    error: {
      code: "NETWORK_ERROR",
      message: "Não foi possível se conectar ao servidor",
      details: lastError,
    },
  } satisfies ApiFailure;
};

export const apiClient = {
  get: <T>(url: string, config?: RequestInit) =>
    requestWithRetry<T>({ url, method: "GET", ...config }),
  post: <T>(url: string, body?: unknown, config?: RequestInit) =>
    requestWithRetry<T>({
      url,
      method: "POST",
      headers: { "Content-Type": "application/json", ...(config?.headers ?? {}) },
      body: body ? JSON.stringify(body) : undefined,
      ...config,
    }),
  put: <T>(url: string, body?: unknown, config?: RequestInit) =>
    requestWithRetry<T>({
      url,
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(config?.headers ?? {}) },
      body: body ? JSON.stringify(body) : undefined,
      ...config,
    }),
  patch: <T>(url: string, body?: unknown, config?: RequestInit) =>
    requestWithRetry<T>({
      url,
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(config?.headers ?? {}) },
      body: body ? JSON.stringify(body) : undefined,
      ...config,
    }),
  delete: <T>(url: string, config?: RequestInit) =>
    requestWithRetry<T>({ url, method: "DELETE", ...config }),
};
