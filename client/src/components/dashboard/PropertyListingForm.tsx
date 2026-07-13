'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    createMyProperty,
    submitMyProperty,
    updateMyProperty,
} from '../../features/properties/properties.api';
import {
    CreatePropertyPayload,
    Property,
    PropertyType,
    TransactionType,
    UpdateMyPropertyPayload,
} from '../../features/properties/properties.types';
import { formatPropertyStatus } from '../../lib/format';

const TRANSACTION_OPTIONS: Array<{ value: TransactionType; label: string }> = [
    { value: 'SELL', label: 'Bán' },
    { value: 'RENT', label: 'Cho thuê' },
];

const PROPERTY_TYPE_OPTIONS: Array<{ value: PropertyType; label: string }> = [
    { value: 'HOUSE', label: 'Nhà' },
    { value: 'APARTMENT', label: 'Căn hộ' },
    { value: 'LAND', label: 'Đất nền' },
    { value: 'VILLA', label: 'Biệt thự' },
    { value: 'ROOM', label: 'Phòng trọ' },
    { value: 'UNKNOWN', label: 'Khác' },
];

interface PropertyListingFormProps {
    token: string;
    property?: Property;
}

interface FormState {
    title: string;
    description: string;
    transactionType: TransactionType;
    propertyType: PropertyType;
    price: string;
    area: string;
    bedrooms: string;
    bathrooms: string;
    furnishingStatus: string;
    legalStatus: string;
    direction: string;
    amenities: string;
    contactPhone: string;
    mediaUrls: string;
    province: string;
    district: string;
    ward: string;
    street: string;
    rawAddress: string;
    latitude: string;
    longitude: string;
}

const toText = (value?: string | null) => value ?? '';

const toNumberText = (value?: number | null) =>
    value === null || value === undefined ? '' : String(value);

const optionalText = (value: string) => {
    const normalized = value.trim();
    return normalized || undefined;
};

const optionalNumber = (value: string) => {
    const normalized = value.trim();
    if (!normalized) {
        return undefined;
    }

    const number = Number(normalized);
    return Number.isFinite(number) ? number : undefined;
};

const toLines = (value: string) =>
    value
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

const toCommaList = (value: string) =>
    value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

export function PropertyListingForm({ token, property }: PropertyListingFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const canEdit =
        !property || property.status === 'DRAFT' || property.status === 'PENDING_REVIEW';

    const initialState = useMemo<FormState>(() => ({
        title: property?.title ?? '',
        description: toText(property?.description),
        transactionType: property?.transactionType === 'UNKNOWN' ? 'SELL' : property?.transactionType ?? 'SELL',
        propertyType: property?.propertyType === 'UNKNOWN' ? 'HOUSE' : property?.propertyType ?? 'HOUSE',
        price: toNumberText(property?.price),
        area: toNumberText(property?.area),
        bedrooms: toNumberText(property?.bedrooms),
        bathrooms: toNumberText(property?.bathrooms),
        furnishingStatus: toText(property?.furnishingStatus),
        legalStatus: toText(property?.legalStatus),
        direction: toText(property?.direction),
        amenities: property?.amenities?.join(', ') ?? '',
        contactPhone: toText(property?.contactPhone),
        mediaUrls: property?.media?.map((item) => item.url).join('\n') ?? '',
        province: toText(property?.location?.province),
        district: toText(property?.location?.district),
        ward: toText(property?.location?.ward),
        street: toText(property?.location?.street),
        rawAddress: toText(property?.location?.rawAddress),
        latitude: toNumberText(property?.latitude ?? property?.location?.latitude),
        longitude: toNumberText(property?.longitude ?? property?.location?.longitude),
    }), [property]);

    const [form, setForm] = useState<FormState>(initialState);

    const updateField = <TKey extends keyof FormState>(key: TKey, value: FormState[TKey]) => {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const buildPayload = (): CreatePropertyPayload => ({
        title: form.title.trim(),
        description: optionalText(form.description),
        transactionType: form.transactionType,
        propertyType: form.propertyType,
        price: optionalNumber(form.price),
        area: optionalNumber(form.area),
        bedrooms: optionalNumber(form.bedrooms),
        bathrooms: optionalNumber(form.bathrooms),
        furnishingStatus: optionalText(form.furnishingStatus),
        legalStatus: optionalText(form.legalStatus),
        direction: optionalText(form.direction),
        amenities: toCommaList(form.amenities),
        contactPhone: optionalText(form.contactPhone),
        mediaUrls: toLines(form.mediaUrls),
        province: optionalText(form.province),
        district: optionalText(form.district),
        ward: optionalText(form.ward),
        street: optionalText(form.street),
        rawAddress: optionalText(form.rawAddress),
        latitude: optionalNumber(form.latitude),
        longitude: optionalNumber(form.longitude),
    });

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canEdit) {
            return;
        }

        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const shouldSubmitForReview = submitter?.value === 'submit';
        setIsSubmitting(true);
        setError('');

        try {
            const payload = buildPayload();
            let saved: Property;

            if (property) {
                saved = await updateMyProperty(property.id, payload as UpdateMyPropertyPayload, token);
            } else {
                saved = await createMyProperty(payload, token);
            }

            if (shouldSubmitForReview) {
                await submitMyProperty(saved.id, token);
            }

            router.push('/dashboard/properties');
            router.refresh();
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : 'Không thể lưu tin đăng.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="admin-form-grid property-listing-form" onSubmit={handleSubmit}>
            {property ? (
                <p className="note admin-form-wide">
                    Trạng thái hiện tại: {formatPropertyStatus(property.status)}
                </p>
            ) : null}

            {!canEdit ? (
                <p className="note admin-form-wide">
                    Tin đã công khai hoặc lưu trữ chỉ có thể đổi trạng thái bởi admin.
                </p>
            ) : null}

            <label className="admin-form-wide">
                <span>Tiêu đề</span>
                <input
                    value={form.title}
                    disabled={!canEdit || isSubmitting}
                    onChange={(event) => updateField('title', event.target.value)}
                    required
                    maxLength={200}
                />
            </label>

            <label>
                <span>Loại giao dịch</span>
                <select
                    value={form.transactionType}
                    disabled={!canEdit || isSubmitting}
                    onChange={(event) => updateField('transactionType', event.target.value as TransactionType)}
                >
                    {TRANSACTION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </label>

            <label>
                <span>Loại bất động sản</span>
                <select
                    value={form.propertyType}
                    disabled={!canEdit || isSubmitting}
                    onChange={(event) => updateField('propertyType', event.target.value as PropertyType)}
                >
                    {PROPERTY_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </label>

            <label className="admin-form-wide">
                <span>Mô tả</span>
                <textarea
                    value={form.description}
                    disabled={!canEdit || isSubmitting}
                    rows={7}
                    maxLength={5000}
                    onChange={(event) => updateField('description', event.target.value)}
                />
            </label>

            <label>
                <span>Giá</span>
                <input
                    value={form.price}
                    disabled={!canEdit || isSubmitting}
                    inputMode="numeric"
                    onChange={(event) => updateField('price', event.target.value)}
                    placeholder="VD: 3500000000"
                />
            </label>

            <label>
                <span>Diện tích m²</span>
                <input
                    value={form.area}
                    disabled={!canEdit || isSubmitting}
                    inputMode="decimal"
                    onChange={(event) => updateField('area', event.target.value)}
                    placeholder="VD: 72"
                />
            </label>

            <label>
                <span>Phòng ngủ</span>
                <input
                    value={form.bedrooms}
                    disabled={!canEdit || isSubmitting}
                    inputMode="numeric"
                    onChange={(event) => updateField('bedrooms', event.target.value)}
                />
            </label>

            <label>
                <span>Phòng tắm</span>
                <input
                    value={form.bathrooms}
                    disabled={!canEdit || isSubmitting}
                    inputMode="numeric"
                    onChange={(event) => updateField('bathrooms', event.target.value)}
                />
            </label>

            <label>
                <span>Nội thất</span>
                <input
                    value={form.furnishingStatus}
                    disabled={!canEdit || isSubmitting}
                    onChange={(event) => updateField('furnishingStatus', event.target.value)}
                    placeholder="Đầy đủ, cơ bản..."
                />
            </label>

            <label>
                <span>Pháp lý</span>
                <input
                    value={form.legalStatus}
                    disabled={!canEdit || isSubmitting}
                    onChange={(event) => updateField('legalStatus', event.target.value)}
                    placeholder="Sổ hồng, hợp đồng..."
                />
            </label>

            <label>
                <span>Hướng</span>
                <input
                    value={form.direction}
                    disabled={!canEdit || isSubmitting}
                    onChange={(event) => updateField('direction', event.target.value)}
                    placeholder="Đông Nam"
                />
            </label>

            <label>
                <span>Số điện thoại liên hệ</span>
                <input
                    value={form.contactPhone}
                    disabled={!canEdit || isSubmitting}
                    onChange={(event) => updateField('contactPhone', event.target.value)}
                />
            </label>

            <label className="admin-form-wide">
                <span>Địa chỉ</span>
                <input
                    value={form.rawAddress}
                    disabled={!canEdit || isSubmitting}
                    onChange={(event) => updateField('rawAddress', event.target.value)}
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                />
            </label>

            <label>
                <span>Tỉnh/thành</span>
                <input
                    value={form.province}
                    disabled={!canEdit || isSubmitting}
                    onChange={(event) => updateField('province', event.target.value)}
                />
            </label>

            <label>
                <span>Quận/huyện</span>
                <input
                    value={form.district}
                    disabled={!canEdit || isSubmitting}
                    onChange={(event) => updateField('district', event.target.value)}
                />
            </label>

            <label>
                <span>Phường/xã</span>
                <input
                    value={form.ward}
                    disabled={!canEdit || isSubmitting}
                    onChange={(event) => updateField('ward', event.target.value)}
                />
            </label>

            <label>
                <span>Đường</span>
                <input
                    value={form.street}
                    disabled={!canEdit || isSubmitting}
                    onChange={(event) => updateField('street', event.target.value)}
                />
            </label>

            <label>
                <span>Vĩ độ</span>
                <input
                    value={form.latitude}
                    disabled={!canEdit || isSubmitting}
                    inputMode="decimal"
                    onChange={(event) => updateField('latitude', event.target.value)}
                />
            </label>

            <label>
                <span>Kinh độ</span>
                <input
                    value={form.longitude}
                    disabled={!canEdit || isSubmitting}
                    inputMode="decimal"
                    onChange={(event) => updateField('longitude', event.target.value)}
                />
            </label>

            <label className="admin-form-wide">
                <span>Tiện ích</span>
                <input
                    value={form.amenities}
                    disabled={!canEdit || isSubmitting}
                    onChange={(event) => updateField('amenities', event.target.value)}
                    placeholder="Ban công, hồ bơi, gần trường học"
                />
            </label>

            <label className="admin-form-wide">
                <span>Ảnh/video URL</span>
                <textarea
                    value={form.mediaUrls}
                    disabled={!canEdit || isSubmitting}
                    rows={5}
                    onChange={(event) => updateField('mediaUrls', event.target.value)}
                    placeholder="Mỗi URL một dòng"
                />
            </label>

            {error ? <p className="form-error admin-form-wide">{error}</p> : null}

            {canEdit ? (
                <div className="admin-form-actions">
                    <button type="submit" className="button-secondary" value="draft" disabled={isSubmitting}>
                        {isSubmitting ? 'Đang lưu...' : property ? 'Lưu thay đổi' : 'Lưu nháp'}
                    </button>
                    <button type="submit" className="button-primary" value="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Đang gửi...' : 'Gửi duyệt'}
                    </button>
                </div>
            ) : null}
        </form>
    );
}
