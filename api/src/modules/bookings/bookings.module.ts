import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './entities/booking.entity';
import { BookingStatusHistory } from './entities/booking-status-history.entity';
import { BookingPromotion } from './entities/booking-promotion.entity';
import { PromotionsModule } from '../promotions/promotions.module';
import { RoomsModule } from '../rooms/rooms.module';
import { Room } from '../rooms/entities/room.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Booking, BookingStatusHistory, BookingPromotion, Room]),
        PromotionsModule,
        RoomsModule
    ],
    controllers: [BookingsController],
    providers: [BookingsService],
    exports: [BookingsService],
})
export class BookingsModule { }
