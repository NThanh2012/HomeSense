export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedResult<T> {
    items: T[];
    meta: PaginationMeta;
}

export const buildPaginationMeta = (
    page: number,
    limit: number,
    total: number,
): PaginationMeta => {
    return {
        page: page,
        limit: limit,
        total: total,
        totalPages: Math.ceil(total / limit),
    };
};

export const buildPaginatedResult = <T>(
    items: T[],
    page: number,
    limit: number,
    total: number,
): PaginatedResult<T> => {
    return {
        items: items,
        meta: buildPaginationMeta(page, limit, total),
    };
};
