import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post()
    create(@Body() createPaymentDto: CreatePaymentDto, @Request() req: any) {
        return this.paymentsService.create(createPaymentDto, req.user.userId);
    }

    @Get()
    findAll() {
        return this.paymentsService.findAll();
    }

    findOne(@Param('id') id: string) {
        return this.paymentsService.findOne(id);
    }

    @Get('booking/:bookingId')
    findByBooking(@Param('bookingId') bookingId: string) {
        return this.paymentsService.findByBooking(bookingId);
    }
}
