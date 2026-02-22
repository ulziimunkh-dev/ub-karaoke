export class CreateAuditLogDto {
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    actorId?: string;
    actorType?: string;
    actorName?: string;
    organizationId?: string;
    ipAddress?: string;
    userAgent?: string;
}
