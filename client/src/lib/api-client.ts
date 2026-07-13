import type { ApiResponse } from '../types/api-response.type';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const SUCCESS_CODE = '0000';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export class ApiClientError extends Error {
    code?: string;
    status?: number;

    constructor(message: string, options?: { code?: string; status?: number }) {
        super(message);
        this.name = 'ApiClientError';
        this.code = options?.code;
        this.status = options?.status;
    }
}

interface RequestOptions extends RequestInit {
    params?: object;
}

type FetchOptions = Omit<RequestOptions, 'method' | 'params' | 'body'>;

const buildUrl = (path: string, params?: object) => {
    const url = new URL(path.startsWith('http') ? path : `${API_BASE_URL}${path}`);

    if (!params) {
        return url.toString();
    }

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) {
            return;
        }

        url.searchParams.set(key, String(value));
    });

    return url.toString();
};

const parseJsonResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
    try {
        return (await response.json()) as ApiResponse<T>;
    } catch {
        throw new ApiClientError('Backend trả về response không hợp lệ', {
            status: response.status,
        });
    }
};

export const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
    const { params, headers, ...fetchOptions } = options;
    let response: Response;
    const requestHeaders = new Headers(headers);

    if (!requestHeaders.has('Content-Type')) {
        requestHeaders.set('Content-Type', 'application/json');
    }

    try {
        response = await fetch(buildUrl(path, params), {
            ...fetchOptions,
            headers: requestHeaders,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown network error';
        throw new ApiClientError(`Không thể kết nối backend API: ${message}`);
    }

    const payload = await parseJsonResponse<T>(response);

    if (!response.ok) {
        throw new ApiClientError(payload.message || 'Backend trả về lỗi HTTP', {
            code: payload.code,
            status: response.status,
        });
    }

    if (payload.code !== SUCCESS_CODE) {
        throw new ApiClientError(payload.message || 'Backend trả về mã lỗi', {
            code: payload.code,
            status: response.status,
        });
    }

    return payload.data as T;
};

export const get = <T>(path: string, params?: object, options: FetchOptions = {}) => {
    return request<T>(path, {
        ...options,
        method: 'GET',
        params: params,
    });
};

export const post = <T, TBody = unknown>(
    path: string,
    body?: TBody,
    options: FetchOptions = {},
) => {
    return request<T>(path, {
        ...options,
        method: 'POST',
        body: body === undefined ? undefined : JSON.stringify(body),
    });
};

export const patch = <T, TBody = unknown>(
    path: string,
    body?: TBody,
    options: FetchOptions = {},
) => {
    return request<T>(path, {
        ...options,
        method: 'PATCH',
        body: body === undefined ? undefined : JSON.stringify(body),
    });
};

export const del = <T>(path: string, options: FetchOptions = {}) => {
    return request<T>(path, {
        ...options,
        method: 'DELETE',
    });
};

export const apiClient = {
    request,
    get,
    post,
    patch,
    del,
};
