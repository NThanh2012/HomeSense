import { Injectable, Optional } from '@nestjs/common';
import {
    LearningJobPriority,
    LearningJobStatus,
    LearningJobType,
    MediaType,
    Prisma,
    RealEstateIntentStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service.ts';
import { RawPostsService } from '../raw-posts/raw-posts.service.ts';
import { parsePropertyText } from '../../shared/utils/property-text-parser.util.ts';
import { PropertyTextAnalysisService } from './property-text-analysis.service.ts';

@Injectable()
export class PropertyAnalysisService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly rawPostsService: RawPostsService,
        @Optional() private readonly propertyTextAnalysisService?: PropertyTextAnalysisService,
    ) {}

    async analyzeRawPost(rawPostId: string) {
        const rawPost = await this.rawPostsService.findDocumentById(rawPostId);
        const textAnalysis = this.propertyTextAnalysisService
            ? await this.propertyTextAnalysisService.analyze(rawPost.content)
            : {
                  parsed: parsePropertyText(rawPost.content),
                  provider: 'RULE_BASED',
                  model: null,
                  parserVersion: 'rule-v2-rich-property',
              };
        const parsed = textAnalysis.parsed;

        const result = await this.prisma.$transaction(async (tx) => {
            const existingProperty = await tx.property.findUnique({
                where: {
                    rawPostId: rawPostId,
                },
            });

            const locationId = await this.syncLocation(
                tx,
                parsed.rawAddress,
                existingProperty?.locationId,
            );

            const property = await tx.property.upsert({
                where: {
                    rawPostId: rawPostId,
                },
                update: {
                    title: parsed.title,
                    description: rawPost.content,
                    transactionType: parsed.transactionType,
                    propertyType: parsed.propertyType,
                    price: parsed.price,
                    area: parsed.area,
                    bedrooms: parsed.bedrooms,
                    bathrooms: parsed.bathrooms,
                    furnishingStatus: parsed.furnishingStatus,
                    legalStatus: parsed.legalStatus,
                    direction: parsed.direction,
                    amenities: parsed.amenities,
                    contactPhone: parsed.phone ?? rawPost.authorPhone,
                    sourceName: rawPost.sourceName,
                    sourceUrl: rawPost.sourceUrl,
                    locationId: locationId,
                },
                create: {
                    rawPostId: rawPostId,
                    title: parsed.title,
                    description: rawPost.content,
                    transactionType: parsed.transactionType,
                    propertyType: parsed.propertyType,
                    price: parsed.price,
                    area: parsed.area,
                    bedrooms: parsed.bedrooms,
                    bathrooms: parsed.bathrooms,
                    furnishingStatus: parsed.furnishingStatus,
                    legalStatus: parsed.legalStatus,
                    direction: parsed.direction,
                    amenities: parsed.amenities,
                    contactPhone: parsed.phone ?? rawPost.authorPhone,
                    sourceName: rawPost.sourceName,
                    sourceUrl: rawPost.sourceUrl,
                    locationId: locationId,
                },
            });

            await this.replaceMedia(tx, property.id, rawPost.mediaUrls ?? []);
            const analysis = await this.upsertAnalysis(tx, rawPostId, property.id, parsed, textAnalysis);

            return {
                property: property,
                analysis: analysis,
            };
        });

        await this.rawPostsService.markAnalyzed(rawPostId);
        await this.queueAffectedUsers();

        return {
            property: {
                ...result.property,
                price: result.property.price === null ? null : Number(result.property.price),
                createdAt: result.property.createdAt.toISOString(),
                updatedAt: result.property.updatedAt.toISOString(),
            },
            analysis: {
                ...result.analysis,
                extractedPrice:
                    result.analysis.extractedPrice === null
                        ? null
                        : Number(result.analysis.extractedPrice),
                createdAt: result.analysis.createdAt.toISOString(),
            },
        };
    }

    private async syncLocation(
        tx: Prisma.TransactionClient,
        rawAddress: string | null,
        existingLocationId?: string | null,
    ): Promise<string | null> {
        if (!rawAddress) {
            return existingLocationId ?? null;
        }

        if (existingLocationId) {
            await tx.location.update({
                where: {
                    id: existingLocationId,
                },
                data: {
                    rawAddress: rawAddress,
                },
            });

            return existingLocationId;
        }

        const location = await tx.location.create({
            data: {
                rawAddress: rawAddress,
            },
        });

        return location.id;
    }

    private async replaceMedia(
        tx: Prisma.TransactionClient,
        propertyId: string,
        mediaUrls: string[],
    ) {
        await tx.propertyMedia.deleteMany({
            where: {
                propertyId: propertyId,
            },
        });

        if (mediaUrls.length < 1) {
            return;
        }

        await tx.propertyMedia.createMany({
            data: mediaUrls.map((url, index) => ({
                propertyId: propertyId,
                url: url,
                type: MediaType.IMAGE,
                sortOrder: index,
            })),
        });
    }

    private async upsertAnalysis(
        tx: Prisma.TransactionClient,
        rawPostId: string,
        propertyId: string,
        parsed: ReturnType<typeof parsePropertyText>,
        metadata: { provider: string; model: string | null; parserVersion: string },
    ) {
        const data = {
            propertyId: propertyId,
            extractedTitle: parsed.title,
            extractedAddress: parsed.rawAddress,
            extractedPrice: parsed.price,
            extractedArea: parsed.area,
            extractedPhone: parsed.phone,
            extractedTransactionType: parsed.transactionType,
            extractedPropertyType: parsed.propertyType,
            extractedBedrooms: parsed.bedrooms,
            extractedBathrooms: parsed.bathrooms,
            extractedFurnishingStatus: parsed.furnishingStatus,
            extractedLegalStatus: parsed.legalStatus,
            extractedDirection: parsed.direction,
            extractedAmenities: parsed.amenities,
            parserVersion: metadata.parserVersion,
            provider: metadata.provider,
            model: metadata.model,
            confidence: parsed.confidence,
            result: parsed as unknown as Prisma.InputJsonValue,
        };

        const existingAnalysis = await tx.propertyAnalysis.findFirst({
            where: {
                rawPostId: rawPostId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (existingAnalysis) {
            return tx.propertyAnalysis.update({
                where: {
                    id: existingAnalysis.id,
                },
                data: data,
            });
        }

        return tx.propertyAnalysis.create({
            data: {
                rawPostId: rawPostId,
                ...data,
            },
        });
    }

    private async queueAffectedUsers() {
        if (!this.prisma.userRealEstateIntent?.findMany || !this.prisma.learningJob?.upsert) return;
        const intents = await this.prisma.userRealEstateIntent.findMany({
            where: { status: RealEstateIntentStatus.ACTIVE },
            select: { userId: true },
            distinct: ['userId'],
        });
        for (const intent of intents) {
            const activeKey = `${LearningJobType.RECOMMENDATION_RECOMPUTE}:${intent.userId}`;
            const existing = await this.prisma.learningJob.findUnique({ where: { activeKey } });
            if (existing?.status === LearningJobStatus.PROCESSING) {
                await this.prisma.learningJob.update({
                    where: { id: existing.id },
                    data: {
                        payload: { rerunRequested: true, reason: 'property_changed' },
                    },
                });
                continue;
            }
            await this.prisma.learningJob.upsert({
                where: { activeKey },
                create: {
                    userId: intent.userId,
                    type: LearningJobType.RECOMMENDATION_RECOMPUTE,
                    status: LearningJobStatus.PENDING,
                    priority: LearningJobPriority.NORMAL,
                    activeKey,
                },
                update: {
                    status: LearningJobStatus.PENDING,
                    priority: LearningJobPriority.NORMAL,
                    availableAt: new Date(),
                    finishedAt: null,
                },
            });
        }
    }
}
