import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AuditService } from '../audit/audit.service';
import {
  PaymentTransaction,
  PaymentProvider,
  TransactionStatus,
} from './entities/payment-transaction.entity';
import { Refund, RefundStatus } from './entities/refund.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { SystemSetting } from '../app-settings/entities/system-setting.entity';
import { QpayService } from './qpay.service';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(PaymentTransaction)
    private transactionsRepository: Repository<PaymentTransaction>,
    @InjectRepository(Refund)
    private refundsRepository: Repository<Refund>,
    @InjectRepository(SystemSetting)
    private settingsRepository: Repository<SystemSetting>,
    private readonly auditService: AuditService,
    private readonly qpayService: QpayService,
    @Inject(forwardRef(() => BookingsService))
    private readonly bookingsService: BookingsService,
  ) { }

  async create(
    createPaymentDto: CreatePaymentDto,
    userId: string,
  ): Promise<Payment> {
    const payment = this.paymentsRepository.create(createPaymentDto);
    const savedPayment = await this.paymentsRepository.save(payment);

    // Audit Log
    await this.auditService.log({
      action: 'PAYMENT_CREATED',
      resource: 'Payment',
      resourceId: savedPayment.id,
      details: {
        amount: savedPayment.amount,
        method: savedPayment.method,
        bookingId: savedPayment.bookingId,
      },
      actorId: userId,
      actorType: 'USER',
      organizationId: savedPayment.organizationId,
    });

    return savedPayment;
  }

  async findAll(): Promise<Payment[]> {
    return this.paymentsRepository.find({
      relations: ['booking'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      where: { id },
      relations: ['booking'],
    });
    if (!payment) {
      throw new NotFoundException(`Payment #${id} not found`);
    }
    return payment;
  }

  async findByBooking(bookingId: string): Promise<Payment[]> {
    return this.paymentsRepository.find({
      where: { bookingId },
      relations: ['transactions', 'refunds'],
      order: { createdAt: 'DESC' },
    });
  }

  async logTransaction(
    paymentId: string,
    data: Partial<PaymentTransaction>,
    user: any,
  ): Promise<PaymentTransaction> {
    const transaction = this.transactionsRepository.create({
      ...data,
      paymentId,
      organizationId: user.organizationId,
    });
    return this.transactionsRepository.save(transaction);
  }

  async createRefund(
    paymentId: string,
    data: Partial<Refund>,
    user: any,
  ): Promise<Refund> {
    const refund = this.refundsRepository.create({
      ...data,
      paymentId,
      organizationId: user.organizationId,
    });
    return this.refundsRepository.save(refund);
  }

  /**
   * Automatically process a refund for a cancelled booking based on time-tiered policy
   */
  async processRefundForBooking(bookingId: string): Promise<Refund | null> {
    // 1. Find a completed payment for this booking
    const payments = await this.paymentsRepository.find({
      where: { bookingId, status: PaymentStatus.COMPLETED },
      order: { createdAt: 'DESC' },
    });

    if (payments.length === 0) {
      this.logger.log(`No completed payments found for booking ${bookingId} to refund.`);
      return null;
    }

    const payment = payments[0];

    // Check if a refund already exists for this payment
    const existingRefund = await this.refundsRepository.findOne({
      where: { paymentId: payment.id }
    });

    if (existingRefund) {
      this.logger.log(`Refund already exists for payment ${payment.id}`);
      return existingRefund;
    }

    // 2. Find the booking to get startTime
    const booking = await this.bookingsRepository.findOne({ where: { id: bookingId } });
    if (!booking || !booking.startTime) {
      this.logger.error(`Cannot process refund: Booking ${bookingId} missing or has no startTime.`);
      return null;
    }

    // 3. Fetch system settings for refund tiers
    const settings = await this.settingsRepository.find();
    const getSetting = (key: string, defaultVal: number): number => {
      const s = settings.find(st => st.key === key);
      return s ? Number(s.value) : defaultVal;
    };

    const tier1Hours = getSetting('refund_tier1_hours', 24);
    const tier1FeePercent = getSetting('refund_tier1_fee_percent', 0);
    const tier2Hours = getSetting('refund_tier2_hours', 4);
    const tier2FeePercent = getSetting('refund_tier2_fee_percent', 50);
    const tier3FeePercent = getSetting('refund_tier3_fee_percent', 100);

    // 4. Calculate time difference in hours between NOW and booking start time
    const now = new Date();
    const timeDiffMs = booking.startTime.getTime() - now.getTime();
    const hoursRemaining = timeDiffMs / (1000 * 60 * 60);

    let feePercent = tier3FeePercent; // Default to highest fee
    let reason = `Cancellation within ${tier2Hours}h (${feePercent}% fee)`;

    if (hoursRemaining >= tier1Hours) {
      feePercent = tier1FeePercent;
      reason = `Cancellation ${tier1Hours}h+ in advance (${feePercent}% fee)`;
    } else if (hoursRemaining >= tier2Hours) {
      feePercent = tier2FeePercent;
      reason = `Cancellation ${tier2Hours}-${tier1Hours}h in advance (${feePercent}% fee)`;
    }

    // Ensure percent is between 0 and 100
    feePercent = Math.max(0, Math.min(100, feePercent));

    // 5. Calculate final refund amount
    const feeAmount = (payment.amount * feePercent) / 100;
    const finalRefundAmount = Math.max(0, payment.amount - feeAmount);

    if (finalRefundAmount === 0) {
      this.logger.log(`Refund fee is 100% for payment ${payment.id}. No refund created.`);
      return null;
    }

    // 6. Create Refund record
    const refund = this.refundsRepository.create({
      paymentId: payment.id,
      amount: finalRefundAmount,
      reason: reason,
      status: RefundStatus.PENDING,
      organizationId: payment.organizationId,
    });

    const savedRefund = await this.refundsRepository.save(refund);

    // Audit Log
    await this.auditService.log({
      action: 'REFUND_REQUESTED_AUTO',
      resource: 'Refund',
      resourceId: savedRefund.id,
      details: {
        paymentId: payment.id,
        bookingId: booking.id,
        originalAmount: payment.amount,
        feePercent: feePercent,
        feeAmount: feeAmount,
        refundAmount: finalRefundAmount,
        hoursRemaining: hoursRemaining,
      },
      actorId: booking.userId || 'SYSTEM',
      actorType: booking.userId ? 'USER' : 'SYSTEM',
      organizationId: payment.organizationId,
    });

    this.logger.log(`Created auto-refund ${savedRefund.id} for payment ${payment.id}. Amount: ${finalRefundAmount}`);

    return savedRefund;
  }

  // ==================== QPay Methods ====================

  /**
   * Create a QPay invoice for a booking
   * Creates a Payment record and calls QPay API to generate QR code
   */
  async createQpayInvoice(bookingId: string, userId: string): Promise<Payment> {
    // Find the booking
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
      relations: ['venue'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking #${bookingId} not found`);
    }

    // Check if there's already a pending QPay payment for this booking
    const existingPayment = await this.paymentsRepository.findOne({
      where: {
        bookingId,
        method: PaymentMethod.QPAY,
        status: PaymentStatus.PENDING,
      },
    });

    if (existingPayment && existingPayment.qpayInvoiceId) {
      this.logger.log(
        `Returning existing QPay payment for booking ${bookingId}`,
      );
      return existingPayment;
    }

    // Create the Payment record
    const payment = this.paymentsRepository.create({
      amount: booking.totalPrice,
      currency: 'MNT',
      method: PaymentMethod.QPAY,
      status: PaymentStatus.PENDING,
      bookingId: booking.id,
      organizationId:
        booking.organizationId || booking.venue?.organizationId || undefined,
      createdBy: userId,
      updatedBy: userId,
    });
    const savedPayment = await this.paymentsRepository.save(payment);

    try {
      // Call QPay to create the invoice
      const description = `UB Karaoke - Booking ${booking.id.substring(0, 8)}`;
      const qpayResponse = await this.qpayService.createInvoice(
        savedPayment.id, // Use our payment ID as the sender_invoice_no
        Number(booking.totalPrice),
        description,
        savedPayment.id, // Pass payment ID for callback
      );

      // Update payment with QPay data
      savedPayment.qpayInvoiceId = qpayResponse.invoice_id;
      savedPayment.qpayQrText = qpayResponse.qr_text;
      savedPayment.qpayQrImage = qpayResponse.qr_image;
      savedPayment.qpayUrls = qpayResponse.urls;

      await this.paymentsRepository.save(savedPayment);

      // Audit Log
      await this.auditService.log({
        action: 'QPAY_INVOICE_CREATED',
        resource: 'Payment',
        resourceId: savedPayment.id,
        details: {
          amount: savedPayment.amount,
          bookingId,
          qpayInvoiceId: qpayResponse.invoice_id,
        },
        actorId: userId,
        actorType: 'USER',
        organizationId: savedPayment.organizationId,
      });

      this.logger.log(
        `QPay invoice created for payment ${savedPayment.id}, invoice: ${qpayResponse.invoice_id}`,
      );
      return savedPayment;
    } catch (error) {
      // If QPay API fails, mark payment as failed
      savedPayment.status = PaymentStatus.FAILED;
      await this.paymentsRepository.save(savedPayment);
      this.logger.error(
        `QPay invoice creation failed for payment ${savedPayment.id}`,
        error.message,
      );
      throw new BadRequestException(
        `QPay invoice creation failed: ${error.message}`,
      );
    }
  }

  /**
   * Check if a QPay payment has been completed
   */
  async checkQpayPayment(paymentId: string): Promise<Payment> {
    const payment = await this.findOne(paymentId);

    if (payment.method !== PaymentMethod.QPAY) {
      throw new BadRequestException('This payment is not a QPay payment');
    }

    // If already completed, just return
    if (payment.status === PaymentStatus.COMPLETED) {
      return payment;
    }

    if (!payment.qpayInvoiceId) {
      throw new BadRequestException(
        'No QPay invoice ID found for this payment',
      );
    }

    try {
      const checkResult = await this.qpayService.checkPayment(
        payment.qpayInvoiceId,
      );

      if (
        checkResult.count > 0 &&
        checkResult.paid_amount >= Number(payment.amount)
      ) {
        // Payment is completed!
        const qpayPayment = checkResult.rows[0];

        // Update payment status
        payment.status = PaymentStatus.COMPLETED;
        payment.transactionId = qpayPayment.payment_id;
        await this.paymentsRepository.save(payment);

        // Log the transaction
        const transaction = this.transactionsRepository.create({
          paymentId: payment.id,
          provider: PaymentProvider.QPAY,
          providerTxId: qpayPayment.payment_id,
          amount: Number(qpayPayment.payment_amount),
          status: TransactionStatus.SUCCESS,
          rawResponse: checkResult,
        });
        await this.transactionsRepository.save(transaction);

        // Confirm the booking
        try {
          await this.bookingsService.confirmPayment(payment.bookingId, {
            paymentMethod: 'QPAY',
            amount: payment.amount,
            transactionId: qpayPayment.payment_id,
          });
          this.logger.log(
            `Booking ${payment.bookingId} confirmed after QPay payment`,
          );
        } catch (bookingError) {
          this.logger.warn(
            `Could not confirm booking ${payment.bookingId}: ${bookingError.message}`,
          );
        }

        // Audit
        await this.auditService.log({
          action: 'QPAY_PAYMENT_COMPLETED',
          resource: 'Payment',
          resourceId: payment.id,
          details: {
            qpayPaymentId: qpayPayment.payment_id,
            amount: qpayPayment.payment_amount,
            bookingId: payment.bookingId,
          },
          actorId: payment.createdBy,
          actorType: 'USER',
          organizationId: payment.organizationId,
        });
      }

      return payment;
    } catch (error) {
      this.logger.error(
        `QPay payment check failed for payment ${paymentId}`,
        error.message,
      );
      throw new BadRequestException(
        `QPay payment check failed: ${error.message}`,
      );
    }
  }

  /**
   * Handle QPay callback webhook
   */
  async handleQpayCallback(paymentId: string): Promise<void> {
    this.logger.log(`QPay callback received for payment: ${paymentId}`);

    if (!paymentId) {
      this.logger.warn('QPay callback received without payment_id');
      return;
    }

    try {
      await this.checkQpayPayment(paymentId);
    } catch (error) {
      this.logger.error(
        `QPay callback processing failed for payment ${paymentId}`,
        error.message,
      );
    }
  }
}
