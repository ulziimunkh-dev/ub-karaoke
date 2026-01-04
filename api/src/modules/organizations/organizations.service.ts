import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Organization } from './entities/organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class OrganizationsService {
    constructor(
        @InjectRepository(Organization)
        private organizationsRepository: Repository<Organization>,
        @Inject(CACHE_MANAGER)
        private cacheManager: Cache,
        private auditService: AuditService,
    ) { }

    async create(createOrganizationDto: CreateOrganizationDto, createdByStaffId: number) {
        // Check if code already exists
        const existing = await this.organizationsRepository.findOne({
            where: { code: createOrganizationDto.code }
        });

        if (existing) {
            throw new ConflictException('Organization code already exists');
        }

        const organization = this.organizationsRepository.create({
            ...createOrganizationDto,
            code: createOrganizationDto.code.toUpperCase(),
            createdBy: createdByStaffId,
        });

        const saved = await this.organizationsRepository.save(organization);

        // Audit log
        await this.auditService.log({
            action: 'ORGANIZATION_CREATED',
            resource: 'Organization',
            resourceId: saved.id.toString(),
            details: { code: saved.code, name: saved.name }
        });

        return saved;
    }

    async findAll(filters?: { includeInactive?: boolean }) {
        const query: any = {
            order: { createdAt: 'DESC' }
        };

        if (!filters?.includeInactive) {
            query.where = { isActive: true };
        }

        return this.organizationsRepository.find(query);
    }

    async findOne(id: number) {
        const organization = await this.organizationsRepository.findOne({
            where: { id },
            relations: ['staff', 'users', 'venues']
        });

        if (!organization) {
            throw new NotFoundException('Organization not found');
        }

        return organization;
    }

    async update(id: number, updateDto: Partial<CreateOrganizationDto>, updatedByStaffId?: number) {
        const organization = await this.findOne(id);

        Object.assign(organization, updateDto);
        if (updatedByStaffId) {
            organization.updatedBy = updatedByStaffId;
        }
        const updated = await this.organizationsRepository.save(organization);

        // Audit log
        await this.auditService.log({
            action: 'ORGANIZATION_UPDATED',
            resource: 'Organization',
            resourceId: id.toString(),
            details: updateDto
        });

        return updated;
    }

    async updateStatus(id: number, isActive: boolean, updatedByStaffId?: number) {
        const organization = await this.findOne(id);
        organization.isActive = isActive;
        if (updatedByStaffId) {
            organization.updatedBy = updatedByStaffId;
        }
        const updated = await this.organizationsRepository.save(organization);

        // Clear venue caches because venues depend on org status
        await this.cacheManager.del('venues:all');
        // If we had specific venue caches, we might need to clear them too
        // For now, clearing 'venues:all' is the primary list for customers

        await this.auditService.log({
            action: 'ORGANIZATION_STATUS_UPDATED',
            resource: 'Organization',
            resourceId: id.toString(),
            details: { status },
            userId: updatedByStaffId
        });

        return updated;
    }

    async deactivate(id: number, updatedByStaffId?: number) {
        return this.updateStatus(id, false, updatedByStaffId);
    }
}
