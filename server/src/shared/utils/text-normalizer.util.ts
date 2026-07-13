export const normalizeSpaces = (value: string): string => {
    return value.replace(/\s+/g, ' ').trim();
};

export const normalizeVietnameseText = (value: string): string => {
    return normalizeSpaces(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd');
};

export const getFirstContentLine = (value: string): string => {
    const line = value
        .split(/\r?\n/)
        .map((item) => item.trim())
        .find((item) => item.length > 0);

    return line ?? normalizeSpaces(value).slice(0, 120);
};
