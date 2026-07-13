import { Property } from '../properties/properties.types';

export interface CreateFavoritePayload {
    propertyId: string;
}

export interface Favorite {
    id: string;
    propertyId: string;
    createdAt: string;
    property: Property;
}

export type FavoriteListItem = Favorite;

export interface FavoriteCheckResponse {
    propertyId: string;
    favorited: boolean;
}

export interface RemoveFavoriteResponse {
    propertyId: string;
    removed: boolean;
}

export interface FavoriteListQuery {
    page?: number;
    limit?: number;
}
