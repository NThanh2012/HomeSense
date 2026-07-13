'use client';

import { useState } from 'react';
import { Zap } from 'lucide-react';
import { runDemandMatching } from '../../../features/recommendations/api';
import { RunMatchingResult } from '../../../features/recommendations/types';
import { getStoredToken } from '../../../features/auth/auth.api';

interface RunMatchButtonProps {
    demandId: string;
    onSuccess?: (result: RunMatchingResult) => void;
}

export function RunMatchButton({ demandId, onSuccess }: RunMatchButtonProps) {
    const [loading, setLoading] = useState(false);
    const [lastResult, setLastResult] = useState<RunMatchingResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleRun = async () => {
        const token = getStoredToken() ?? '';
        setLoading(true);
        setError(null);
        try {
            const result = await runDemandMatching(demandId, token);
            setLastResult(result);
            onSuccess?.(result);
        } catch (err: any) {
            setError(err?.message ?? 'Đã xảy ra lỗi khi chạy ghép nhu cầu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
                className="button-primary"
                onClick={handleRun}
                disabled={loading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start' }}
            >
                <Zap size={16} />
                {loading ? 'Đang chạy...' : 'Chạy Ghép Nhu Cầu'}
            </button>

            {error && (
                <p className="form-error" style={{ margin: 0 }}>{error}</p>
            )}

            {lastResult && !loading && (
                <div style={{
                    padding: '12px 16px',
                    background: 'var(--success-soft)',
                    border: '1px solid #86efac',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px',
                    color: 'var(--success)',
                    fontWeight: 500,
                }}>
                    ✓ Tìm được <strong>{lastResult.matched}</strong> bất động sản phù hợp.
                    Trang đã được cập nhật bên dưới.
                </div>
            )}
        </div>
    );
}
