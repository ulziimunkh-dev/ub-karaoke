import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';
import { Promotion } from './entities/promotion.entity';
import { Venue } from '../venues/entities/venue.entity';
import { Booking } from '../bookings/entities/booking.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Promotion, Venue, Booking])],
    controllers: [PromotionsController],
    providers: [PromotionsService],
    exports: [PromotionsService],
})
export class PromotionsModule { }
