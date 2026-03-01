import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Get('refunds')
  @UseGuards(JwtAuthGuard)
  getRefundsByOrg(@Request() req: any) {
    return this.paymentsService.getRefundsByOrg(req.user.organizationId);
  }

  @Patch('refunds/:id/process')
  @UseGuards(JwtAuthGuard)
  markRefundProcessed(@Param('id') id: string, @Request() req: any) {
    return this.paymentsService.markRefundProcessed(id, req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createPaymentDto: CreatePaymentDto, @Request() req: any) {
    return this.paymentsService.create(createPaymentDto, req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Get('booking/:bookingId')
  @UseGuards(JwtAuthGuard)
  findByBooking(@Param('bookingId') bookingId: string) {
    return this.paymentsService.findByBooking(bookingId);
  }

  // ==================== QPay Endpoints ====================

  /**
   * Create a QPay invoice for a booking
   * POST /payments/qpay/create-invoice
   */
  @Post('qpay/create-invoice')
  @UseGuards(JwtAuthGuard)
  async createQpayInvoice(
    @Body() body: { bookingId: string },
    @Request() req: any,
  ) {
    return this.paymentsService.createQpayInvoice(
      body.bookingId,
      req.user.userId,
    );
  }

  /**
   * Check QPay payment status
   * POST /payments/qpay/check-payment/:paymentId
   */
  @Post('qpay/check-payment/:paymentId')
  @UseGuards(JwtAuthGuard)
  async checkQpayPayment(@Param('paymentId') paymentId: string) {
    return this.paymentsService.checkQpayPayment(paymentId);
  }

  /**
   * QPay callback webhook (no auth - called by QPay)
   * GET /payments/qpay/callback
   */
  @Get('qpay/callback')
  async qpayCallback(@Query('payment_id') paymentId: string) {
    await this.paymentsService.handleQpayCallback(paymentId);
    return { success: true };
  }
}
