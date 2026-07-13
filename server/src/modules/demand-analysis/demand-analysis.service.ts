import { Injectable } from '@nestjs/common';
import { DemandType, Prisma, UserDemandStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service.ts';
import { UserSignalsService } from '../user-signals/user-signals.service.ts';
import { ParsedUserDemand, parseUserDemandText } from './utils/user-demand-parser.util.ts';

@Injectable()
export class DemandAnalysisService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly userSignalsService: UserSignalsService,
    ) {}

    async analyzeUserSignal(signalId: string) {
        const signal = await this.userSignalsService.findDocumentById(signalId);
        const parsed = parseUserDemandText(signal.content);
        const status = this.getDemandStatus(parsed);

        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const existingLink = await tx.userDemandSignal.findUnique({
                    where: {
                        rawUserSignalId: signalId,
                    },
                });

                const demand = existingLink
                    ? await tx.userDemand.update({
                          where: {
                              id: existingLink.userDemandId,
                          },
                          data: this.buildDemandData(signal, parsed, status),
                      })
                    : await tx.userDemand.create({
                          data: this.buildDemandData(signal, parsed, status),
                      });

                if (!existingLink) {
                    await tx.userDemandSignal.create({
                        data: {
                            userDemandId: demand.id,
                            rawUserSignalId: signalId,
                            sourceType: signal.sourceType,
                            sourceName: signal.sourceName,
                            sourceUrl: signal.sourceUrl,
                        },
                    });
                }

                const analysis = await tx.demandAnalysis.upsert({
                    where: {
                        rawUserSignalId: signalId,
                    },
                    update: this.buildAnalysisData(signalId, demand.id, parsed),
                    create: this.buildAnalysisData(signalId, demand.id, parsed),
                });

                return {
                    demand: demand,
                    analysis: analysis,
                };
            });

            if (status === UserDemandStatus.INVALID) {
                await this.userSignalsService.markInvalid(signalId);
            } else {
                await this.userSignalsService.markAnalyzed(signalId);
            }

            return {
                demand: this.toDemandResponse(result.demand),
                analysis: this.toAnalysisResponse(result.analysis),
            };
        } catch (error) {
            await this.userSignalsService.markFailed(signalId);
            throw error;
        }
    }

    private getDemandStatus(parsed: ParsedUserDemand) {
        if (
            parsed.demandType === DemandType.UNKNOWN &&
            parsed.propertyTypes.length < 1 &&
            !parsed.rawLocation &&
            !parsed.minPrice &&
            !parsed.maxPrice
        ) {
            return UserDemandStatus.INVALID;
        }

        return UserDemandStatus.ANALYZED;
    }

    private buildDemandData(signal: any, parsed: ParsedUserDemand, status: UserDemandStatus) {
        return {
            externalUserRef: signal.externalUserRef,
            demandType: parsed.demandType,
            propertyTypes: parsed.propertyTypes,
            minPrice: parsed.minPrice,
            maxPrice: parsed.maxPrice,
            minArea: parsed.minArea,
            maxArea: parsed.maxArea,
            province: parsed.province,
            district: parsed.district,
            ward: parsed.ward,
            rawLocation: parsed.rawLocation,
            keywords: parsed.keywords,
            contactPhone: parsed.phone ?? signal.authorPhone,
            sourceConfidence: parsed.confidence,
            status: status,
        };
    }

    private buildAnalysisData(
        rawUserSignalId: string,
        userDemandId: string,
        parsed: ParsedUserDemand,
    ): Prisma.DemandAnalysisUncheckedCreateInput {
        return {
            rawUserSignalId: rawUserSignalId,
            userDemandId: userDemandId,
            extractedDemandType: parsed.demandType,
            extractedPropertyTypes: parsed.propertyTypes,
            extractedMinPrice: parsed.minPrice,
            extractedMaxPrice: parsed.maxPrice,
            extractedMinArea: parsed.minArea,
            extractedMaxArea: parsed.maxArea,
            extractedRawLocation: parsed.rawLocation,
            extractedProvince: parsed.province,
            extractedDistrict: parsed.district,
            extractedPhone: parsed.phone,
            confidence: parsed.confidence,
            result: parsed as unknown as Prisma.InputJsonValue,
        };
    }

    private toDemandResponse(demand: any) {
        return {
            ...demand,
            minPrice: demand.minPrice === null ? null : Number(demand.minPrice),
            maxPrice: demand.maxPrice === null ? null : Number(demand.maxPrice),
            createdAt: demand.createdAt.toISOString(),
            updatedAt: demand.updatedAt.toISOString(),
        };
    }

    private toAnalysisResponse(analysis: any) {
        return {
            ...analysis,
            extractedMinPrice:
                analysis.extractedMinPrice === null ? null : Number(analysis.extractedMinPrice),
            extractedMaxPrice:
                analysis.extractedMaxPrice === null ? null : Number(analysis.extractedMaxPrice),
            createdAt: analysis.createdAt.toISOString(),
        };
    }
}
