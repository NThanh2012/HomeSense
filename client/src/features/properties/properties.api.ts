import { get, patch, post } from '../../lib/api-client';
import { PaginatedResponse } from '../../types/api-response.type';
import {
    CreatePropertyPayload,
    MyPropertyListQuery,
    Property,
    PropertyListQuery,
    UpdateMyPropertyPayload,
} from './properties.types';

type PropertyApiOptions = RequestInit;

const buildAuthOptions = (token: string): RequestInit => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

export const propertiesApi = {
    getProperties: (params?: PropertyListQuery, options?: PropertyApiOptions) =>
        get<PaginatedResponse<Property>>('/properties', params, options),
    getPropertyById: (id: string, options?: PropertyApiOptions) =>
        get<Property>(`/properties/${encodeURIComponent(id)}`, undefined, options),
    getMyProperties: (params: MyPropertyListQuery, token: string) =>
        get<PaginatedResponse<Property>>('/properties/me', params, buildAuthOptions(token)),
    getMyPropertyById: (id: string, token: string) =>
        get<Property>(`/properties/me/${encodeURIComponent(id)}`, undefined, buildAuthOptions(token)),
    createMyProperty: (payload: CreatePropertyPayload, token: string) =>
        post<Property, CreatePropertyPayload>('/properties/me', payload, buildAuthOptions(token)),
    updateMyProperty: (id: string, payload: UpdateMyPropertyPayload, token: string) =>
        patch<Property, UpdateMyPropertyPayload>(
            `/properties/me/${encodeURIComponent(id)}`,
            payload,
            buildAuthOptions(token),
        ),
    submitMyProperty: (id: string, token: string) =>
        patch<Property>(`/properties/me/${encodeURIComponent(id)}/submit`, undefined, buildAuthOptions(token)),
};

export const getProperties = propertiesApi.getProperties;

export const getPropertyById = propertiesApi.getPropertyById;

export const getMyProperties = propertiesApi.getMyProperties;

export const getMyPropertyById = propertiesApi.getMyPropertyById;

export const createMyProperty = propertiesApi.createMyProperty;

export const updateMyProperty = propertiesApi.updateMyProperty;

export const submitMyProperty = propertiesApi.submitMyProperty;
