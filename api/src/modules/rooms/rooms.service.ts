import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
    constructor(
        @InjectRepository(Room)
        private roomsRepository: Repository<Room>,
    ) { }

    async create(createRoomDto: CreateRoomDto, creatorId?: number): Promise<Room> {
        const room = this.roomsRepository.create({
            ...createRoomDto,
            createdBy: creatorId,
        });
        return this.roomsRepository.save(room);
    }

    async findAll(filters?: {
        venueId?: number;
        isVIP?: boolean;
        minCapacity?: number;
        organizationId?: number;
        includeInactive?: boolean;
    }): Promise<Room[]> {
        const query = this.roomsRepository.createQueryBuilder('room')
            .leftJoinAndSelect('room.venue', 'venue')
            .leftJoinAndSelect('venue.organization', 'organization');

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

    async findOne(id: number): Promise<Room> {
        const room = await this.roomsRepository.findOne({
            where: { id },
            relations: ['venue'],
        });

        if (!room) {
            throw new NotFoundException(`Room with ID ${id} not found`);
        }

        return room;
    }

    async update(id: number, updateRoomDto: UpdateRoomDto, updaterId?: number): Promise<Room> {
        const room = await this.findOne(id);
        Object.assign(room, updateRoomDto);
        if (updaterId) {
            room.updatedBy = updaterId;
        }
        return this.roomsRepository.save(room);
    }

    async updateStatus(id: number, isActive: boolean, updaterId?: number): Promise<Room> {
        const room = await this.findOne(id);
        room.isActive = isActive;
        if (updaterId) {
            room.updatedBy = updaterId;
        }
        return this.roomsRepository.save(room);
    }

    async remove(id: number): Promise<void> {
        const room = await this.findOne(id);
        await this.roomsRepository.remove(room);
    }
}
