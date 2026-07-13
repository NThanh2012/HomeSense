'use client';

import { useEffect } from 'react';
import { trackUserBehavior } from '../../features/user-behaviors/user-behaviors.api';

interface PropertyViewTrackerProps {
    propertyId: string;
}

export function PropertyViewTracker({ propertyId }: PropertyViewTrackerProps) {
    useEffect(() => {
        trackUserBehavior({
            eventType: 'PROPERTY_VIEW',
            propertyId: propertyId,
        });
    }, [propertyId]);

    return null;
}
