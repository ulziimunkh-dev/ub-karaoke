import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { Room } from './entities/room.entity';
import { RoomType } from './entities/room-type.entity';
import { RoomFeature } from './entities/room-feature.entity';
import { RoomSettingsService } from './room-settings.service';
import { RoomSettingsController } from './room-settings.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Room, RoomType, RoomFeature])],
    controllers: [RoomsController, RoomSettingsController],
    providers: [RoomsService, RoomSettingsService],
    exports: [RoomsService, RoomSettingsService],
})
export class RoomsModule { }
