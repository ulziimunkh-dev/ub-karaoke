import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Promotion } from './entities/promotion.entity';
import { Venue } from '../venues/entities/venue.entity';
import { Booking } from '../bookings/entities/booking.entity';

@Injectable()
export class PromotionsService {
    constructor(
        @InjectRepository(Promotion)
        private promotionsRepository: Repository<Promotion>,
        @InjectRepository(Venue)
        private venuesRepository: Repository<Venue>,
        @InjectRepository(Booking)
        private bookingsRepository: Repository<Booking>,
    ) { }

    async create(createPromotionDto: any, userId: string) {
        const { organizationId, venueId, ...rest } = createPromotionDto;
        const promotion = this.promotionsRepository.create({
            ...rest,
            organizationId: organizationId || null,
            venueId: venueId || null,
            createdBy: userId,
        });
        return this.promotionsRepository.save(promotion);
    }

    async findAll(organizationId: string, includeInactive = false) {
        const where: any = { isDeleted: false };
        if (organizationId) {
            where.organizationId = organizationId;
        }
        if (!includeInactive) {
            where.isActive = true;
        }
        return this.promotionsRepository.find({
            where,
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

    async validateCodeByVenue(code: string, venueId: string) {
        if (!venueId) {
            throw new BadRequestException('venueId is required');
        }
        const venue = await this.venuesRepository.findOne({ where: { id: venueId } });
        if (!venue) {
            throw new NotFoundException('Venue not found');
        }
        return this.validateCode(code, venue.organizationId);
    }

    async update(id: string, updateData: any) {
        const promotion = await this.findOne(id);
        const { organizationId, venueId, ...rest } = updateData;
        Object.assign(promotion, rest);
        if (organizationId !== undefined) {
            promotion.organizationId = organizationId || null;
        }
        if (venueId !== undefined) {
            promotion.venueId = venueId || null;
        }
        return this.promotionsRepository.save(promotion);
    }

    async remove(id: string) {
        const promotion = await this.findOne(id);
        const usageCount = await this.bookingsRepository.count({ where: { appliedPromotionId: id } });
        if (usageCount > 0) {
            throw new BadRequestException(
                `Cannot delete promotion "${promotion.code}" — it has been used in ${usageCount} booking(s).`
            );
        }
        promotion.isActive = false;
        promotion.isDeleted = true;
        return this.promotionsRepository.save(promotion);
    }

    /**
     * Cron job: runs every hour to deactivate expired promotions.
     * Sets isActive = false for any promo whose validTo date has passed.
     */
    @Cron(CronExpression.EVERY_HOUR)
    async deactivateExpiredPromotions() {
        const now = new Date();
        const result = await this.promotionsRepository
            .createQueryBuilder()
            .update(Promotion)
            .set({ isActive: false })
            .where('isActive = :active', { active: true })
            .andWhere('isDeleted = :deleted', { deleted: false })
            .andWhere('"validTo" < :now', { now })
            .execute();

        if (result.affected && result.affected > 0) {
            console.log(`[Promotions] Auto-deactivated ${result.affected} expired promotion(s).`);
        }
    }
}
