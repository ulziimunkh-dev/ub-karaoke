process.env.TZ = 'Asia/Ulaanbaatar';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpAdapterHost } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Use Winston for system logging
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Enable CORS
  const frontendUrl = process.env.FRONTEND_URL;
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // 1. Allow if no origin (like mobile apps or curl) 
      if (!origin) {
        callback(null, true);
        return;
      }

      // Cleanup URLs for comparison (remove trailing slashes and prefix)
      const cleanOrigin = origin.replace(/\/$/, '').toLowerCase();
      const cleanFrontendUrl = frontendUrl ? frontendUrl.replace(/\/$/, '').toLowerCase() : null;

      // Log for debugging (This is critical while we still have connection issues)
      console.log(`[CORS DEBUG] Request from Origin: "${origin}"`);
      console.log(`[CORS DEBUG] Configured FRONTEND_URL: "${frontendUrl}"`);

      // 2. Check if it matches the explicit FRONTEND_URL
      if (cleanFrontendUrl && cleanOrigin === cleanFrontendUrl) {
        callback(null, true);
        return;
      }

      // 3. Allow localhost for development
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
        return;
      }

      // 4. Fallback: Allow all in non-production environments if no frontendUrl is set
      if (process.env.NODE_ENV !== 'production' && !frontendUrl) {
        callback(null, true);
        return;
      }

      // LOGGING FOR PERMANENT FAILURE
      console.warn(`[CORS BLOCKED] Reason: Origin "${origin}" does not match FRONTEND_URL "${frontendUrl}"`);

      callback(null, false);
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('UB Karaoke API')
    .setDescription('API for karaoke room booking system')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth')
    .addTag('venues')
    .addTag('rooms')
    .addTag('bookings')
    .addTag('reviews')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}
bootstrap();
// Trigger reload