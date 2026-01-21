import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(AuditLog)
        private auditRepository: Repository<AuditLog>,
    ) { }

    async log(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
        const auditLog = this.auditRepository.create(createAuditLogDto);
        return this.auditRepository.save(auditLog);
    }

    async findAll(): Promise<AuditLog[]> {
        return this.auditRepository.find({
            order: { createdAt: 'DESC' },
            relations: ['user'],
        });
    }

    async findByResource(resource: string, resourceId: string): Promise<AuditLog[]> {
        return this.auditRepository.find({
            where: { resource, resourceId },
            order: { createdAt: 'DESC' },
            relations: ['user'],
        });
    }

    async findByUser(userId: string): Promise<AuditLog[]> {
        return this.auditRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }
}
