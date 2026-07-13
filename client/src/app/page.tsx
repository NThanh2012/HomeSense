'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import {
    Search,
    MapPin,
    Maximize,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Building,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import { getProperties } from '../features/properties/properties.api';
import { Property, PropertyListQuery } from '../features/properties/properties.types';
import { PaginationMeta } from '../types/api-response.type';
import { getMyRecommendations } from '../features/recommendations/api';
import { DemandPropertyMatch } from '../features/recommendations/types';
import { getStoredToken } from '../features/auth/auth.api';
import {
    formatPrice,
    formatArea,
    transactionTypeLabels,
    propertyTypeLabels,
} from '../lib/format';


const PAGE_SIZE = 15;

/* ── Helpers ──────────────────────────────────────── */

function mapMatchToProperty(match: DemandPropertyMatch): Property & { matchScore: number; matchReasons: string[] } {
    const p = match.property;
    return {
        id: p?.id ?? match.propertyId,
        title: p?.title ?? 'Bất động sản',
        description: null,
        transactionType: p?.transactionType ?? 'UNKNOWN',
        propertyType: p?.propertyType ?? 'UNKNOWN',
        price: p?.price ?? null,
        area: p?.area ?? null,
        bedrooms: null,
        bathrooms: null,
        furnishingStatus: null,
        legalStatus: null,
        direction: null,
        amenities: [],
        latitude: null,
        longitude: null,
        nearbyPlaces: [],
        contactPhone: null,
        status: (p?.status as Property['status']) ?? 'PUBLISHED',
        location: p?.location ? { id: '', ...p.location } : null,
        media: p?.thumbnail ? [{ id: '', propertyId: p.id, url: p.thumbnail, type: 'IMAGE' as const, sortOrder: 0 }] : [],
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
        matchScore: match.matchScore,
        matchReasons: match.matchReasons,
    };
}

/* ── Property Card (Premium) ──────────────────────── */

interface ExplorerCardProps {
    property: Property;
    matchScore?: number;
    matchReasons?: string[];
    index?: number;
}

function ExplorerCard({ property, matchScore, matchReasons, index = 0 }: ExplorerCardProps) {
    const image = property.media.find((m) => m.type === 'IMAGE')?.url;
    const address = property.location?.rawAddress ?? property.location?.district ?? property.location?.province ?? 'Chưa có địa chỉ';

    return (
        <article className="explorer-card card-animate" style={{ '--index': index } as React.CSSProperties}>
            <div className="explorer-card-inner">
                <Link href={`/properties/${property.id}`} className="explorer-card-media">
                    {image ? (
                        <img src={image} alt={property.title} loading="lazy" />
                    ) : (
                        <span className="explorer-card-placeholder">
                            <Building size={32} />
                            Chưa có ảnh
                        </span>
                    )}
                    {matchScore !== undefined && (
                        <span className="explorer-card-score">
                            <Sparkles size={14} />
                            {matchScore}%
                        </span>
                    )}
                </Link>

                <div className="explorer-card-body">
                    <div className="tag-row">
                        <span className="tag">{transactionTypeLabels[property.transactionType]}</span>
                        <span className="tag tag-muted">{propertyTypeLabels[property.propertyType]}</span>
                    </div>

                    <h2 className="explorer-card-title">
                        <Link href={`/properties/${property.id}`}>{property.title}</Link>
                    </h2>

                    <div className="explorer-card-metrics">
                        <strong>{formatPrice(property.price)}</strong>
                        <span>
                            <Maximize size={14} />
                            {formatArea(property.area)}
                        </span>
                    </div>

                    <p className="explorer-card-address">
                        <MapPin size={14} />
                        <span>{address}</span>
                    </p>

                    {matchReasons && matchReasons.length > 0 && (
                        <p className="explorer-card-reason">
                            <Sparkles size={12} />
                            {matchReasons[0]}
                        </p>
                    )}
                </div>
            </div>
        </article>
    );
}

/* ── Pagination ───────────────────────────────────── */

interface PaginationProps {
    meta: PaginationMeta;
    onPageChange: (page: number) => void;
}

function Pagination({ meta, onPageChange }: PaginationProps) {
    if (meta.totalPages <= 1) return null;

    return (
        <nav className="explorer-pagination" aria-label="Phân trang">
            <button
                className="explorer-pagination-btn"
                disabled={meta.page <= 1}
                onClick={() => onPageChange(meta.page - 1)}
            >
                <ChevronLeft size={18} />
                Trang trước
            </button>
            <span className="explorer-pagination-info">
                {meta.page} / {meta.totalPages}
            </span>
            <button
                className="explorer-pagination-btn"
                disabled={meta.page >= meta.totalPages}
                onClick={() => onPageChange(meta.page + 1)}
            >
                Trang sau
                <ChevronRight size={18} />
            </button>
        </nav>
    );
}

/* ── Main Page Content ───────────────────────────── */

function HomeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [token, setToken] = useState<string | null>(null);
    const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '');
    const [searchActive, setSearchActive] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const [properties, setProperties] = useState<(Property & { matchScore?: number; matchReasons?: string[] })[]>([]);
    const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<'recommendations' | 'explore'>('explore');

    // Resolve token on mount
    useEffect(() => {
        const storedToken = getStoredToken();
        setToken(storedToken);
    }, []);

    // Fetch data
    const fetchData = useCallback(async (page: number, search?: string) => {
        setIsLoading(true);
        setError('');

        try {
            const hasSearch = search && search.trim().length > 0;

            if (token && !hasSearch) {
                // Logged in + no search => show recommendations
                const result = await getMyRecommendations(token, {
                    page: page,
                    limit: PAGE_SIZE,
                    status: 'ACTIVE',
                });

                if (result.items.length > 0) {
                    setProperties(result.items.map((m) => mapMatchToProperty(m)));
                    setMeta(result.meta);
                    setMode('recommendations');
                    return;
                }
                // Fallback to general properties if no recommendations
            }

            // Guest, or has search, or no recommendations => explore all
            const query: PropertyListQuery = {
                page: page,
                limit: PAGE_SIZE,
                sortBy: hasSearch ? 'createdAt' : 'title',
                sortOrder: hasSearch ? 'desc' : 'asc',
            };

            if (hasSearch) {
                query.keyword = search!.trim();
            }

            const result = await getProperties(query);
            setProperties(result.items);
            setMeta(result.meta);
            setMode('explore');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu.');
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    // Initial load (wait for token resolution)
    useEffect(() => {
        // token state: null means "not yet resolved" on first render
        // But getStoredToken() returns null if no token. We use a separate flag.
        const timer = setTimeout(() => {
            fetchData(currentPage, searchActive ? keyword : undefined);
        }, 50); // Small delay to let token resolve
        return () => clearTimeout(timer);
    }, [token, currentPage, fetchData, searchActive, keyword]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        setSearchActive(keyword.trim().length > 0);
    };

    const clearSearch = () => {
        setKeyword('');
        setSearchActive(false);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>

            <main className="explorer-main">
                {/* Hero / Search Section */}
                <section className="explorer-hero">
                    <div className="explorer-hero-inner">
                        <div className="explorer-hero-left">
                            <p className="explorer-kicker">
                                Tin thật từ người bán · Duyệt trước khi công khai
                            </p>
                            <h1 className="explorer-hero-title">
                                {token && mode === 'recommendations'
                                    ? <>Một danh sách <span>hợp với bạn.</span></>
                                    : <>Tìm một nơi <span>đáng để gọi là nhà.</span></>}
                            </h1>
                            <p className="explorer-hero-sub">
                                {token && mode === 'recommendations'
                                    ? 'Gợi ý dựa trên nhu cầu bất động sản và những lựa chọn bạn đã thực hiện trong hệ thống.'
                                    : 'Khám phá nhà đất do người bán trực tiếp cung cấp thông tin và được admin kiểm duyệt trước khi hiển thị.'}
                            </p>

                            <form className="explorer-search" onSubmit={handleSearch}>
                                <Search size={20} className="explorer-search-icon" />
                                <input
                                    type="text"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    placeholder="Nhập khu vực, quận huyện hoặc tên đường"
                                    className="explorer-search-input"
                                />
                                {keyword && (
                                    <button
                                        type="button"
                                        className="explorer-search-clear"
                                        onClick={clearSearch}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                                <button type="submit" className="explorer-search-btn">
                                    <Search size={18} />
                                    Tìm kiếm
                                </button>
                            </form>

                            <div className="explorer-quick-links">
                                <Link href="/properties?transactionType=SELL" className="explorer-quick-chip">Nhà đất bán</Link>
                                <Link href="/properties?transactionType=RENT" className="explorer-quick-chip">Cho thuê</Link>
                                <Link href="/properties?propertyType=APARTMENT" className="explorer-quick-chip">Căn hộ</Link>
                                <Link href="/properties?propertyType=LAND" className="explorer-quick-chip">Đất nền</Link>
                                <Link href="/properties" className="explorer-quick-chip">
                                    <SlidersHorizontal size={14} />
                                    Bộ lọc nâng cao
                                </Link>
                            </div>
                        </div>

                        {/* Hero Stats (Right Side) */}
                        <div className="explorer-hero-stats">
                            <div className="hero-stat-block">
                                <span className="hero-stat-value">{!searchActive && meta.total > 0 ? meta.total + '+' : '—'}</span>
                                <span className="hero-stat-label">Tin đã được công khai</span>
                            </div>
                            <div className="hero-stat-block">
                                <span className="hero-stat-value">100%</span>
                                <span className="hero-stat-label">Người bán tự nhập</span>
                            </div>
                            <div className="hero-stat-block">
                                <span className="hero-stat-value">Duyệt</span>
                                <span className="hero-stat-label">Trước khi hiển thị</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Results Section */}
                <section className="explorer-results page-shell">
                    {/* Status bar */}
                    <div className="explorer-status">
                        <div className="explorer-status-left">
                            {mode === 'recommendations' && !searchActive ? (
                                <span className="explorer-mode-badge explorer-mode-badge-rec">
                                    <Sparkles size={14} />
                                    Gợi ý cho bạn
                                </span>
                            ) : (
                                <span className="explorer-mode-badge">
                                    <Building size={14} />
                                    {searchActive ? `Kết quả cho "${keyword}"` : 'Tất cả bất động sản'}
                                </span>
                            )}
                            {!isLoading && (
                                <span className="explorer-status-count">
                                    {meta.total} bất động sản · Trang {meta.page}/{Math.max(meta.totalPages, 1)}
                                </span>
                            )}
                        </div>
                        {searchActive && (
                            <button className="explorer-clear-btn" onClick={clearSearch}>
                                <X size={14} />
                                Xoá tìm kiếm
                            </button>
                        )}
                    </div>

                    {/* Loading: Skeleton Grid instead of spinner */}
                    {isLoading && (
                        <div className="skeleton-grid">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="skeleton-card card-animate" style={{ '--index': i } as React.CSSProperties}>
                                    <div className="skeleton-media skeleton-pulse" />
                                    <div className="skeleton-body">
                                        <div className="skeleton-line skeleton-line-sm skeleton-pulse" />
                                        <div className="skeleton-line skeleton-line-lg skeleton-pulse" />
                                        <div className="skeleton-line skeleton-line-lg skeleton-pulse" style={{ marginTop: 8 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {!isLoading && error && (
                        <div className="state-box state-box-error">
                            <h2>Không thể tải dữ liệu</h2>
                            <p>{error}</p>
                            <button className="button-primary" onClick={() => fetchData(currentPage, searchActive ? keyword : undefined)}>
                                Thử lại
                            </button>
                        </div>
                    )}

                    {/* Empty */}
                    {!isLoading && !error && properties.length === 0 && (
                        <div className="state-box">
                            <Building size={48} color="var(--text-light)" />
                            <h2>Không tìm thấy bất động sản</h2>
                            <p>Thử thay đổi từ khóa tìm kiếm hoặc xem tất cả bất động sản.</p>
                            {searchActive && (
                                <button className="button-secondary" onClick={clearSearch}>
                                    Xem tất cả
                                </button>
                            )}
                        </div>
                    )}

                    {/* Grid */}
                    {!isLoading && !error && properties.length > 0 && (
                        <>
                            <div className="explorer-grid">
                                {properties.map((p, i) => (
                                    <ExplorerCard
                                        key={p.id}
                                        property={p}
                                        matchScore={p.matchScore}
                                        matchReasons={p.matchReasons}
                                        index={i}
                                    />
                                ))}
                            </div>
                            <Pagination meta={meta} onPageChange={handlePageChange} />
                        </>
                    )}
                </section>
            </main>

        </>
    );
}

/* ── Page Export (with Suspense for useSearchParams) ─ */

export default function HomePage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="loading-spinner" />
            </div>
        }>
            <HomeContent />
        </Suspense>
    );
}
