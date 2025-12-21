import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
    constructor(private readonly roomsService: RoomsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new room' })
    create(@Body() createRoomDto: CreateRoomDto) {
        return this.roomsService.create(createRoomDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all rooms with optional filters' })
    @ApiQuery({ name: 'venueId', required: false })
    @ApiQuery({ name: 'isVIP', required: false })
    @ApiQuery({ name: 'minCapacity', required: false })
    findAll(
        @Query('venueId') venueId?: string,
        @Query('isVIP') isVIP?: string,
        @Query('minCapacity') minCapacity?: string,
    ) {
        return this.roomsService.findAll({
            venueId: venueId ? +venueId : undefined,
            isVIP: isVIP ? isVIP === 'true' : undefined,
            minCapacity: minCapacity ? +minCapacity : undefined,
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific room by ID' })
    findOne(@Param('id') id: string) {
        return this.roomsService.findOne(+id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a room' })
    update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
        return this.roomsService.update(+id, updateRoomDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a room' })
    remove(@Param('id') id: string) {
        return this.roomsService.remove(+id);
    }
}
