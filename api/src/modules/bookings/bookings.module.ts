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
import { RoomAvailability } from '../rooms/entities/room-availability.entity';
import { Venue } from '../venues/entities/venue.entity';
import { VenueOperatingHours } from '../venues/entities/venue-operating-hours.entity';
import { User } from '../auth/entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Booking,
            BookingStatusHistory,
            BookingPromotion,
            Room,
            RoomAvailability,
            Venue,
            VenueOperatingHours,
            User
        ]),
        PromotionsModule,
        RoomsModule
    ],
    controllers: [BookingsController],
    providers: [BookingsService],
    exports: [BookingsService],
})
export class BookingsModule { }
