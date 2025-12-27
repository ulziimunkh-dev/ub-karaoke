import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new booking' })
    create(@Body() createBookingDto: CreateBookingDto, @Request() req: any) {
        // If user is logged in, pass userId.
        return this.bookingsService.create(createBookingDto, req.user.userId);
    }

    @Post('manual')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    // @Roles('manager', 'staff')
    @ApiOperation({ summary: 'Manually create and confirm a booking (Manager/Staff)' })
    createManual(@Body() createBookingDto: CreateBookingDto, @Request() req: any) {
        return this.bookingsService.createManual(createBookingDto, req.user.userId);
    }

    @Patch(':id/approve')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    // @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Approve a booking' })
    approve(@Param('id') id: string, @Request() req: any) {
        return this.bookingsService.approve(+id, req.user.userId);
    }

    @Patch(':id/reject')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    // @Roles('admin', 'staff')
    @ApiOperation({ summary: 'Reject a booking' })
    reject(@Param('id') id: string, @Request() req: any) {
        return this.bookingsService.reject(+id, req.user.userId);
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
