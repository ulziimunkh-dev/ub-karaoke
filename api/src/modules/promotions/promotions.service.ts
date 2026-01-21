import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion } from './entities/promotion.entity';

@Injectable()
export class PromotionsService {
    constructor(
        @InjectRepository(Promotion)
        private promotionsRepository: Repository<Promotion>,
    ) { }

    async create(createPromotionDto: any, userId: string) {
        const { organizationId, ...rest } = createPromotionDto;
        const promotion = this.promotionsRepository.create({
            ...rest,
            organization: organizationId ? { id: organizationId } as any : null,
            createdBy: userId,
        });
        return this.promotionsRepository.save(promotion);
    }

    async findAll(organizationId: string) {
        return this.promotionsRepository.find({
            where: { organizationId },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string) {
        const promotion = await this.promotionsRepository.findOne({ where: { id } });
        if (!promotion) {
            throw new NotFoundException(`Promotion #${id} not found`);
        }
        return promotion;
    }

    async validateCode(code: string, organizationId: string) {
        const promotion = await this.promotionsRepository.findOne({
            where: { code, organizationId, isActive: true },
        });

        if (!promotion) {
            throw new NotFoundException('Invalid promotion code');
        }

        const now = new Date();
        if (now < promotion.validFrom || now > promotion.validTo) {
            throw new NotFoundException('Promotion is expired or not yet valid');
        }

        return promotion;
    }

    async remove(id: string) {
        const promotion = await this.findOne(id);
        return this.promotionsRepository.remove(promotion);
    }
}
