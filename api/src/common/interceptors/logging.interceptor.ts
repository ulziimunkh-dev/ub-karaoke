import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    const userAgent = req.get('user-agent') || '';
    const ip = req.ip || req.get('x-forwarded-for') || '';

    return next.handle().pipe(
      tap({
        next: (val) => {
          const res = context.switchToHttp().getResponse();
          const delay = Date.now() - now;
          this.logger.log({
            message: `Incoming Request`,
            method,
            url,
            status: res.statusCode,
            duration: `${delay}ms`,
            userAgent,
            ip,
          });
        },
        error: (err) => {
          const delay = Date.now() - now;
          // Error logging is handled by the exception filter, but we log the basic request failure here too contextually
          this.logger.error({
            message: `Request Failed`,
            method,
            url,
            duration: `${delay}ms`,
            userAgent,
            error: err.message,
          });
        },
      }),
    );
  }
}
