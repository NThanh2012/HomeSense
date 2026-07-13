import { IsEnum, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export enum RecommendationFeedbackType {
    VIEWED = 'VIEWED',
    CLICKED = 'CLICKED',
    SAVED = 'SAVED',
    DISMISSED = 'DISMISSED',
    CONTACTED = 'CONTACTED',
}

export class CreateRecommendationFeedbackDto {
    @IsNotEmpty({ message: 'Loại phản hồi không được để trống' })
    @IsEnum(RecommendationFeedbackType, { message: 'Loại phản hồi không hợp lệ' })
    feedbackType: RecommendationFeedbackType;

    @IsOptional()
    @IsObject({ message: 'Metadata phải là object' })
    metadata?: Record<string, unknown>;
}
