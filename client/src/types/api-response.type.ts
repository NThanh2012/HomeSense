export interface ApiResponse<T> {
    code: string;
    message: string;
    data?: T;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    meta: PaginationMeta;
}
