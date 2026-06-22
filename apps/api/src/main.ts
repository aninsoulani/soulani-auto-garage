import { NestFactory, Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';
import { ConfigService } from '@nestjs/config';


import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  });
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  const reflector = app.get(Reflector);
  app.useGlobalFilters(new HttpExceptionFilter(), new PrismaExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger setup (development only, with Basic Auth)
  if (process.env.NODE_ENV !== 'production') {
    const configService = app.get(ConfigService);
    const swaggerUser = configService.get<string>('SWAGGER_USER') || 'soulani_dev';
    const swaggerPass = configService.get<string>('SWAGGER_PASSWORD') || 'secure_swagger_token_2026';

    const config = new DocumentBuilder()
      .setTitle('Auto Garage API')
      .setDescription('API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);

    app.use(
      '/api-docs',
      basicAuth({
        users: { [swaggerUser]: swaggerPass },
        challenge: true,
      }),
    );
    SwaggerModule.setup('api-docs', app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}/api/v1`);
}
bootstrap();
