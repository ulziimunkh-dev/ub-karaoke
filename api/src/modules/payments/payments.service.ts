import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AuditService } from '../audit/audit.service';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { Refund } from './entities/refund.entity';
import { Booking } from '../bookings/entities/booking.entity';

@Injectable()
export class PaymentsService {
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
            userId: userId, // Assuming creatorId for payment is passed as userId (usually customer)
            // If we want to be safe, we'd check if user exists in users table, but let's assume it's correct for now
            // or use a more descriptive parameter name in the method.
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
}
