import { AsyncLocalStorage } from 'async_hooks';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface RequestContext {
    ip: string;
    userAgent: string;
    user?: any; // Authenticated user/staff
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
    public static storage = new AsyncLocalStorage<RequestContext>();

    use(req: Request, res: Response, next: NextFunction) {
        const context: RequestContext = {
            ip: (req.ip || req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || '').toString(),
            userAgent: req.headers['user-agent'] || '',
            user: (req as any).user,
        };

        RequestContextMiddleware.storage.run(context, () => next());
    }

    static getContext(): RequestContext | undefined {
        return this.storage.getStore();
    }
}
