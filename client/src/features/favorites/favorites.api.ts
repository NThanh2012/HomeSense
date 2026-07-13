import { del, get, post } from '../../lib/api-client';
import { PaginatedResponse } from '../../types/api-response.type';
import {
    CreateFavoritePayload,
    FavoriteCheckResponse,
    FavoriteListItem,
    FavoriteListQuery,
    RemoveFavoriteResponse,
} from './favorites.types';

const buildAuthOptions = (token: string): RequestInit => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

export const addFavorite = (payload: CreateFavoritePayload, token: string) => {
    return post<FavoriteListItem, CreateFavoritePayload>(
        '/favorites',
        payload,
        buildAuthOptions(token),
    );
};

export const getFavorites = (params: FavoriteListQuery, token: string) => {
    return get<PaginatedResponse<FavoriteListItem>>(
        '/favorites',
        params,
        buildAuthOptions(token),
    );
};

export const removeFavorite = (propertyId: string, token: string) => {
    return del<RemoveFavoriteResponse>(
        `/favorites/${encodeURIComponent(propertyId)}`,
        buildAuthOptions(token),
    );
};

export const checkFavorite = (propertyId: string, token: string) => {
    return get<FavoriteCheckResponse>(
        `/favorites/check/${encodeURIComponent(propertyId)}`,
        undefined,
        buildAuthOptions(token),
    );
};

export const favoritesApi = {
    addFavorite,
    getFavorites,
    removeFavorite,
    checkFavorite,
};
