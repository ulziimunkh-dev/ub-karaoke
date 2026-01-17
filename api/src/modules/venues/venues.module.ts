import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VenuesService } from './venues.service';
import { VenuesController } from './venues.controller';
import { Venue } from './entities/venue.entity';
import { VenueOperatingHours } from './entities/venue-operating-hours.entity';

import { RoomsModule } from '../rooms/rooms.module';

@Module({
    imports: [TypeOrmModule.forFeature([Venue, VenueOperatingHours]), RoomsModule],
    controllers: [VenuesController],
    providers: [VenuesService],
    exports: [VenuesService],
})
export class VenuesModule { }
