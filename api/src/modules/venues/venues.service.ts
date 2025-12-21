import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Venue } from './entities/venue.entity';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';

@Injectable()
export class VenuesService {
    constructor(
        @InjectRepository(Venue)
        private venuesRepository: Repository<Venue>,
        @Inject(CACHE_MANAGER)
        private cacheManager: Cache,
    ) { }

    async create(createVenueDto: CreateVenueDto): Promise<Venue> {
        const venue = this.venuesRepository.create(createVenueDto);
        const saved = await this.venuesRepository.save(venue);
        await this.cacheManager.del('venues:all');
        return saved;
    }

    async findAll(filters?: {
        district?: string;
        priceRange?: string;
        search?: string;
    }): Promise<Venue[]> {
        const cacheKey = `venues:all:${JSON.stringify(filters || {})}`;
        const cached = await this.cacheManager.get<Venue[]>(cacheKey);

        if (cached) {
            return cached;
        }

        const query = this.venuesRepository.createQueryBuilder('venue')
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

        const venues = await query.getMany();
        await this.cacheManager.set(cacheKey, venues, 300000); // 5 minutes
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

    async update(id: number, updateVenueDto: UpdateVenueDto): Promise<Venue> {
        const venue = await this.findOne(id);
        Object.assign(venue, updateVenueDto);
        const updated = await this.venuesRepository.save(venue);
        await this.cacheManager.del(`venue:${id}`);
        await this.cacheManager.del('venues:all');
        return updated;
    }

    async remove(id: number): Promise<void> {
        const venue = await this.findOne(id);
        await this.venuesRepository.remove(venue);
        await this.cacheManager.del(`venue:${id}`);
        await this.cacheManager.del('venues:all');
    }
}
