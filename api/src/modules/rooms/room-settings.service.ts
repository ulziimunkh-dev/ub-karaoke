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
  ) {}

  // --- TYPES ---
  async getTypes() {
    return this.roomTypesRepository.find();
  }

  async createType(
    data: { name: string; description?: string },
    actorId?: string,
  ) {
    const type = this.roomTypesRepository.create({
      ...data,
      createdBy: actorId,
    });
    return this.roomTypesRepository.save(type);
  }

  async updateType(
    id: string,
    data: { name?: string; description?: string },
    actorId?: string,
  ) {
    const type = await this.roomTypesRepository.findOne({ where: { id } });
    if (!type) throw new NotFoundException('Room type not found');

    Object.assign(type, data);
    if (actorId) {
      type.updatedBy = actorId;
    }
    return this.roomTypesRepository.save(type);
  }

  async deleteType(id: string) {
    return this.roomTypesRepository.delete(id);
  }

  // --- FEATURES ---
  async getFeatures() {
    return this.roomFeaturesRepository.find();
  }

  async createFeature(data: { name: string; icon?: string }, actorId?: string) {
    const feature = this.roomFeaturesRepository.create({
      ...data,
      createdBy: actorId,
    });
    return this.roomFeaturesRepository.save(feature);
  }

  async updateFeature(
    id: string,
    data: { name?: string; icon?: string },
    actorId?: string,
  ) {
    const feature = await this.roomFeaturesRepository.findOne({
      where: { id },
    });
    if (!feature) throw new NotFoundException('Room feature not found');

    Object.assign(feature, data);
    if (actorId) {
      feature.updatedBy = actorId;
    }
    return this.roomFeaturesRepository.save(feature);
  }

  async deleteFeature(id: string) {
    return this.roomFeaturesRepository.delete(id);
  }
}
