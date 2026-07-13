import { ArrowDownUp } from 'lucide-react';
import { PropertyListQuery } from '../../features/properties/properties.types';

interface PropertySortProps {
    query: PropertyListQuery;
}

const hiddenFilterKeys: Array<keyof PropertyListQuery> = [
    'keyword',
    'transactionType',
    'propertyType',
    'minPrice',
    'maxPrice',
    'minArea',
    'maxArea',
    'province',
    'district',
    'limit',
];

export function PropertySort({ query }: PropertySortProps) {
    return (
        <form action="/properties" method="get" className="property-sort-panel">
            <input type="hidden" name="page" value="1" />
            {hiddenFilterKeys.map((key) => {
                const value = query[key];

                if (value === undefined || value === null || value === '') {
                    return null;
                }

                return <input key={key} type="hidden" name={key} value={String(value)} />;
            })}

            <div className="property-sort-title">
                <ArrowDownUp size={18} />
                <span>Sắp xếp kết quả</span>
            </div>

            <label>
                <span>Trường</span>
                <select name="sortBy" defaultValue={query.sortBy ?? 'createdAt'}>
                    <option value="createdAt">Ngày tạo</option>
                    <option value="price">Giá</option>
                    <option value="area">Diện tích</option>
                    <option value="title">Tên A-Z</option>
                </select>
            </label>

            <label>
                <span>Thứ tự</span>
                <select name="sortOrder" defaultValue={query.sortOrder ?? 'desc'}>
                    <option value="desc">Giảm dần</option>
                    <option value="asc">Tăng dần</option>
                </select>
            </label>

            <button type="submit" className="button-secondary">
                Áp dụng sắp xếp
            </button>
        </form>
    );
}
