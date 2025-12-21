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
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new booking' })
    create(@Body() createBookingDto: CreateBookingDto) {
        return this.bookingsService.create(createBookingDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all bookings with optional filters' })
    @ApiQuery({ name: 'userId', required: false })
    @ApiQuery({ name: 'venueId', required: false })
    @ApiQuery({ name: 'roomId', required: false })
    @ApiQuery({ name: 'status', required: false })
    findAll(
        @Query('userId') userId?: string,
        @Query('venueId') venueId?: string,
        @Query('roomId') roomId?: string,
        @Query('status') status?: string,
    ) {
        return this.bookingsService.findAll({
            userId: userId ? +userId : undefined,
            venueId: venueId ? +venueId : undefined,
            roomId: roomId ? +roomId : undefined,
            status,
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific booking by ID' })
    findOne(@Param('id') id: string) {
        return this.bookingsService.findOne(+id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a booking' })
    update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
        return this.bookingsService.update(+id, updateBookingDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Cancel/Delete a booking' })
    remove(@Param('id') id: string) {
        return this.bookingsService.remove(+id);
    }
}
