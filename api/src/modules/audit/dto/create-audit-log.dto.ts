export class CreateAuditLogDto {
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    userId?: number;
}
