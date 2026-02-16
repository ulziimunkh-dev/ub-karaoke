import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentMethod, PaymentStatus } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AuditService } from '../audit/audit.service';
import { PaymentTransaction, PaymentProvider, TransactionStatus } from './entities/payment-transaction.entity';
import { Refund } from './entities/refund.entity';
import { Booking } from '../bookings/entities/booking.entity';
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
        private readonly auditService: AuditService,
        private readonly qpayService: QpayService,
        private readonly bookingsService: BookingsService,
    ) { }

    async create(createPaymentDto: CreatePaymentDto, userId: string): Promise<Payment> {
        const payment = this.paymentsRepository.create(createPaymentDto);
        const savedPayment = await this.paymentsRepository.save(payment);

        // Audit Log
        await this.auditService.log({
            action: 'PAYMENT_CREATED',
            resource: 'Payment',
            resourceId: savedPayment.id,
            details: { amount: savedPayment.amount, method: savedPayment.method, bookingId: savedPayment.bookingId },
            userId: userId,
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

    async logTransaction(paymentId: string, data: Partial<PaymentTransaction>, user: any): Promise<PaymentTransaction> {
        const transaction = this.transactionsRepository.create({
            ...data,
            paymentId,
            organizationId: user.organizationId,
        });
        return this.transactionsRepository.save(transaction);
    }

    async createRefund(paymentId: string, data: Partial<Refund>, user: any): Promise<Refund> {
        const refund = this.refundsRepository.create({
            ...data,
            paymentId,
            organizationId: user.organizationId,
        });
        return this.refundsRepository.save(refund);
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
            this.logger.log(`Returning existing QPay payment for booking ${bookingId}`);
            return existingPayment;
        }

        // Create the Payment record
        const payment = this.paymentsRepository.create({
            amount: booking.totalPrice,
            currency: 'MNT',
            method: PaymentMethod.QPAY,
            status: PaymentStatus.PENDING,
            bookingId: booking.id,
            createdBy: userId,
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
                userId,
            });

            this.logger.log(`QPay invoice created for payment ${savedPayment.id}, invoice: ${qpayResponse.invoice_id}`);
            return savedPayment;

        } catch (error) {
            // If QPay API fails, mark payment as failed
            savedPayment.status = PaymentStatus.FAILED;
            await this.paymentsRepository.save(savedPayment);
            this.logger.error(`QPay invoice creation failed for payment ${savedPayment.id}`, error.message);
            throw new BadRequestException(`QPay invoice creation failed: ${error.message}`);
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
            throw new BadRequestException('No QPay invoice ID found for this payment');
        }

        try {
            const checkResult = await this.qpayService.checkPayment(payment.qpayInvoiceId);

            if (checkResult.count > 0 && checkResult.paid_amount >= Number(payment.amount)) {
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
                    this.logger.log(`Booking ${payment.bookingId} confirmed after QPay payment`);
                } catch (bookingError) {
                    this.logger.warn(`Could not confirm booking ${payment.bookingId}: ${bookingError.message}`);
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
                    userId: payment.createdBy,
                });
            }

            return payment;
        } catch (error) {
            this.logger.error(`QPay payment check failed for payment ${paymentId}`, error.message);
            throw new BadRequestException(`QPay payment check failed: ${error.message}`);
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
            this.logger.error(`QPay callback processing failed for payment ${paymentId}`, error.message);
        }
    }
}
