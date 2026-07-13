import {
    PropertyStatus,
    PropertyType,
    TransactionType,
} from '../features/properties/properties.types';

export const transactionTypeLabels: Record<TransactionType, string> = {
    SELL: 'Bán',
    RENT: 'Cho thuê',
    UNKNOWN: 'Chưa rõ',
};

export const propertyTypeLabels: Record<PropertyType, string> = {
    APARTMENT: 'Căn hộ',
    HOUSE: 'Nhà',
    LAND: 'Đất nền',
    VILLA: 'Biệt thự',
    ROOM: 'Phòng trọ',
    UNKNOWN: 'Khác',
};

export const propertyStatusLabels: Record<PropertyStatus, string> = {
    DRAFT: 'Nháp',
    PENDING_REVIEW: 'Chờ duyệt',
    PUBLISHED: 'Đang hiển thị',
    ARCHIVED: 'Đã lưu trữ',
};

export function formatPrice(price: number | null | undefined): string {
    if (price === null || price === undefined) {
        return 'Liên hệ';
    }

    if (price >= 1_000_000_000) {
        const billion = price / 1_000_000_000;
        return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(billion)} tỷ`;
    }

    if (price >= 1_000_000) {
        const million = price / 1_000_000;
        return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(million)} triệu`;
    }

    return `${new Intl.NumberFormat('vi-VN').format(price)} đ`;
}

export function formatArea(area: number | null | undefined): string {
    if (area === null || area === undefined) {
        return 'Chưa có diện tích';
    }

    return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(area)} m²`;
}

export function formatDate(dateString: string | undefined): string {
    if (!dateString) {
        return 'Không rõ';
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return 'Không rõ';
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'Vừa xong';
    }

    if (diffInSeconds < 3600) {
        return `${Math.floor(diffInSeconds / 60)} phút trước`;
    }

    if (diffInSeconds < 86400) {
        return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    }

    if (diffInSeconds < 86400 * 7) {
        return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
}

export function formatPropertyType(value: PropertyType): string {
    return propertyTypeLabels[value] ?? propertyTypeLabels.UNKNOWN;
}

export function formatTransactionType(value: TransactionType): string {
    return transactionTypeLabels[value] ?? transactionTypeLabels.UNKNOWN;
}

export function formatPropertyStatus(value: PropertyStatus): string {
    return propertyStatusLabels[value] ?? value;
}
