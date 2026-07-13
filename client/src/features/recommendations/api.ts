import { get, patch, post } from '../../lib/api-client';
import { PaginatedResponse } from '../../types/api-response.type';
import {
    DemandPropertyMatch,
    DemandMatchListQuery,
    DemandMatchStatus,
    RecommendationFeedbackResult,
    RecommendationFeedbackType,
    RecomputeRecommendationsResult,
    RunMatchingResult,
} from './types';


/** Admin: Chạy matching cho một demand */
export async function runDemandMatching(demandId: string, token: string): Promise<RunMatchingResult> {
    return post<RunMatchingResult>(`/admin/recommendations/user-demands/${demandId}/run`, undefined, {
        headers: { Authorization: `Bearer ${token}` },
    });
}

/** Admin: Lấy danh sách match của một demand */
export async function getAdminDemandMatches(
    demandId: string,
    token: string,
    query?: DemandMatchListQuery,
): Promise<PaginatedResponse<DemandPropertyMatch>> {
    return get<PaginatedResponse<DemandPropertyMatch>>(
        `/admin/recommendations/user-demands/${demandId}/matches`,
        query,
        { headers: { Authorization: `Bearer ${token}` } },
    );
}

/** User: Lấy gợi ý BĐS của chính mình */
export async function getMyRecommendations(
    token: string,
    query?: DemandMatchListQuery,
): Promise<PaginatedResponse<DemandPropertyMatch>> {
    return get<PaginatedResponse<DemandPropertyMatch>>('/recommendations/me', query, {
        headers: { Authorization: `Bearer ${token}` },
    });
}

/** User: gửi feedback cho một gợi ý thuộc chính mình */
export async function createRecommendationFeedback(
    matchId: string,
    feedbackType: RecommendationFeedbackType,
    token: string,
    metadata?: Record<string, unknown>,
): Promise<RecommendationFeedbackResult> {
    return post<RecommendationFeedbackResult>(
        `/recommendations/matches/${encodeURIComponent(matchId)}/feedback`,
        { feedbackType, metadata },
        { headers: { Authorization: `Bearer ${token}` } },
    );
}

/** User: tính lại preference profile và chạy matching cho các demand của chính mình */
export async function recomputeMyRecommendations(
    token: string,
): Promise<RecomputeRecommendationsResult> {
    return post<RecomputeRecommendationsResult>('/recommendations/me/recompute', undefined, {
        headers: { Authorization: `Bearer ${token}` },
    });
}

/** Admin: Cáº­p nháº­t tráº¡ng thÃ¡i match */
export async function updateAdminMatchStatus(
    matchId: string,
    status: DemandMatchStatus,
    token: string,
): Promise<DemandPropertyMatch> {
    return patch<DemandPropertyMatch>(
        `/admin/recommendations/matches/${matchId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
    );
}
