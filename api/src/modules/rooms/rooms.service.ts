import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { RoomFeature } from './entities/room-feature.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Organization } from '../organizations/entities/organization.entity';
import { RoomPricing } from './entities/room-pricing.entity';
import { RoomImage } from './entities/room-image.entity';
import { RoomAvailability } from './entities/room-availability.entity';

@Injectable()
export class RoomsService {
    constructor(
        @InjectRepository(Room)
        private roomsRepository: Repository<Room>,
        @InjectRepository(RoomPricing)
        private pricingRepository: Repository<RoomPricing>,
        @InjectRepository(RoomImage)
        private imagesRepository: Repository<RoomImage>,
        @InjectRepository(RoomAvailability)
        private availabilityRepository: Repository<RoomAvailability>,
        @InjectRepository(RoomFeature)
        private featuresRepository: Repository<RoomFeature>,
    ) { }

    async create(createRoomDto: CreateRoomDto, creatorId?: string): Promise<Room> {
        const { roomFeatureIds, ...roomData } = createRoomDto;
        const room = this.roomsRepository.create({
            ...roomData,
            createdBy: creatorId,
        });

        if (roomFeatureIds?.length) {
            room.roomFeatures = await this.featuresRepository.findByIds(roomFeatureIds);
        }

        return this.roomsRepository.save(room);
    }

    async findAll(filters?: {
        venueId?: string;
        isVIP?: boolean;
        minCapacity?: number;
        organizationId?: string;
        includeInactive?: boolean;
    }): Promise<Room[]> {
        const query = this.roomsRepository.createQueryBuilder('room')
            .leftJoinAndSelect('room.venue', 'venue')
            .leftJoinAndSelect('venue.organization', 'organization')
            .leftJoinAndSelect('room.roomType', 'roomType')
            .leftJoinAndSelect('room.roomFeatures', 'roomFeatures')
            .orderBy('room.sortOrder', 'ASC')
            .addOrderBy('room.name', 'ASC');

        if (filters?.venueId) {
            query.andWhere('room.venueId = :venueId', { venueId: filters.venueId });
        }

        if (filters?.isVIP !== undefined) {
            query.andWhere('room.isVIP = :isVIP', { isVIP: filters.isVIP });
        }

        if (filters?.minCapacity) {
            query.andWhere('room.capacity >= :minCapacity', {
                minCapacity: filters.minCapacity,
            });
        }

        if (filters?.organizationId) {
            query.andWhere('room.organization_id = :organizationId', {
                organizationId: filters.organizationId,
            });
        }

        if (!filters?.includeInactive) {
            query.andWhere('room.is_active = :active', { active: true });
            query.andWhere('venue.is_active = :active', { active: true });
            query.andWhere('organization.is_active = :active', { active: true });
        }

        return query.getMany();
    }

    async findOne(id: string, user: any) {
        // If system admin or checking existence, bypass org check 
        // But here we generally want to verify ownership if user is staff/admin
        const where: any = { id };
        if (user && user.role !== 'sysadmin' && user.role !== 'customer') {
            where.organization = { id: user.organizationId };
        }

        const room = await this.roomsRepository.findOne({
            where,
            relations: ['venue', 'roomType', 'roomFeatures', 'pricing', 'imagesList'],
        });

        if (!room) {
            throw new NotFoundException(`Room with ID ${id} not found`);
        }

        return room;
    }

    async update(id: string, updateRoomDto: UpdateRoomDto, user: any) {
        // Ensure ownership
        const room = await this.findOne(id, user);

        const { roomFeatureIds, ...roomData } = updateRoomDto;

        // Update basic info
        Object.assign(room, roomData);

        // Update features if provided
        if (roomFeatureIds !== undefined) {
            if (roomFeatureIds.length > 0) {
                room.roomFeatures = await this.featuresRepository.findByIds(roomFeatureIds);
            } else {
                room.roomFeatures = [];
            }
        }

        if (user?.id) {
            room.updatedBy = user.id;
        }

        return this.roomsRepository.save(room);
    }

    async updateStatus(id: string, isActive: boolean, user: any): Promise<Room> {
        const room = await this.findOne(id, user);
        room.isActive = isActive;
        if (user?.id) {
            room.updatedBy = user.id;
        }
        return this.roomsRepository.save(room);
    }

    async remove(id: string, user: any): Promise<void> {
        const room = await this.findOne(id, user);
        await this.roomsRepository.remove(room);
    }

    async addPricing(roomId: string, pricingData: Partial<RoomPricing>, user: any) {
        const room = await this.findOne(roomId, user);
        const pricing = this.pricingRepository.create({
            ...pricingData,
            roomId: room.id,
            venueId: room.venueId,
            organizationId: user.organizationId,
            createdBy: user.id
        });
        return this.pricingRepository.save(pricing);
    }

    async addVenuePricing(venueId: string, pricingData: Partial<RoomPricing>, user: any) {
        // Here you would normally verify venue ownership
        const pricing = this.pricingRepository.create({
            ...pricingData,
            venueId,
            roomId: null, // Applies to all rooms
            organizationId: user.organizationId,
            createdBy: user.id
        });
        return this.pricingRepository.save(pricing);
    }

    async removePricing(id: string, user: any) {
        const pricing = await this.pricingRepository.findOne({ where: { id } });
        if (pricing) {
            // Verify ownership via room or direct relation if practical, 
            // but for now relying on user context being passed to findOne logic if extended
            if (user && user.role !== 'sysadmin' && pricing.organizationId !== user.organizationId) {
                throw new NotFoundException('Pricing not found or access denied');
            }
            return this.pricingRepository.remove(pricing);
        }
    }

    async addImage(roomId: string, imageData: Partial<RoomImage>, user: any) {
        const room = await this.findOne(roomId, user);
        const image = this.imagesRepository.create({
            ...imageData,
            roomId: room.id,
            organizationId: user.organizationId,
        });
        return this.imagesRepository.save(image);
    }

    async removeImage(id: string, user: any) {
        const image = await this.imagesRepository.findOne({ where: { id } });
        if (image) {
            if (user && user.role !== 'sysadmin' && image.organizationId !== user.organizationId) {
                throw new NotFoundException('Image not found or access denied');
            }
            return this.imagesRepository.remove(image);
        }
    }

    async setAvailability(roomId: string, date: string, startTime: string, endTime: string, isAvailable: boolean, user: any) {
        const room = await this.findOne(roomId, user);

        // Check if override exists
        let availability = await this.availabilityRepository.findOne({
            where: { roomId, date, startTime, endTime }
        });

        if (availability) {
            availability.isAvailable = isAvailable;
            availability.venueId = room.venueId;
            availability.updatedBy = user.id;
        } else {
            availability = this.availabilityRepository.create({
                roomId,
                venueId: room.venueId,
                date,
                startTime,
                endTime,
                isAvailable,
                organizationId: user.organizationId,
                createdBy: user.id
            });
        }

        return this.availabilityRepository.save(availability);
    }

    async updateSortOrders(orders: { roomId: string, sortOrder: number }[], user: any) {
        // Simple sequential update for now
        const updates = orders.map(async (item) => {
            const room = await this.findOne(item.roomId, user);
            room.sortOrder = item.sortOrder;
            if (user?.id) room.updatedBy = user.id;
            return this.roomsRepository.save(room);
        });
        return Promise.all(updates);
    }
}
