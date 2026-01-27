import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VenuesModule } from './modules/venues/venues.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AuditModule } from './modules/audit/audit.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { StaffModule } from './modules/staff/staff.module';
import { FilesModule } from './modules/files/files.module';
import { PlansModule } from './modules/plans/plans.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import { join } from 'path';
import { TypeOrmLoggerAdapter } from './common/adapters/typeorm-logger.adapter';

const ignoreRouterExplorer = winston.format((info) => {
  if (info.context === 'RouterExplorer') {
    return false;
  }
  return info;
});


@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('UBKaraoke', {
              colors: true,
              prettyPrint: true,
            }),
          ),
        }),
        new winston.transports.DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            ignoreRouterExplorer(),
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, context, ...rest }) => {
              return JSON.stringify({
                timestamp,
                level,
                context,
                message,
                ...rest,
              });
            }),
          ),
        }),
        new winston.transports.DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            ignoreRouterExplorer(),
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, context, ...rest }) => {
              return JSON.stringify({
                timestamp,
                level,
                context,
                message,
                ...rest,
              });
            }),
          ),
        }),
      ],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get('DATABASE_URL');
        const dbOptions = dbUrl ? { url: dbUrl } : {
          host: configService.get('DATABASE_HOST'),
          port: configService.get<number>('DATABASE_PORT'),
          username: configService.get('DATABASE_USER'),
          password: configService.get('DATABASE_PASSWORD'),
          database: configService.get('DATABASE_NAME'),
        };

        return {
          type: 'postgres',
          ...dbOptions,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true, // Enabled for easier development
          logging: true,
          logger: new TypeOrmLoggerAdapter(),
          timezone: '+08:00',
        };
      },
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get('REDIS_URL');
        // If REDIS_URL is provided, use it directly.
        // Otherwise, construct options from individual variables.
        const redisOptions = redisUrl
          ? { url: redisUrl }
          : {
            host: configService.get('REDIS_HOST') || 'localhost',
            port: configService.get<number>('REDIS_PORT') || 6379,
            password: configService.get('REDIS_PASSWORD'),
          };

        return {
          store: await redisStore(redisOptions),
        };
      },
      inject: [ConfigService],
    }),
    VenuesModule,
    RoomsModule,
    BookingsModule,
    ReviewsModule,
    AuthModule,
    UsersModule,
    AuditModule,
    PaymentsModule,
    NotificationsModule,
    OrganizationsModule,
    StaffModule,
    FilesModule,
    PlansModule,
    PromotionsModule,
    AccountsModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
