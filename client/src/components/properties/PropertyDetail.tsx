import { Property } from '../../features/properties/properties.types';
import {
    formatArea,
    formatPrice,
    formatPropertyStatus,
    propertyTypeLabels,
    transactionTypeLabels,
} from '../../lib/format';
import { MapPin, Maximize, Phone, Tag, Info } from 'lucide-react';
import { PropertyFavoriteButton } from './PropertyFavoriteButton';
import { PropertyInquiryForm } from './PropertyInquiryForm';
import { PropertyMediaGallery } from './PropertyMediaGallery';
import { PropertyViewTracker } from './PropertyViewTracker';

interface PropertyDetailProps {
    property: Property;
}

export function PropertyDetail({ property }: PropertyDetailProps) {
    const location = property.location;

    return (
        <article className="detail-layout">
            <PropertyViewTracker propertyId={property.id} />
            <PropertyMediaGallery media={property.media} title={property.title} />

            <section className="detail-main">
                <div className="detail-heading">
                    <div className="tag-row">
                        <span className="tag">
                            {transactionTypeLabels[property.transactionType]}
                        </span>
                        <span className="tag tag-muted">
                            {propertyTypeLabels[property.propertyType]}
                        </span>
                    </div>
                    <h1>{property.title}</h1>
                    <p>{location?.rawAddress ?? 'Chưa có địa chỉ'}</p>
                </div>

                <div className="detail-metrics">
                    <div>
                        <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}><Tag size={16} />Giá</span>
                        <strong>{formatPrice(property.price)}</strong>
                    </div>
                    <div>
                        <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}><Maximize size={16} />Diện tích</span>
                        <strong>{formatArea(property.area)}</strong>
                    </div>
                    <div>
                        <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}><Info size={16} />Trạng thái</span>
                        <strong>{formatPropertyStatus(property.status)}</strong>
                    </div>
                </div>

                <section className="detail-section">
                    <h2>Mô tả</h2>
                    <p>{property.description || 'Chưa có mô tả chi tiết.'}</p>
                </section>

                <section className="detail-section">
                    <h2>Thông tin bất động sản</h2>
                    <dl className="detail-list">
                        <div>
                            <dt>Phòng ngủ</dt>
                            <dd>{property.bedrooms ?? 'Chưa cung cấp'}</dd>
                        </div>
                        <div>
                            <dt>Phòng tắm</dt>
                            <dd>{property.bathrooms ?? 'Chưa cung cấp'}</dd>
                        </div>
                        <div>
                            <dt>Nội thất</dt>
                            <dd>{property.furnishingStatus ?? 'Chưa cung cấp'}</dd>
                        </div>
                        <div>
                            <dt>Pháp lý</dt>
                            <dd>{property.legalStatus ?? 'Chưa cung cấp'}</dd>
                        </div>
                        <div>
                            <dt>Hướng</dt>
                            <dd>{property.direction ?? 'Chưa cung cấp'}</dd>
                        </div>
                    </dl>
                    {property.amenities && property.amenities.length > 0 ? (
                        <div>
                            <h3>Tiện ích</h3>
                            <p>{property.amenities.join(' · ')}</p>
                        </div>
                    ) : null}
                </section>

                <section className="detail-section">
                    <h2>Thông tin liên hệ</h2>
                    <dl className="detail-list">
                        <div>
                            <dt>Người đăng</dt>
                            <dd>{property.createdBy?.fullName ?? 'Người bán'}</dd>
                        </div>
                        <div>
                            <dt style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={16} />Số điện thoại</dt>
                            <dd>{property.contactPhone ?? 'Chưa có'}</dd>
                        </div>
                    </dl>
                </section>

                <section className="detail-section">
                    <h2>Lưu tin và tư vấn</h2>
                    <div className="interaction-stack">
                        <PropertyFavoriteButton propertyId={property.id} />
                        <PropertyInquiryForm propertyId={property.id} />
                    </div>
                </section>

                <section className="detail-section">
                    <h2>Vị trí</h2>
                    <dl className="detail-list">
                        <div>
                            <dt style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} />Địa chỉ đầy đủ</dt>
                            <dd>{location?.rawAddress ?? 'Chưa có'}</dd>
                        </div>
                        <div>
                            <dt style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} />Tỉnh/thành</dt>
                            <dd>{location?.province ?? 'Chưa có'}</dd>
                        </div>
                        <div>
                            <dt style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} />Quận/huyện</dt>
                            <dd>{location?.district ?? 'Chưa có'}</dd>
                        </div>
                        <div>
                            <dt style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} />Phường/xã</dt>
                            <dd>{location?.ward ?? 'Chưa có'}</dd>
                        </div>
                        <div>
                            <dt style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} />Đường</dt>
                            <dd>{location?.street ?? 'Chưa có'}</dd>
                        </div>
                    </dl>
                </section>
            </section>
        </article>
    );
}
