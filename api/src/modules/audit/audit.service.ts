import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { Staff } from '../staff/entities/staff.entity';
import { User } from '../auth/entities/user.entity';
import { RequestContextMiddleware } from '../../common/middleware/request-context.middleware';

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(AuditLog)
        private auditRepository: Repository<AuditLog>,
    ) { }

    async log(createAuditLogDto: CreateAuditLogDto, manager?: any): Promise<AuditLog> {
        const repo = manager ? manager.getRepository(AuditLog) : this.auditRepository;
        const context = RequestContextMiddleware.getContext();

        // 1. Automatic IP and User Agent capture
        if (context) {
            createAuditLogDto.ipAddress = createAuditLogDto.ipAddress || context.ip;
            createAuditLogDto.userAgent = createAuditLogDto.userAgent || context.userAgent;

            // If actor info is missing, try to get from context user
            if (!createAuditLogDto.actorId && context.user) {
                createAuditLogDto.actorId = context.user.id || context.user.sub;
                createAuditLogDto.actorType = context.user.organizationId ? 'STAFF' : 'USER';
                createAuditLogDto.actorName = context.user.username || context.user.fullName || context.user.name;
            }
        }

        // 2. System action default
        if (!createAuditLogDto.actorId) {
            createAuditLogDto.actorType = 'SYSTEM';
            createAuditLogDto.actorName = 'System';
        }

        const auditLog = repo.create(createAuditLogDto);
        return repo.save(auditLog);
    }

    async findAll(organizationId?: string, action?: string, actorId?: string): Promise<AuditLog[]> {
        const where: any = {};
        if (organizationId) {
            where.organizationId = organizationId;
        }
        if (action) {
            where.action = action;
        }
        if (actorId) {
            where.actorId = actorId;
        }

        return this.auditRepository.find({
            where,
            order: { createdAt: 'DESC' },
            relations: ['organization'],
        });
    }

    async findByResource(resource: string, resourceId: string): Promise<AuditLog[]> {
        return this.auditRepository.find({
            where: { resource, resourceId },
            order: { createdAt: 'DESC' },
        });
    }

    async findByActor(actorId: string): Promise<AuditLog[]> {
        return this.auditRepository.find({
            where: { actorId },
            order: { createdAt: 'DESC' },
        });
    }
}
