import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { Room } from './entities/room.entity';
import { RoomType } from './entities/room-type.entity';
import { RoomFeature } from './entities/room-feature.entity';
import { RoomPricing } from './entities/room-pricing.entity';
import { RoomImage } from './entities/room-image.entity';
import { RoomAvailability } from './entities/room-availability.entity';
import { RoomSettingsService } from './room-settings.service';
import { RoomSettingsController } from './room-settings.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Room,
      RoomType,
      RoomFeature,
      RoomPricing,
      RoomImage,
      RoomAvailability,
    ]),
  ],
  controllers: [RoomsController, RoomSettingsController],
  providers: [RoomsService, RoomSettingsService],
  exports: [RoomsService, RoomSettingsService],
})
export class RoomsModule {}
