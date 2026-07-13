'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStoredToken } from '../../features/auth/auth.api';
import {
    addFavorite,
    checkFavorite,
    removeFavorite,
} from '../../features/favorites/favorites.api';
import { trackUserBehavior } from '../../features/user-behaviors/user-behaviors.api';

interface PropertyFavoriteButtonProps {
    propertyId: string;
}

export function PropertyFavoriteButton({ propertyId }: PropertyFavoriteButtonProps) {
    const [token, setToken] = useState<string | null>(null);
    const [favorited, setFavorited] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const storedToken = getStoredToken();
        setToken(storedToken);

        if (!storedToken) {
            setIsLoading(false);
            return;
        }

        checkFavorite(propertyId, storedToken)
            .then((result) => {
                setFavorited(result.favorited);
            })
            .catch((checkError) => {
                setError(
                    checkError instanceof Error
                        ? checkError.message
                        : 'Không thể kiểm tra trạng thái lưu tin.',
                );
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [propertyId]);

    const handleToggle = async () => {
        if (!token) {
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            if (favorited) {
                await removeFavorite(propertyId, token);
                trackUserBehavior({
                    eventType: 'PROPERTY_UNSAVE',
                    propertyId: propertyId,
                });
                setFavorited(false);
                setMessage('Đã bỏ lưu tin.');
            } else {
                await addFavorite({ propertyId: propertyId }, token);
                trackUserBehavior({
                    eventType: 'PROPERTY_SAVE',
                    propertyId: propertyId,
                });
                setFavorited(true);
                setMessage('Đã lưu tin vào danh sách yêu thích.');
            }
        } catch (toggleError) {
            setError(
                toggleError instanceof Error
                    ? toggleError.message
                    : 'Không thể cập nhật trạng thái lưu tin.',
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="interaction-notice">
                <p>Đăng nhập để lưu tin và gửi yêu cầu tư vấn.</p>
                <Link href="/auth/login" className="button-secondary">
                    Đăng nhập
                </Link>
            </div>
        );
    }

    return (
        <div className="interaction-card">
            <div>
                <h3>Danh sách yêu thích</h3>
                <p>{favorited ? 'Tin này đang nằm trong danh sách đã lưu.' : 'Lưu tin để xem lại sau.'}</p>
            </div>

            <button
                type="button"
                className={favorited ? 'button-secondary' : 'button-primary'}
                onClick={handleToggle}
                disabled={isLoading}
            >
                {isLoading ? 'Đang xử lý...' : favorited ? 'Bỏ lưu tin' : 'Lưu tin'}
            </button>

            {message ? <p className="form-success">{message}</p> : null}
            {error ? <p className="form-error">{error}</p> : null}
        </div>
    );
}
