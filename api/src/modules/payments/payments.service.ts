import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AuditService } from '../audit/audit.service';
import { Booking } from '../bookings/entities/booking.entity';

@Injectable()
export class PaymentsService {
    constructor(
        @InjectRepository(Payment)
        private paymentsRepository: Repository<Payment>,
        @InjectRepository(Booking)
        private bookingsRepository: Repository<Booking>,
        private readonly auditService: AuditService,
    ) { }

    async create(createPaymentDto: CreatePaymentDto, userId: number): Promise<Payment> {
        const payment = this.paymentsRepository.create(createPaymentDto);
        const savedPayment = await this.paymentsRepository.save(payment);

        // Audit Log
        await this.auditService.log({
            action: 'PAYMENT_CREATED',
            resource: 'Payment',
            resourceId: savedPayment.id.toString(),
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

    async findOne(id: number): Promise<Payment> {
        const payment = await this.paymentsRepository.findOne({
            where: { id },
            relations: ['booking'],
        });
        if (!payment) {
            throw new NotFoundException(`Payment #${id} not found`);
        }
        return payment;
    }

    async findByBooking(bookingId: number): Promise<Payment[]> {
        return this.paymentsRepository.find({
            where: { bookingId },
            order: { createdAt: 'DESC' },
        });
    }
}
