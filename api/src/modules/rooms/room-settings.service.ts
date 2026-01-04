import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomType } from './entities/room-type.entity';
import { RoomFeature } from './entities/room-feature.entity';

@Injectable()
export class RoomSettingsService {
    constructor(
        @InjectRepository(RoomType)
        private roomTypesRepository: Repository<RoomType>,
        @InjectRepository(RoomFeature)
        private roomFeaturesRepository: Repository<RoomFeature>,
    ) { }

    // --- TYPES ---
    async getTypes(organizationId: number) {
        return this.roomTypesRepository.find({ where: { organizationId } });
    }

    async createType(organizationId: number, data: { name: string, description?: string }, actorId?: number) {
        const type = this.roomTypesRepository.create({ ...data, organizationId, createdBy: actorId });
        return this.roomTypesRepository.save(type);
    }

    async updateType(id: number, data: { name?: string, description?: string }, actorId?: number) {
        const type = await this.roomTypesRepository.findOne({ where: { id } });
        if (!type) throw new NotFoundException('Room type not found');

        Object.assign(type, data);
        if (actorId) {
            type.updatedBy = actorId;
        }
        return this.roomTypesRepository.save(type);
    }

    async deleteType(id: number) {
        return this.roomTypesRepository.delete(id);
    }

    // --- FEATURES ---
    async getFeatures(organizationId: number) {
        return this.roomFeaturesRepository.find({ where: { organizationId } });
    }

    async createFeature(organizationId: number, data: { name: string, icon?: string }, actorId?: number) {
        const feature = this.roomFeaturesRepository.create({ ...data, organizationId, createdBy: actorId });
        return this.roomFeaturesRepository.save(feature);
    }

    async updateFeature(id: number, data: { name?: string, icon?: string }, actorId?: number) {
        const feature = await this.roomFeaturesRepository.findOne({ where: { id } });
        if (!feature) throw new NotFoundException('Room feature not found');

        Object.assign(feature, data);
        if (actorId) {
            feature.updatedBy = actorId;
        }
        return this.roomFeaturesRepository.save(feature);
    }

    async deleteFeature(id: number) {
        return this.roomFeaturesRepository.delete(id);
    }
}
