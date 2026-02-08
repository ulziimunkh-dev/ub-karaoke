import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Venue } from './entities/venue.entity';
import { VenueOperatingHours } from './entities/venue-operating-hours.entity';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';

import { AuditService } from '../audit/audit.service';

@Injectable()
export class VenuesService {
    constructor(
        @InjectRepository(Venue)
        private venuesRepository: Repository<Venue>,
        @InjectRepository(VenueOperatingHours)
        private hoursRepository: Repository<VenueOperatingHours>,
        @Inject(CACHE_MANAGER)
        private cacheManager: Cache,
        private auditService: AuditService,
    ) { }

    async create(createVenueDto: CreateVenueDto, creatorId?: string): Promise<Venue> {
        const venue = this.venuesRepository.create({
            ...createVenueDto,
            createdBy: creatorId,
        });
        const saved = await this.venuesRepository.save(venue);
        await this.cacheManager.del('venues:all');

        await this.auditService.log({
            action: 'VENUE_CREATED',
            resource: 'Venue',
            resourceId: saved.id,
            details: { name: saved.name },
            staffId: creatorId
        });

        if (createVenueDto.openingHours) {
            await this.syncOperatingHours(saved.id, createVenueDto.openingHours);
        }

        return this.findOne(saved.id);
    }

    async findAll(filters?: {
        district?: string;
        priceRange?: string;
        search?: string;
        organizationId?: string;
        includeInactive?: boolean;
    }): Promise<Venue[]> {
        const query = this.venuesRepository.createQueryBuilder('venue')
            .leftJoinAndSelect('venue.organization', 'organization')
            .leftJoinAndSelect('venue.rooms', 'room')
            .leftJoinAndSelect('venue.reviews', 'review')
            .leftJoinAndSelect('venue.operatingHours', 'operatingHours')
            .leftJoinAndSelect('room.pricing', 'pricing');

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
            query.andWhere('room.is_active = :active', { active: true });
        }

        query.addOrderBy('room.sortOrder', 'ASC')
            .addOrderBy('room.name', 'ASC');

        const venues = await query.getMany();
        return venues;
    }

    async findOne(id: string): Promise<Venue> {
        const cacheKey = `venue:${id}`;
        const cached = await this.cacheManager.get<Venue>(cacheKey);

        if (cached) {
            return cached;
        }

        const query = this.venuesRepository.createQueryBuilder('venue')
            .leftJoinAndSelect('venue.organization', 'organization')
            .leftJoinAndSelect('venue.rooms', 'room', 'room.is_active = :roomActive', { roomActive: true })
            .leftJoinAndSelect('venue.reviews', 'review')
            .leftJoinAndSelect('venue.operatingHours', 'operatingHours')
            .leftJoinAndSelect('room.roomType', 'roomType')
            .leftJoinAndSelect('room.roomFeatures', 'roomFeatures')
            .leftJoinAndSelect('room.pricing', 'pricing')
            .where('venue.id = :id', { id })
            .orderBy('room.sortOrder', 'ASC')
            .addOrderBy('room.name', 'ASC');

        const venue = await query.getOne();

        if (!venue) {
            throw new NotFoundException(`Venue with ID ${id} not found`);
        }

        await this.cacheManager.set(cacheKey, venue, 300000);
        return venue;
    }

    async update(id: string, updateVenueDto: UpdateVenueDto, updaterId?: string): Promise<Venue> {
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
            resourceId: id,
            details: updateVenueDto,
            staffId: updaterId
        });

        if (updateVenueDto.openingHours) {
            await this.syncOperatingHours(id, updateVenueDto.openingHours);
        }

        return this.findOne(id);
    }

    async updateStatus(id: string, isActive: boolean, updaterId?: string): Promise<Venue> {
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
            resourceId: id,
            details: { isActive },
            staffId: updaterId
        });

        return updated;
    }

    async remove(id: string): Promise<void> {
        const venue = await this.findOne(id);
        await this.venuesRepository.remove(venue);
        await this.cacheManager.del(`venue:${id}`);
        await this.cacheManager.del('venues:all');

        await this.auditService.log({
            action: 'VENUE_DELETED',
            resource: 'Venue',
            resourceId: id,
            details: { name: venue.name }
        });
    }

    private async syncOperatingHours(venueId: string, openingHours: Record<string, string>) {
        // Clear existing
        await this.hoursRepository.delete({ venueId });

        const daysMap: Record<string, any> = {
            'Monday': 'MONDAY',
            'Tuesday': 'TUESDAY',
            'Wednesday': 'WEDNESDAY',
            'Thursday': 'THURSDAY',
            'Friday': 'FRIDAY',
            'Saturday': 'SATURDAY',
            'Sunday': 'SUNDAY'
        };

        const hoursToInsert: Partial<VenueOperatingHours>[] = [];

        // Check if "Daily" exists
        if (openingHours['Daily']) {
            const [open, close] = openingHours['Daily'].split('-');
            if (open && close) {
                Object.values(daysMap).forEach(day => {
                    hoursToInsert.push({
                        venueId,
                        dayOfWeek: day,
                        openTime: open.trim(),
                        closeTime: close.trim()
                    });
                });
            }
        }

        // Iterate specific days (overrides Daily if present)
        for (const [key, range] of Object.entries(openingHours)) {
            if (key !== 'Daily' && daysMap[key]) {
                const [open, close] = range.split('-');
                if (open && close) {
                    // Filter out any Daily entry for this day to avoid duplicates/conflict
                    const existingIdx = hoursToInsert.findIndex(h => h.dayOfWeek === daysMap[key]);
                    if (existingIdx >= 0) {
                        hoursToInsert[existingIdx] = {
                            venueId,
                            dayOfWeek: daysMap[key],
                            openTime: open.trim(),
                            closeTime: close.trim()
                        };
                    } else {
                        hoursToInsert.push({
                            venueId,
                            dayOfWeek: daysMap[key],
                            openTime: open.trim(),
                            closeTime: close.trim()
                        });
                    }
                }
            }
        }

        if (hoursToInsert.length > 0) {
            await this.hoursRepository.save(hoursToInsert);
        }
    }

    async logPhoneReveal(
        venueId: string,
        userId?: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<{ success: boolean }> {
        const venue = await this.findOne(venueId);

        await this.auditService.log({
            action: 'PHONE_REVEAL',
            resource: 'Venue',
            resourceId: venueId,
            details: {
                venueName: venue.name,
                phone: venue.phone,
                ipAddress,
                userAgent,
                timestamp: new Date().toISOString()
            },
            userId: userId,
        });

        return { success: true };
    }
}
