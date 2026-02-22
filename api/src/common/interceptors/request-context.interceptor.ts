import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestContextMiddleware } from '../middleware/request-context.middleware';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const store = RequestContextMiddleware.getContext();

        if (store && request.user) {
            // Update the existing context with the user found by the guard
            store.user = request.user;
        }

        return next.handle();
    }
}
