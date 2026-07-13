import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma/prisma.module.ts';
import { RawPostsModule } from '../raw-posts/raw-posts.module.ts';
import { PropertyAnalysisController } from './property-analysis.controller.ts';
import { PropertyAnalysisService } from './property-analysis.service.ts';
import { PropertyTextAnalysisService } from './property-text-analysis.service.ts';

@Module({
    imports: [PrismaModule, RawPostsModule],
    controllers: [PropertyAnalysisController],
    providers: [PropertyAnalysisService, PropertyTextAnalysisService],
    exports: [PropertyAnalysisService],
})
export class PropertyAnalysisModule {}
