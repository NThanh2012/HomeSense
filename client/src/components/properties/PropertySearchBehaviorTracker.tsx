'use client';

import { useEffect } from 'react';
import { trackUserBehavior } from '../../features/user-behaviors/user-behaviors.api';
import { PropertyListQuery } from '../../features/properties/properties.types';

interface PropertySearchBehaviorTrackerProps {
    query: PropertyListQuery;
}

const filterKeys: Array<keyof PropertyListQuery> = [
    'transactionType',
    'propertyType',
    'minPrice',
    'maxPrice',
    'minArea',
    'maxArea',
    'province',
    'district',
    'sortBy',
    'sortOrder',
];

const compactQuery = (query: PropertyListQuery) => {
    return Object.fromEntries(
        Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    );
};

export function PropertySearchBehaviorTracker({ query }: PropertySearchBehaviorTrackerProps) {
    useEffect(() => {
        const compact = compactQuery(query);

        if (query.keyword) {
            trackUserBehavior({
                eventType: 'SEARCH',
                keyword: query.keyword,
                filters: compact,
            });
        }

        if (filterKeys.some((key) => query[key] !== undefined && query[key] !== null && query[key] !== '')) {
            trackUserBehavior({
                eventType: 'FILTER_APPLIED',
                filters: compact,
            });
        }
    }, [JSON.stringify(query)]);

    return null;
}
