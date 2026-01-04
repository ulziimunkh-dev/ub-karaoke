import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Venue } from '../venues/entities/venue.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectRepository(Review)
        private reviewsRepository: Repository<Review>,
        @InjectRepository(Venue)
        private venuesRepository: Repository<Venue>,
    ) { }

    async create(createReviewDto: CreateReviewDto, creatorId?: number): Promise<Review> {
        const review = this.reviewsRepository.create({
            ...createReviewDto,
            createdBy: creatorId,
        });
        const saved = await this.reviewsRepository.save(review);

        // Update venue rating
        await this.updateVenueRating(createReviewDto.venueId);

        return saved;
    }

    async findAll(venueId?: number): Promise<Review[]> {
        if (venueId) {
            return this.reviewsRepository.find({
                where: { venueId },
                order: { createdAt: 'DESC' },
            });
        }
        return this.reviewsRepository.find({ order: { createdAt: 'DESC' } });
    }

    async findOne(id: number): Promise<Review> {
        const review = await this.reviewsRepository.findOne({
            where: { id },
            relations: ['venue'],
        });

        if (!review) {
            throw new NotFoundException(`Review with ID ${id} not found`);
        }

        return review;
    }

    async update(id: number, updateReviewDto: UpdateReviewDto, updaterId?: number): Promise<Review> {
        const review = await this.findOne(id);
        Object.assign(review, updateReviewDto);
        if (updaterId) {
            review.updatedBy = updaterId;
        }
        const updated = await this.reviewsRepository.save(review);

        // Update venue rating if rating changed
        if (updateReviewDto.rating !== undefined) {
            await this.updateVenueRating(review.venueId);
        }

        return updated;
    }

    async remove(id: number): Promise<void> {
        const review = await this.findOne(id);
        const venueId = review.venueId;
        await this.reviewsRepository.remove(review);
        await this.updateVenueRating(venueId);
    }

    private async updateVenueRating(venueId: number): Promise<void> {
        const reviews = await this.reviewsRepository.find({ where: { venueId } });

        const totalReviews = reviews.length;
        const avgRating =
            totalReviews > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
                : 0;

        await this.venuesRepository.update(venueId, {
            rating: Math.round(avgRating * 100) / 100,
            totalReviews,
        });
    }
}
