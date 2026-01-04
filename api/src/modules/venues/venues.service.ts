import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Venue } from './entities/venue.entity';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';

import { AuditService } from '../audit/audit.service';

@Injectable()
export class VenuesService {
    constructor(
        @InjectRepository(Venue)
        private venuesRepository: Repository<Venue>,
        @Inject(CACHE_MANAGER)
        private cacheManager: Cache,
        private auditService: AuditService,
    ) { }

    async create(createVenueDto: CreateVenueDto, creatorId?: number): Promise<Venue> {
        const venue = this.venuesRepository.create({
            ...createVenueDto,
            createdBy: creatorId,
        });
        const saved = await this.venuesRepository.save(venue);
        await this.cacheManager.del('venues:all');

        await this.auditService.log({
            action: 'VENUE_CREATED',
            resource: 'Venue',
            resourceId: saved.id.toString(),
            details: { name: saved.name },
            userId: creatorId
        });

        return saved;
    }

    async findAll(filters?: {
        district?: string;
        priceRange?: string;
        search?: string;
        organizationId?: number;
        includeInactive?: boolean;
    }): Promise<Venue[]> {
        const query = this.venuesRepository.createQueryBuilder('venue')
            .leftJoinAndSelect('venue.organization', 'organization')
            .leftJoinAndSelect('venue.rooms', 'room')
            .leftJoinAndSelect('venue.reviews', 'review');

        if (filters?.district) {
            query.andWhere('venue.district = :district', {
                district: filters.district,
            });
        }

        if (filters?.priceRange) {
            query.andWhere('venue.priceRange = :priceRange', {
                priceRange: filters.priceRange,
            });
        }

        if (filters?.search) {
            query.andWhere(
                '(venue.name LIKE :search OR venue.description LIKE :search)',
                { search: `%${filters.search}%` },
            );
        }

        if (filters?.organizationId) {
            query.andWhere('venue.organization_id = :organizationId', {
                organizationId: filters.organizationId,
            });
        }

        if (!filters?.includeInactive) {
            query.andWhere('venue.is_active = :active', { active: true });
            query.andWhere('organization.is_active = :active', { active: true });
        }

        const venues = await query.getMany();
        return venues;
    }

    async findOne(id: number): Promise<Venue> {
        const cacheKey = `venue:${id}`;
        const cached = await this.cacheManager.get<Venue>(cacheKey);

        if (cached) {
            return cached;
        }

        const venue = await this.venuesRepository.findOne({
            where: { id },
            relations: ['rooms', 'reviews'],
        });

        if (!venue) {
            throw new NotFoundException(`Venue with ID ${id} not found`);
        }

        await this.cacheManager.set(cacheKey, venue, 300000);
        return venue;
    }

    async update(id: number, updateVenueDto: UpdateVenueDto, updaterId?: number): Promise<Venue> {
        const venue = await this.findOne(id);
        Object.assign(venue, updateVenueDto);
        if (updaterId) {
            venue.updatedBy = updaterId;
        }
        const updated = await this.venuesRepository.save(venue);
        await this.cacheManager.del(`venue:${id}`);
        await this.cacheManager.del('venues:all');

        await this.auditService.log({
            action: 'VENUE_UPDATED',
            resource: 'Venue',
            resourceId: id.toString(),
            details: updateVenueDto,
            userId: updaterId
        });

        return updated;
    }

    async updateStatus(id: number, isActive: boolean, updaterId?: number): Promise<Venue> {
        const venue = await this.findOne(id);
        venue.isActive = isActive;
        if (updaterId) {
            venue.updatedBy = updaterId;
        }
        const updated = await this.venuesRepository.save(venue);
        await this.cacheManager.del(`venue:${id}`);
        await this.cacheManager.del('venues:all');

        await this.auditService.log({
            action: 'VENUE_STATUS_UPDATED',
            resource: 'Venue',
            resourceId: id.toString(),
            details: { isActive },
            userId: updaterId
        });

        return updated;
    }

    async remove(id: number): Promise<void> {
        const venue = await this.findOne(id);
        await this.venuesRepository.remove(venue);
        await this.cacheManager.del(`venue:${id}`);
        await this.cacheManager.del('venues:all');

        await this.auditService.log({
            action: 'VENUE_DELETED',
            resource: 'Venue',
            resourceId: id.toString(),
            details: { name: venue.name }
        });
    }
}
