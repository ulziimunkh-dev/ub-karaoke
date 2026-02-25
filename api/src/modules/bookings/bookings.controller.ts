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
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new booking' })
  create(@Body() createBookingDto: CreateBookingDto, @Request() req: any) {
    // If user is logged in, pass userId.
    return this.bookingsService.create(createBookingDto, req.user.id);
  }

  @Post('manual')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  // @Roles('manager', 'staff')
  @ApiOperation({
    summary: 'Manually create and confirm a booking (Manager/Staff)',
  })
  createManual(
    @Body() createBookingDto: CreateBookingDto,
    @Request() req: any,
  ) {
    return this.bookingsService.createManual(createBookingDto, req.user);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  // @Roles('admin', 'staff')
  approve(@Param('id') id: string, @Request() req: any) {
    return this.bookingsService.approve(id, req.user.id);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  // @Roles('admin', 'staff')
  reject(@Param('id') id: string, @Request() req: any) {
    return this.bookingsService.reject(id, req.user.id);
  }

  @Patch(':id/confirm-payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm payment for RESERVED booking' })
  confirmPayment(
    @Param('id') id: string,
    @Body() paymentData: any,
    @Request() req: any,
  ) {
    return this.bookingsService.confirmPayment(id, paymentData);
  }

  @Patch(':id/extend-reservation')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Extend reservation by 5 minutes' })
  extendReservation(@Param('id') id: string, @Request() req: any) {
    return this.bookingsService.extendReservation(id, req.user.id);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get booking status with expiration info' })
  async getBookingStatus(@Param('id') id: string) {
    const booking = await this.bookingsService.findOne(id);
    const now = new Date();

    return {
      id: booking.id,
      status: booking.status,
      expiresAt: booking.expiresAt,
      isExpired: booking.expiresAt && now > booking.expiresAt,
      remainingSeconds: booking.expiresAt
        ? Math.max(
            0,
            Math.floor((booking.expiresAt.getTime() - now.getTime()) / 1000),
          )
        : null,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookings with optional filters' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'venueId', required: false })
  @ApiQuery({ name: 'roomId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'organizationId', required: false })
  findAll(
    @Query('userId') userId?: string,
    @Query('venueId') venueId?: string,
    @Query('roomId') roomId?: string,
    @Query('status') status?: string,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.bookingsService.findAll({
      userId,
      venueId,
      roomId,
      status,
      organizationId,
    });
  }

  @Get('availability')
  @ApiOperation({
    summary: 'Get available time slots for a room on a specific date',
  })
  @ApiQuery({ name: 'roomId', required: true })
  @ApiQuery({ name: 'date', required: true, description: 'YYYY-MM-DD' })
  getAvailability(
    @Query('roomId') roomId: string,
    @Query('date') date: string,
  ) {
    return this.bookingsService.getAvailableSlots(roomId, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific booking by ID' })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a booking' })
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingsService.update(id, updateBookingDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel/Delete a booking' })
  remove(@Param('id') id: string) {
    return this.bookingsService.remove(id);
  }
}
