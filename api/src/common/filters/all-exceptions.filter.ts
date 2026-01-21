import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    constructor(private readonly httpAdapterHost: HttpAdapterHost) { }

    catch(exception: unknown, host: ArgumentsHost): void {
        const { httpAdapter } = this.httpAdapterHost;
        const ctx = host.switchToHttp();

        const httpStatus =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const responseBody = {
            statusCode: httpStatus,
            timestamp: new Date().toISOString(),
            path: httpAdapter.getRequestUrl(ctx.getRequest()),
            message: exception instanceof HttpException ? exception.message : 'Internal server error',
        };

        // Log the full error details for debugging
        this.logger.error({
            message: 'Exception Thrown',
            statusCode: httpStatus,
            path: responseBody.path,
            error: exception instanceof Error ? exception.message : 'Unknown Error',
            stack: exception instanceof Error ? exception.stack : null,
        });

        httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    }
}
