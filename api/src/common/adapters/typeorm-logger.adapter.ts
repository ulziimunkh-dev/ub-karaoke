import { Logger as NestLogger } from '@nestjs/common';
import { Logger as TypeOrmLogger, QueryRunner } from 'typeorm';

export class TypeOrmLoggerAdapter implements TypeOrmLogger {
    private readonly logger = new NestLogger('TypeORM');

    logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
        this.logger.log({
            message: 'Executing Query',
            query,
            parameters,
        });
    }

    logQueryError(error: string | Error, query: string, parameters?: any[], queryRunner?: QueryRunner) {
        this.logger.error({
            message: 'Query Failed',
            query,
            parameters,
            error,
        });
    }

    logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner) {
        this.logger.warn({
            message: 'Slow Query Detected',
            duration: `${time}ms`,
            query,
            parameters,
        });
    }

    logSchemaBuild(message: string, queryRunner?: QueryRunner) {
        this.logger.log({
            message: 'Schema Build',
            detail: message,
        });
    }

    logMigration(message: string, queryRunner?: QueryRunner) {
        this.logger.log({
            message: 'Migration',
            detail: message,
        });
    }

    log(level: 'log' | 'info' | 'warn', message: any, queryRunner?: QueryRunner) {
        if (level === 'log' || level === 'info') {
            this.logger.log(message);
        } else if (level === 'warn') {
            this.logger.warn(message);
        }
    }
}
