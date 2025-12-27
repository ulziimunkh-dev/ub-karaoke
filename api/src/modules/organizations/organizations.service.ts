import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class OrganizationsService {
    constructor(
        @InjectRepository(Organization)
        private organizationsRepository: Repository<Organization>,
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

    async findAll() {
        return this.organizationsRepository.find({
            order: { createdAt: 'DESC' }
        });
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

    async update(id: number, updateDto: Partial<CreateOrganizationDto>) {
        const organization = await this.findOne(id);

        Object.assign(organization, updateDto);
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

    async deactivate(id: number) {
        const organization = await this.findOne(id);
        organization.isActive = false;
        return this.organizationsRepository.save(organization);
    }
}
