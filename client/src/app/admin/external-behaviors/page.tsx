'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { AdminRequired } from '../../../components/admin/AdminRequired';
import { ErrorState } from '../../../components/common/ErrorState';
import { Loading } from '../../../components/common/Loading';
import { getAdminDataSources } from '../../../features/admin-data-sources/admin-data-sources.api';
import { AdminDataSource } from '../../../features/admin-data-sources/admin-data-sources.types';
import {
    createExternalUserLink,
    getExternalBehaviors,
    getExternalUserLinks,
    retryExternalBehavior,
    updateExternalUserLinkStatus,
} from '../../../features/admin-learning/admin-learning.api';
import {
    ExternalBehavior,
    ExternalUserLink,
} from '../../../features/admin-learning/admin-learning.types';
import { getAdminUsers } from '../../../features/admin/admin.api';
import { AdminUserSummary } from '../../../features/admin/admin.types';

const PRODUCTION_SOURCE_TYPES = new Set([
    'FACEBOOK',
    'WEBSITE',
    'PARTNER_API',
    'MANUAL_IMPORT',
    'OTHER',
]);

const PRODUCTION_PERMISSION_TYPES = new Set([
    'AUTHORIZED_API',
    'PARTNER_AGREEMENT',
    'USER_SUBMITTED',
]);

const canUseForExternalLearning = (source: AdminDataSource) =>
    (source.sourceType === 'DEV_SYNTHETIC' && source.permissionType === 'DEV_SYNTHETIC') ||
    (
        PRODUCTION_SOURCE_TYPES.has(source.sourceType) &&
        PRODUCTION_PERMISSION_TYPES.has(source.permissionType)
    );

function Content({ token }: { token: string }) {
    const [behaviors, setBehaviors] = useState<ExternalBehavior[]>([]);
    const [links, setLinks] = useState<ExternalUserLink[]>([]);
    const [sources, setSources] = useState<AdminDataSource[]>([]);
    const [users, setUsers] = useState<AdminUserSummary[]>([]);
    const [form, setForm] = useState({
        dataSourceId: '',
        externalUserRef: '',
        userId: '',
    });
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [updatingId, setUpdatingId] = useState('');

    useEffect(() => {
        Promise.all([
            getExternalBehaviors({ status: 'FAILED', limit: 100 }, token),
            getExternalBehaviors({ status: 'REVIEW_REQUIRED', limit: 100 }, token),
            getExternalUserLinks({ limit: 100 }, token),
            getAdminDataSources({ isActive: true, limit: 100 }, token),
            getAdminUsers({ limit: 100 }, token),
        ])
            .then(([failed, review, linkResult, sourceResult, userResult]) => {
                const allowedSources = sourceResult.items.filter(canUseForExternalLearning);
                setBehaviors([...failed.items, ...review.items]);
                setLinks(linkResult.items);
                setSources(allowedSources);
                setUsers(userResult.items);
                setForm((current) => ({
                    ...current,
                    dataSourceId: current.dataSourceId || allowedSources[0]?.id || '',
                    userId: current.userId || userResult.items[0]?.id || '',
                }));
            })
            .catch((loadError) => {
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : 'Không thể tải dữ liệu hành vi bên ngoài.',
                );
            })
            .finally(() => setLoading(false));
    }, [token]);

    const sourceById = useMemo(
        () => new Map(sources.map((source) => [source.id, source])),
        [sources],
    );

    const handleCreateLink = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setActionError('');
        setSubmitting(true);

        try {
            const created = await createExternalUserLink(
                {
                    dataSourceId: form.dataSourceId,
                    externalUserRef: form.externalUserRef.trim(),
                    userId: form.userId,
                },
                token,
            );
            setLinks((current) => [
                created,
                ...current.filter((item) => item.id !== created.id),
            ]);
            setForm((current) => ({ ...current, externalUserRef: '' }));
        } catch (submitError) {
            setActionError(
                submitError instanceof Error
                    ? submitError.message
                    : 'Không thể tạo liên kết tài khoản.',
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleLink = async (link: ExternalUserLink) => {
        setActionError('');
        setUpdatingId(link.id);

        try {
            const updated = await updateExternalUserLinkStatus(
                link.id,
                !link.isActive,
                token,
            );
            setLinks((current) =>
                current.map((item) => item.id === updated.id ? updated : item),
            );
        } catch (updateError) {
            setActionError(
                updateError instanceof Error
                    ? updateError.message
                    : 'Không thể cập nhật liên kết tài khoản.',
            );
        } finally {
            setUpdatingId('');
        }
    };

    const handleRetry = async (item: ExternalBehavior) => {
        setActionError('');
        setUpdatingId(item.id);

        try {
            await retryExternalBehavior(item.id, token);
            setBehaviors((current) => current.filter((value) => value.id !== item.id));
        } catch (retryError) {
            setActionError(
                retryError instanceof Error
                    ? retryError.message
                    : 'Không thể đưa dữ liệu vào hàng đợi phân tích lại.',
            );
        } finally {
            setUpdatingId('');
        }
    };

    if (loading) {
        return <Loading label="Đang tải dữ liệu hành vi bên ngoài..." />;
    }

    if (error) {
        return (
            <ErrorState
                title="Không thể tải dữ liệu hành vi bên ngoài"
                message={error}
            />
        );
    }

    return (
        <div className="admin-page">
            <AdminHeader
                title="Hành vi bên ngoài"
                description="Liên kết định danh từ nguồn được cấp quyền với tài khoản để phân tích nhu cầu và cá nhân hóa gợi ý."
            />

            <section className="admin-detail-section">
                <h2>Liên kết với tài khoản HomeSense</h2>
                <p className="note">
                    Chỉ dùng dữ liệu có quyền sử dụng rõ ràng. Dữ liệu bên ngoài được lưu thô
                    trong MongoDB và chỉ tạo nhu cầu, sở thích, gợi ý; không bao giờ tạo tin bất động sản.
                </p>
                <form className="admin-form-grid" onSubmit={handleCreateLink}>
                    <label>
                        <span>Nguồn dữ liệu</span>
                        <select
                            required
                            value={form.dataSourceId}
                            onChange={(event) => setForm((current) => ({
                                ...current,
                                dataSourceId: event.target.value,
                            }))}
                        >
                            <option value="">Chọn nguồn hợp lệ</option>
                            {sources.map((source) => (
                                <option key={source.id} value={source.id}>
                                    {source.name} · {source.sourceType}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <span>Tài khoản nội bộ</span>
                        <select
                            required
                            value={form.userId}
                            onChange={(event) => setForm((current) => ({
                                ...current,
                                userId: event.target.value,
                            }))}
                        >
                            <option value="">Chọn tài khoản</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.fullName || user.email} · {user.email}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="admin-form-wide">
                        <span>Mã người dùng tại nguồn ngoài</span>
                        <input
                            required
                            minLength={2}
                            maxLength={255}
                            placeholder="Ví dụ: facebook-user-123"
                            value={form.externalUserRef}
                            onChange={(event) => setForm((current) => ({
                                ...current,
                                externalUserRef: event.target.value,
                            }))}
                        />
                    </label>
                    {sources.length === 0 ? (
                        <p className="form-error admin-form-wide">
                            Chưa có nguồn đang hoạt động với quyền AUTHORIZED_API,
                            PARTNER_AGREEMENT, USER_SUBMITTED hoặc DEV_SYNTHETIC phù hợp.
                        </p>
                    ) : null}
                    {actionError ? (
                        <p className="form-error admin-form-wide">{actionError}</p>
                    ) : null}
                    <div className="admin-form-actions">
                        <button
                            type="submit"
                            className="button-primary"
                            disabled={submitting || sources.length === 0 || users.length === 0}
                        >
                            {submitting ? 'Đang liên kết...' : 'Tạo liên kết'}
                        </button>
                    </div>
                </form>
            </section>

            <section className="admin-detail-section">
                <h2>Liên kết hiện có</h2>
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Nguồn</th>
                                <th>Định danh ngoài</th>
                                <th>Tài khoản</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {links.map((link) => (
                                <tr key={link.id}>
                                    <td>
                                        {link.dataSource.name}
                                        <span>
                                            {link.dataSource.sourceType} · {link.dataSource.permissionType}
                                        </span>
                                    </td>
                                    <td>{link.externalUserRef}</td>
                                    <td>
                                        {link.user.fullName || link.user.email}
                                        <span>{link.user.email}</span>
                                    </td>
                                    <td>{link.isActive ? 'Đang hoạt động' : 'Đã tắt'}</td>
                                    <td>
                                        <button
                                            className="button-secondary"
                                            disabled={updatingId === link.id}
                                            onClick={() => handleToggleLink(link)}
                                        >
                                            {link.isActive ? 'Tắt liên kết' : 'Kích hoạt'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {links.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>Chưa có liên kết tài khoản ngoài.</td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="admin-detail-section">
                <h2>Dữ liệu cần xử lý lại</h2>
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Người dùng ngoài</th>
                                <th>Nguồn</th>
                                <th>Trạng thái</th>
                                <th>Lỗi phân tích</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {behaviors.map((item) => {
                                const source = sourceById.get(item.dataSourceId);
                                return (
                                    <tr key={item.id}>
                                        <td>{item.externalUserRef}</td>
                                        <td>{source?.name ?? item.dataSourceId}</td>
                                        <td>{item.status}</td>
                                        <td>{item.analysisError ?? '-'}</td>
                                        <td>
                                            <button
                                                className="button-secondary"
                                                disabled={updatingId === item.id}
                                                onClick={() => handleRetry(item)}
                                            >
                                                Phân tích lại
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {behaviors.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>Không có dữ liệu lỗi hoặc cần admin xem xét.</td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

export default function Page() {
    return <AdminRequired>{({ token }) => <Content token={token} />}</AdminRequired>;
}
