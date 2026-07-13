import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.ts';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.ts';
import { AppValidationPipe } from './common/pipes/validation.pipe.ts';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: true,
        credentials: true,
    });
    app.useGlobalPipes(new AppValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());

    const port = Number(process.env.API_PORT ?? 3001);
    await app.listen(port);
}

void bootstrap();
