'use client';

import { useEffect, useState } from 'react';
import { ApiClientError } from '../../lib/api-client';
import { clearStoredToken, getMe, getStoredToken } from './auth.api';
import { AuthUser } from './auth.types';

interface CurrentUserState {
    user: AuthUser | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
}

export function useCurrentUser(): CurrentUserState {
    const [state, setState] = useState<CurrentUserState>({
        user: null,
        token: null,
        isLoading: true,
        error: null,
    });

    useEffect(() => {
        const token = getStoredToken();

        if (!token) {
            setState({
                user: null,
                token: null,
                isLoading: false,
                error: null,
            });
            return;
        }

        getMe(token)
            .then((user) => {
                setState({
                    user: user,
                    token: token,
                    isLoading: false,
                    error: null,
                });
            })
            .catch((err) => {
                const isInvalidToken =
                    err instanceof ApiClientError && err.code === '1002';

                if (isInvalidToken) {
                    clearStoredToken();
                }

                setState({
                    user: null,
                    token: null,
                    isLoading: false,
                    error: isInvalidToken
                        ? 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
                        : err instanceof Error
                          ? err.message
                          : 'Không thể lấy thông tin người dùng.',
                });
            });
    }, []);

    return state;
}
