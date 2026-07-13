import Link from 'next/link';
import { Filter, RefreshCcw, Search } from 'lucide-react';
import { PropertyListQuery } from '../../features/properties/properties.types';

interface PropertyFilterProps {
    query: PropertyListQuery;
}

export function PropertyFilter({ query }: PropertyFilterProps) {
    return (
        <form action="/properties" method="get" className="filter-panel property-filter-panel">
            <input type="hidden" name="page" value="1" />
            <input type="hidden" name="limit" value={query.limit ?? 9} />
            {query.sortBy ? <input type="hidden" name="sortBy" value={query.sortBy} /> : null}
            {query.sortOrder ? <input type="hidden" name="sortOrder" value={query.sortOrder} /> : null}

            <label className="filter-field filter-field-wide">
                <span>Từ khóa tìm kiếm</span>
                <div className="filter-input-icon">
                    <Search size={18} />
                    <input
                        name="keyword"
                        type="search"
                        placeholder="Tiêu đề, mô tả, địa chỉ..."
                        defaultValue={query.keyword ?? ''}
                    />
                </div>
            </label>

            <label className="filter-field">
                <span>Giao dịch</span>
                <select name="transactionType" defaultValue={query.transactionType ?? ''}>
                    <option value="">Tất cả giao dịch</option>
                    <option value="SELL">Bán</option>
                    <option value="RENT">Cho thuê</option>
                </select>
            </label>

            <label className="filter-field">
                <span>Loại BĐS</span>
                <select name="propertyType" defaultValue={query.propertyType ?? ''}>
                    <option value="">Tất cả BĐS</option>
                    <option value="APARTMENT">Căn hộ</option>
                    <option value="HOUSE">Nhà</option>
                    <option value="LAND">Đất nền</option>
                    <option value="VILLA">Biệt thự</option>
                    <option value="ROOM">Phòng trọ</option>
                </select>
            </label>

            <label className="filter-field">
                <span>Tỉnh/thành</span>
                <input name="province" placeholder="VD: Hà Nội" defaultValue={query.province ?? ''} />
            </label>

            <label className="filter-field">
                <span>Quận/huyện</span>
                <input name="district" placeholder="VD: Quận 1" defaultValue={query.district ?? ''} />
            </label>

            <label className="filter-field">
                <span>Giá từ</span>
                <input
                    name="minPrice"
                    type="number"
                    min="0"
                    placeholder="Tối thiểu"
                    defaultValue={query.minPrice ?? ''}
                />
            </label>

            <label className="filter-field">
                <span>Giá đến</span>
                <input
                    name="maxPrice"
                    type="number"
                    min="0"
                    placeholder="Tối đa"
                    defaultValue={query.maxPrice ?? ''}
                />
            </label>

            <label className="filter-field">
                <span>Diện tích từ</span>
                <input
                    name="minArea"
                    type="number"
                    min="0"
                    placeholder="m² tối thiểu"
                    defaultValue={query.minArea ?? ''}
                />
            </label>

            <label className="filter-field">
                <span>Diện tích đến</span>
                <input
                    name="maxArea"
                    type="number"
                    min="0"
                    placeholder="m² tối đa"
                    defaultValue={query.maxArea ?? ''}
                />
            </label>

            <div className="filter-actions filter-actions-wide">
                <Link href="/properties" className="button-secondary">
                    <RefreshCcw size={16} />
                    Xóa bộ lọc
                </Link>
                <button type="submit" className="button-primary">
                    <Filter size={16} />
                    Áp dụng bộ lọc
                </button>
            </div>
        </form>
    );
}
